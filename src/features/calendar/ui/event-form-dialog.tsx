import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@/shared/ds/avatar'
import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogCancel, ResponsiveDialogContent, ResponsiveDialogFooter } from '@/shared/ds/dialog'
import { Field } from '@/shared/ds/field'
import { Input } from '@/shared/ds/input'
import { List, ListButtonItem, ListHeader } from '@/shared/ds/list'
import { ResultSection } from '@/shared/ds/result-section'
import { Skeleton } from '@/shared/ds/skeleton'
import { useSnackbar } from '@/shared/ds/snackbar'
import { formatClock } from '@/shared/lib/date-text'
import { DayRow } from '@/shared/ui/groo/day-row'
import { PickerRow } from '@/shared/ui/groo/picker-row'
import { TimeRow } from '@/shared/ui/groo/time-row'
import { readWriteFailure } from '@/shared/ui/groo/write-error'
import { usePermission, useUser } from '@/entities/session'
import { useVacationTypesQuery } from '@/entities/type'
import { useUsersQuery } from '@/entities/user'
import { useAvailableVacationsQuery } from '@/entities/vacation'
import { eventRange } from '@/features/calendar/lib/event-payload'
import { eventFormChanged, eventFormErrors, hasEventFormErrors, initialValues, typeOf, valuesOfEvent, type EventFormValues } from '@/features/calendar/lib/event-form'
import { eventTone } from '@/features/calendar/lib/helpers'
import { useAddEvent } from '@/features/calendar/lib/hooks/use-add-event'
import { useUpdateEvent } from '@/features/calendar/lib/hooks/use-update-event'
import { calendarTypes } from '@/features/calendar/model/types'
import type { CreatingEvent } from '@/features/calendar/model/use-calendar-screen'
import type { IEvent } from '@/features/calendar/model/interfaces'

interface IProps {
  open: boolean
  onClose: () => void
  /** 고칠 기록 — 주면 고치기(제목 "일정 수정"), 없으면 만들기. 요청 경로는 이 기록의 kind 가 정한다 */
  event?: IEvent | null
  /** 만들기의 시작 값 — 그 날(기간) · 시각 */
  start?: CreatingEvent | null
  /** 구성원 휴가 > 직원 휴가 탭에서만 — 고른 직원으로 고정한다(대상 줄을 숨기고 그 직원의 휴가로 올린다). 휴가 종류만 고른다 */
  fixedUser?: { id: string; name: string; department?: string | null }
  /** 바닥 왼쪽 [삭제](고치기만 · 폰 시트) — 고친 값을 버리고 삭제 확인을 부르는 쪽이 연다 */
  onDelete?: () => void
}

/**
 * 일정 폼(G 41) — 1280 이상 대화상자 480 · 미만 시트 + 줄 칸. 칸 차례: 내용(Input) → 줄 칸(대상 · 종류 · 쓸 휴가 · 시작 날짜 · 끝 날짜 · 시작 시각 · 끝 시각).
 * 시작 시각은 Time Picker 분 간격 30 · 시 제한 없음 — 근무 시간 밖은 서버가 WORK_004 로 거절하고 그 사유를 시각 칸 아래에 둔다.
 * 고치기는 같은 종류 그룹(휴가 ↔ 휴가 · 일정 ↔ 일정)만 고른다 — 번호가 다른 표의 PUT 으로 가지 않게.
 * 쓰기 실패는 서버 글이 아니라 사유 표 고정 글: 시각 · 쓸 휴가 사유는 그 칸 아래, 그 밖은 맨 위 Callout. 저장 뒤 Snackbar.
 */
export function EventFormDialog({ open, onClose, event, start, fixedUser, onDelete }: IProps) {
  const { t } = useTranslation('calendar')
  const { t: tc } = useTranslation('common')
  const snackbar = useSnackbar()
  const { loginUser } = useUser()
  const { hasAnyPermission } = usePermission()
  const editing = !!event
  const canUseVacation = hasAnyPermission(['VACATION:USE', 'VACATION:MANAGE'])
  const canUseSchedule = hasAnyPermission(['SCHEDULE:WRITE', 'SCHEDULE:MANAGE'])
  const canManageVacation = hasAnyPermission(['VACATION:MANAGE'])
  const loginId = loginUser?.user_id || ''

  const users = useUsersQuery({ quiet: true })
  const userOptions = useMemo(() => {
    const list = users.data ?? []
    if (loginUser && !list.some((u) => u.user_id === loginUser.user_id)) return [{ user_id: loginUser.user_id, user_name: loginUser.user_name, user_work_time: '' }, ...list]
    return list
  }, [users.data, loginUser])

  const makeInitial = (): EventFormValues => (event ? valuesOfEvent(event) : initialValues({ date: start?.date, endDate: start?.endDate, startTime: start?.startTime, targetUser: fixedUser?.id ?? loginId }))
  const [initial, setInitial] = useState<EventFormValues>(makeInitial)
  const [values, setValues] = useState<EventFormValues>(makeInitial)
  const [showErrors, setShowErrors] = useState(false)
  const [saveKey, setSaveKey] = useState<{ code: string | null; key: string } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    const v = makeInitial()
    setInitial(v)
    setValues(v)
    setShowErrors(false)
    setSaveKey(null)
    // 열릴 때 한 번 — 값은 열린 뒤 사용자가 바꾼다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const set = <K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    setSaveKey(null)
  }

  const type = typeOf(values.type)
  const isVacation = type?.type === 'vacation'
  const timed = !!type && !type.isDate
  const errors = eventFormErrors(values)
  const dirty = eventFormChanged(initial, values)

  // 대상 — 고치기는 그 기록의 주인, 만들기는 관리자가 고른 사람 · 고정한 직원 · 나
  const targetId = fixedUser?.id ?? (editing ? event!.user.id || loginId : canManageVacation ? values.targetUser || loginId : loginId)
  const workTime = userOptions.find((u) => u.user_id === targetId)?.user_work_time

  const startIso = values.startDate ? `${values.startDate}T00:00:00` : ''
  const available = useAvailableVacationsQuery(targetId, startIso, { quiet: true, enabled: open && isVacation })
  const vacationTypes = useVacationTypesQuery({ quiet: true })

  const addEvent = useAddEvent()
  const updateEvent = useUpdateEvent()

  // 시작 날짜를 끝 날짜보다 뒤로 옮기면 끝이 따라간다
  const setStartDate = (day: string) =>
    setValues((v) => ({ ...v, startDate: day, endDate: v.endDate && day > v.endDate ? day : v.endDate }))

  const vacationOptions = useMemo(() => {
    const rows = (available.data?.vacations ?? []).map((v) => ({ code: v.vacation_type, name: v.vacation_type_name, remain: v.remain_time_str as string | null }))
    // 고치는 기록의 쓸 휴가가 지금 쓸 수 있는 목록에 없으면(다 쓴 휴가) 이름만이라도 보인다
    if (editing && event!.vacationType && !rows.some((r) => r.code === event!.vacationType)) {
      const info = vacationTypes.data?.find((v) => v.code === event!.vacationType)
      if (info) rows.push({ code: info.code, name: info.name, remain: null })
    }
    return rows
  }, [available.data, editing, event, vacationTypes.data])
  const usedLabel = (code: string): string => {
    const row = vacationOptions.find((r) => r.code === code)
    if (!row) return ''
    return row.remain ? t('form.useVacationValue', { name: row.name, remain: row.remain }) : row.name
  }

  const submit = async () => {
    if (busy || users.isLoadingError) return
    if (hasEventFormErrors(errors)) {
      setShowErrors(true)
      setTimeout(() => document.querySelector<HTMLElement>('[data-event-form] [aria-invalid="true"]')?.focus(), 0)
      return
    }
    setBusy(true)
    setSaveKey(null)
    const input = {
      userId: targetId,
      calendarType: values.type,
      vacationType: isVacation ? values.vacationType : undefined,
      desc: values.desc.trim(),
      startDate: values.startDate,
      endDate: values.endDate,
      startHour: String(values.startTime?.hour ?? 0),
      startMinute: String(values.startTime?.minute ?? 0),
      userWorkTime: workTime,
    }
    try {
      if (editing) await updateEvent.updateFromForm({ ...input, eventId: event!.id, kind: event!.kind })
      else await addEvent.addEvent(input)
      onClose()
      snackbar.show({ message: t(editing ? 'form.saved' : 'form.created'), tone: 'positive' })
    } catch (error) {
      const { code, key } = readWriteFailure(error)
      setSaveKey({ code, key: key ?? 'failure.write' })
    } finally {
      setBusy(false)
    }
  }

  // 같은 kind 의 종류만 — 고치기는 그 기록의 kind, 만들기는 권한이 있는 그룹(직원 고정은 휴가만)
  const groups = (['vacation', 'schedule'] as const).filter((k) => (editing ? event!.kind === k : k === 'vacation' ? canUseVacation : canUseSchedule && !fixedUser))
  const typeRow = (
    <PickerRow
      title={t('form.type')}
      surfaceTitle={t('form.type')}
      value={type ? t(type.nameKey) : ''}
      placeholder={t('form.typePlaceholder')}
      dot={type ? eventTone({ type }).color : undefined}
      errorMessage={showErrors && errors.type ? t('form.typeRequired') : undefined}
      scrollFog
    >
      {({ close }) => (
        <>
          {groups.map((kind) => (
            <div key={kind}>
              <ListHeader as='h3'>{t(kind === 'vacation' ? 'form.vacationGroup' : 'form.scheduleGroup')}</ListHeader>
              <List>
                {calendarTypes
                  .filter((c) => c.type === kind)
                  .map((c) => (
                    <ListButtonItem
                      key={c.id}
                      title={t(c.nameKey)}
                      prefix={<span aria-hidden className='size-x2 shrink-0 rounded-full' style={{ background: eventTone({ type: c }).color }} />}
                      aria-pressed={values.type === c.id}
                      data-event-type={c.id}
                      onClick={() => {
                        set('type', c.id)
                        close()
                      }}
                    />
                  ))}
              </List>
            </div>
          ))}
        </>
      )}
    </PickerRow>
  )

  const targetRow =
    !fixedUser && !editing && canManageVacation ? (
      <PickerRow
        title={t('form.target')}
        surfaceTitle={t('form.target')}
        value={userOptions.find((u) => u.user_id === values.targetUser)?.user_name ?? ''}
        placeholder={t('form.targetPlaceholder')}
        scrollFog
      >
        {({ close }) => (
          <List>
            {userOptions.map((u) => (
              <ListButtonItem
                key={u.user_id}
                prefix={<Avatar name={u.user_name} size={24} />}
                title={u.user_name}
                aria-pressed={values.targetUser === u.user_id}
                data-event-target={u.user_id}
                onClick={() => {
                  // 다른 사람이면 그 사람의 쓸 휴가 목록이 달라진다 — 고른 쓸 휴가는 비운다
                  setValues((v) => ({ ...v, targetUser: u.user_id, vacationType: '' }))
                  setSaveKey(null)
                  close()
                }}
              />
            ))}
          </List>
        )}
      </PickerRow>
    ) : editing && event!.user.id !== loginId ? (
      <PickerRow title={t('form.target')} surfaceTitle={t('form.target')} value={event!.user.name} readOnly />
    ) : null

  const insufficient = saveKey?.code === 'VACATION_002' ? tc(saveKey.key) : undefined
  const timeError = saveKey?.code === 'WORK_004' ? tc(saveKey.key) : showErrors && errors.startTime ? t('form.startTimeRequired') : undefined
  const topFailure = saveKey && saveKey.code !== 'VACATION_002' && saveKey.code !== 'WORK_004' ? tc(saveKey.key) : null

  const vacationRow = isVacation ? (
    <PickerRow
      title={t('form.useVacation')}
      surfaceTitle={t('form.useVacation')}
      value={values.vacationType ? usedLabel(values.vacationType) : ''}
      placeholder={t('form.useVacationPlaceholder')}
      errorMessage={insufficient ?? (showErrors && errors.vacationType ? t('form.useVacationRequired') : undefined)}
      scrollFog
    >
      {({ close }) =>
        available.isLoadingError ? (
          <ResultSection kind='failure' size='medium' title={t('form.vacationLoadFailed')} description={t('loadFailed.description')} primaryAction={{ label: tc('retry'), onClick: () => void available.refetch(), loading: available.isFetching }} />
        ) : available.isPending && !editing ? (
          <div className='flex flex-col gap-x3 px-x6'>
            {[0, 1].map((i) => (
              <Skeleton key={i} radius='12' className='block h-[56px] w-full' />
            ))}
          </div>
        ) : vacationOptions.length === 0 ? (
          <p className='m-0 px-x6 py-x6 text-center text-t4 text-fg-neutral-subtle'>{t('form.noVacation')}</p>
        ) : (
          <List>
            {vacationOptions.map((r) => (
              <ListButtonItem
                key={r.code}
                title={r.name}
                detail={r.remain ? t('form.remain', { remain: r.remain }) : undefined}
                aria-pressed={values.vacationType === r.code}
                data-event-vacation={r.code}
                onClick={() => {
                  set('vacationType', r.code)
                  close()
                }}
              />
            ))}
          </List>
        )
      }
    </PickerRow>
  ) : null

  const endClock = timed && values.startTime ? formatClock(eventRange({ userId: '', calendarType: values.type, startDate: values.startDate, endDate: values.endDate, startHour: String(values.startTime.hour), startMinute: String(values.startTime.minute), userWorkTime: workTime }).end_date) : ''

  return (
    <ResponsiveDialog open={open} form dirty={dirty} busy={busy} onOpenChange={(o) => !o && onClose()}>
      <ResponsiveDialogContent title={t(editing ? 'form.titleEdit' : 'form.titleAdd')}>
        <ResponsiveDialogBody>
          <div className='flex flex-col gap-x6 pb-x2' data-event-form>
            {topFailure && (
              <Callout tone='critical' role='alert' data-save-failure>
                {topFailure}
              </Callout>
            )}
            {fixedUser && (
              <p className='m-0 text-t4 text-fg-neutral-muted' data-fixed-user>
                {t('addEvent.fixedUser', { name: fixedUser.name, detail: fixedUser.department?.trim() ? `${fixedUser.id} · ${fixedUser.department}` : fixedUser.id })}
              </p>
            )}
            {users.isLoadingError && (
              <Callout tone='critical' role='alert' data-users-failed>
                <span className='block'>{t('form.usersFailed')}</span>
                <Button variant='ghost' size='small' flush='left' loading={users.isFetching} onClick={() => void users.refetch()} data-users-retry>
                  {tc('retry')}
                </Button>
              </Callout>
            )}
            <Field label={t('form.desc')} showRequiredIndicator invalid={showErrors && errors.desc} errorMessage={t('form.descRequired')}>
              <Input value={values.desc} placeholder={t('form.descPlaceholder')} aria-invalid={(showErrors && errors.desc) || undefined} onChange={(e) => set('desc', e.target.value)} />
            </Field>
            <div className='-mx-x6 flex flex-col' data-event-rows>
              {targetRow}
              {typeRow}
              {vacationRow}
              <DayRow title={t('form.startDate')} value={values.startDate} onChange={setStartDate} placeholder={t('form.datePlaceholder')} />
              <DayRow title={t('form.endDate')} value={values.endDate} onChange={(d) => set('endDate', d)} placeholder={t('form.datePlaceholder')} error={showErrors && errors.endDate ? t('form.endBeforeStart') : undefined} />
              {timed && (
                <>
                  <TimeRow title={t('form.startTime')} value={values.startTime} onChange={(v) => set('startTime', v)} placeholder={t('form.timePlaceholder')} minuteStep={30} error={timeError} />
                  <PickerRow title={t('form.endTime')} surfaceTitle={t('form.endTime')} value={endClock} readOnly />
                </>
              )}
            </div>
          </div>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          {editing && onDelete && (
            <Button variant='ghost' ghostColor='critical' size='large' disabled={busy} onClick={onDelete} data-event-delete>
              {tc('delete')}
            </Button>
          )}
          <ResponsiveDialogCancel>{tc('cancel')}</ResponsiveDialogCancel>
          <Button variant='neutralSolid' loading={busy} disabled={users.isLoadingError} onClick={() => void submit()} data-event-submit>
            {tc('save')}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
