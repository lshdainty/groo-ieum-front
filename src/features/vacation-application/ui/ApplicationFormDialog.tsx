import { CalendarX2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@/shared/ds/avatar'
import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import { DatePicker, dayKey, formatDateValue, parseDayKey } from '@/shared/ds/date-picker'
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogCancel, ResponsiveDialogContent, ResponsiveDialogFooter } from '@/shared/ds/dialog'
import { Field } from '@/shared/ds/field'
import { Input } from '@/shared/ds/input'
import { List, ListButtonItem, ListHeader, ListItem } from '@/shared/ds/list'
import { ResultSection } from '@/shared/ds/result-section'
import { RadioSelectBox, RadioSelectBoxGroup } from '@/shared/ds/select-box'
import { Skeleton } from '@/shared/ds/skeleton'
import { useSnackbar } from '@/shared/ds/snackbar'
import { Textarea } from '@/shared/ds/textarea'
import { TimePicker, formatTimeValue, type TimeValue } from '@/shared/ds/time-picker'
import { ConfirmDialog } from '@/shared/ui/confirm'
import { splitGrantTime } from '@/shared/lib/groo/grant-time'
import { GrantTimeField } from '@/shared/ui/groo/grant-time-field'
import { PickerRow } from '@/shared/ui/groo/picker-row'
import { readWriteFailure } from '@/shared/ui/groo/write-error'
import { useUser } from '@/entities/session'
import { useUserApproversQuery } from '@/entities/user'
import { usePostRequestVacationMutation } from '@/entities/vacation'
import { useUserVacationPoliciesQuery, type GetUserVacationPoliciesResp } from '@/entities/vacation-policy'
import { useWide } from '@/widgets/layout/lib/use-wide'
import {
  emptyRequestForm,
  hasRequestErrors,
  isOvertimePolicy,
  overtimeMinutes,
  requestFormChanged,
  requestFormErrors,
  requestPayloadOf,
  requiredApprovers,
  type RequestFormValues,
} from '../lib/request-form'

type Policy = GetUserVacationPoliciesResp

/** 선택지 설명 — "{설명} · {정해진 시간 또는 '시간은 직접 정해요'} · 결재 {n}단계(0 이면 결재 없음)" */
const policyDescription = (p: Policy, t: (k: string, o?: Record<string, unknown>) => string): string =>
  t('req.form.policyDesc', {
    desc: p.vacation_policy_desc?.trim() || p.vacation_policy_name,
    time: p.is_flexible_grant === 'Y' ? t('req.form.timeFlexible') : p.grant_time_str,
    approval: p.approval_required_count > 0 ? t('req.form.approvalN', { n: p.approval_required_count }) : t('req.form.approvalNone'),
  })

/** 받을 휴가 합 글 — 0 칸 생략("4시간 30분"), 모두 0 이면 "0시간" */
const sumText = (total: number, t: (k: string, o?: Record<string, unknown>) => string): string => {
  const { days, hours, minutes } = splitGrantTime(total)
  const parts = [days > 0 ? t('req.form.sumDay', { n: days }) : '', hours > 0 ? t('req.form.sumHour', { n: hours }) : '', minutes > 0 ? t('req.form.sumMinute', { n: minutes }) : ''].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : t('req.form.sumZero')
}

/** 초과근무 시간 글 — 분까지("2시간 40분"), 0분이면 "2시간", 0시간이면 "40분", 0 이면 "0시간". 보이는 글만이고 서버로 가지 않는다 */
const durationText = (total: number, t: (k: string, o?: Record<string, unknown>) => string): string => {
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h > 0 && m > 0) return t('req.form.hoursMinutes', { h, m })
  if (h > 0) return t('req.form.hoursValue', { count: h })
  if (m > 0) return t('req.form.minutesValue', { count: m })
  return t('req.form.hoursValue', { count: 0 })
}

/** 날짜 줄 칸 — 값은 "YYYY-MM-DD", 누르면 1280 미만 시트 · 이상 Popover 의 Date Picker + [완료] */
const DayRow = ({ title, value, onChange, error, rowRef }: { title: string; value: string; onChange: (v: string) => void; error?: string; rowRef?: React.Ref<HTMLButtonElement> }) => {
  const { t } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  const [draft, setDraft] = useState<Date | undefined>(value ? parseDayKey(value) : undefined)
  return (
    <PickerRow
      ref={rowRef}
      title={title}
      surfaceTitle={title}
      value={value ? formatDateValue(parseDayKey(value), new Date()) : ''}
      placeholder={t('req.form.datePlaceholder')}
      errorMessage={error}
      onOpen={() => setDraft(value ? parseDayKey(value) : undefined)}
      pickerActions={({ close }) => (
        <Button
          disabled={!draft}
          onClick={() => {
            if (draft) onChange(dayKey(draft))
            close()
          }}
        >
          {tc('done')}
        </Button>
      )}
    >
      <DatePicker selection='single' visibleRange='month' aria-label={title} value={draft} onValueChange={setDraft} autoFocus />
    </PickerRow>
  )
}

/** 시각 줄 칸 — Time Picker 휠(분 간격 1 — 명시). 휠 시트는 끌어서 닫히지 않는다(닫기 · [완료] · Esc 로만) */
const TimeRow = ({ title, value, onChange, error }: { title: string; value: TimeValue | null; onChange: (v: TimeValue) => void; error?: string }) => {
  const { t } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  const [draft, setDraft] = useState<TimeValue | undefined>(value ?? undefined)
  return (
    <PickerRow
      title={title}
      surfaceTitle={title}
      value={value ? formatTimeValue(value) : ''}
      placeholder={t('req.form.timePlaceholder')}
      errorMessage={error}
      dismissible={false}
      onOpen={() => setDraft(value ?? undefined)}
      pickerActions={({ close }) => (
        <Button
          onClick={() => {
            const now = new Date()
            onChange(draft ?? { hour: now.getHours(), minute: now.getMinutes() })
            close()
          }}
        >
          {tc('done')}
        </Button>
      )}
    >
      <TimePicker aria-label={title} value={draft} onValueChange={setDraft} minuteStep={1} autoFocus />
    </PickerRow>
  )
}

/**
 * 휴가 신청 폼(I-25 E) — 정책 먼저 두 단계: ① "어떤 휴가를 신청할까요?"(정책 Select Box 1열 + [다음]) → ② 그 정책의 칸(제목 → 날짜 · 시각 | 받을 휴가 → 사유 → 결재자) + [결재 요청].
 * 1280 이상 대화상자(머리 ← 없이 바닥 [이전]) · 미만 시트(머리 ←). 정책을 바꿀 때 ② 에 친 값이 있으면 "입력한 내용이 지워져요" 로 묻는다.
 * 정책 · 결재자 질의는 quiet — 실패하면 표면 안 Result Section + [다시 시도], 그동안 [결재 요청]은 막는다(결재선을 모르면 보낼 수 없다).
 * 쓰기 실패는 표면 맨 위 Callout(고정 글), 칸 오류는 칸 아래(누르면 첫 오류 칸으로 초점).
 */
const ApplicationFormDialog = ({ open, onClose, onSubmitSuccess }: { open: boolean; onClose: () => void; onSubmitSuccess: () => void }) => {
  const { t } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  const snackbar = useSnackbar()
  const wide = useWide()
  const { loginUser } = useUser()
  const userId = loginUser?.user_id || ''
  const request = usePostRequestVacationMutation()
  const policiesQuery = useUserVacationPoliciesQuery(userId, 'ON_REQUEST', { quiet: true })
  const approversQuery = useUserApproversQuery(userId, { quiet: true })
  const policies = policiesQuery.data ?? []
  const approversData = approversQuery.data

  const [step, setStep] = useState<1 | 2>(1)
  const [pickedId, setPickedId] = useState('')
  const [policyId, setPolicyId] = useState('')
  const [pickError, setPickError] = useState(false)
  const [values, setValues] = useState<RequestFormValues>(emptyRequestForm())
  const [showErrors, setShowErrors] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [resetTo, setResetTo] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setStep(1)
    setPickedId('')
    setPolicyId('')
    setPickError(false)
    setValues(emptyRequestForm())
    setShowErrors(false)
    setSaveError(null)
    setResetTo(null)
  }, [open])

  const policy = policies.find((p) => String(p.vacation_policy_id) === policyId)
  const overtime = isOvertimePolicy(policy)
  const flexible = policy?.is_flexible_grant === 'Y'
  const withMinutes = policy?.minute_grant_yn === 'Y'
  const empty = { approvers: [], max_available_count: 0, is_auto_approval: false }
  const approvers = (approversData ?? empty).approvers
  const required = requiredApprovers(policy, approversData ?? empty)
  const policyRequired = policy?.approval_required_count || 0
  const errors = requestFormErrors(values, policy, required)
  const dirty = step === 2 && requestFormChanged(values)
  const set = <K extends keyof RequestFormValues>(key: K, value: RequestFormValues[K]) => setValues((v) => ({ ...v, [key]: value }))

  const enter = (id: string) => {
    setPolicyId(id)
    setValues(emptyRequestForm())
    setShowErrors(false)
    setSaveError(null)
    setStep(2)
  }
  const next = () => {
    if (!pickedId) {
      setPickError(true)
      return
    }
    if (pickedId === policyId) {
      setStep(2)
      return
    }
    // 정책을 바꾸면 ② 에 친 값이 이 정책에 맞지 않는다 — 친 값이 있으면 묻고, 없으면 바로
    if (policyId && requestFormChanged(values)) setResetTo(pickedId)
    else enter(pickedId)
  }

  const submit = async () => {
    if (busy || !policy || !userId) return
    if (hasRequestErrors(errors)) {
      setShowErrors(true)
      setTimeout(() => document.querySelector<HTMLElement>('[data-request-form] [aria-invalid="true"]')?.focus(), 0)
      return
    }
    setBusy(true)
    setSaveError(null)
    try {
      await request.mutateAsync(requestPayloadOf(userId, policy, values))
      onSubmitSuccess()
      onClose()
      snackbar.show({ message: t('req.form.saved'), tone: 'positive' })
    } catch (error) {
      readWriteFailure(error)
      setSaveError(t('req.form.saveFailed'))
    } finally {
      setBusy(false)
    }
  }

  const retryRow = (title: string, q: { isFetching: boolean; refetch: () => unknown }) => (
    <ResultSection kind='failure' size='medium' title={title} description={t('memberVacation.failureDescription')} primaryAction={{ label: tc('retry'), onClick: () => void q.refetch(), loading: q.isFetching }} />
  )

  const stepOne = policiesQuery.isLoadingError ? (
    retryRow(t('req.form.policyFailureTitle'), policiesQuery)
  ) : policiesQuery.isPending ? (
    <div className='flex flex-col gap-x3'>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} radius='12' className='block h-[72px] w-full' />
      ))}
    </div>
  ) : policies.length === 0 ? (
    <ResultSection size='medium' icon={<CalendarX2 />} title={t('req.form.noPolicy')} />
  ) : (
    <Field label={t('req.form.policyGroup')} labelHidden invalid={pickError} errorMessage={t('req.form.policyRequired')}>
      <RadioSelectBoxGroup
        value={pickedId}
        onValueChange={(v) => {
          setPickedId(v)
          setPickError(false)
        }}
        aria-label={t('req.form.policyGroup')}
        data-policy-group
      >
        {policies.map((p) => (
          <RadioSelectBox key={p.vacation_policy_id} value={String(p.vacation_policy_id)} label={p.vacation_policy_name} description={policyDescription(p, t)} data-policy={p.vacation_policy_id} />
        ))}
      </RadioSelectBoxGroup>
    </Field>
  )

  const overtimeMin = overtimeMinutes(values.start, values.end)
  const approverRows = Array.from({ length: required }).map((_, i) => {
    const k = i + 1
    const chosen = values.approvers[i] ?? ''
    const person = approvers.find((a) => a.user_id === chosen)
    const takenAt = (id: string) => values.approvers.findIndex((a, j) => a === id && j !== i)
    return (
      <PickerRow
        key={k}
        title={t('req.form.approverStep', { k })}
        surfaceTitle={t('req.form.approverPickTitle', { k })}
        value={person ? person.user_name : ''}
        placeholder={t('req.form.approverPick')}
        errorMessage={showErrors && errors.approvers.includes(k) ? t('req.form.approverRequired', { k }) : undefined}
        scrollFog
      >
        {({ close }) => (
          <List>
            {approvers.map((a) => {
              const at = takenAt(a.user_id)
              return (
                <ListButtonItem
                  key={a.user_id}
                  prefix={<Avatar name={a.user_name} size={24} />}
                  title={a.user_name}
                  detail={at >= 0 ? t('req.form.approverTaken', { k: at + 1 }) : a.department_name_kr}
                  disabled={at >= 0}
                  aria-pressed={chosen === a.user_id}
                  data-approver={a.user_id}
                  onClick={() => {
                    set('approvers', Object.assign([...values.approvers], { [i]: a.user_id }))
                    close()
                  }}
                />
              )
            })}
          </List>
        )}
      </PickerRow>
    )
  })

  const stepTwo = !policy ? null : (
    <div className='flex flex-col gap-x6 pb-x2' data-request-form>
      <Field label={t('req.form.title')} invalid={showErrors && !!errors.title} errorMessage={t('req.form.titleRequired')}>
        <Input
          ref={titleRef}
          value={values.title}
          placeholder={overtime ? t('req.form.titlePlaceholderComp') : t('req.form.titlePlaceholderVacation')}
          aria-invalid={(showErrors && !!errors.title) || undefined}
          onChange={(e) => set('title', e.target.value)}
        />
      </Field>
      <div className='-mx-x6 flex flex-col' data-request-rows>
        <DayRow title={overtime ? t('req.form.overtimeDay') : t('req.form.day')} value={values.day} onChange={(v) => set('day', v)} error={showErrors && errors.day ? t('req.form.dayRequired') : undefined} />
        {overtime && (
          <>
            <TimeRow title={t('req.form.start')} value={values.start} onChange={(v) => set('start', v)} error={showErrors && errors.start ? t('req.form.startRequired') : undefined} />
            <TimeRow
              title={t('req.form.end')}
              value={values.end}
              onChange={(v) => set('end', v)}
              error={showErrors && errors.end ? (errors.end === 'order' ? t('req.form.endAfterStart') : t('req.form.endRequired')) : undefined}
            />
            <List>
              <ListItem title={t('req.form.hours')} data-overtime-hours suffix={<span className='text-t5 font-bold tabular-nums text-fg-neutral'>{durationText(overtimeMin, t)}</span>} />
            </List>
          </>
        )}
      </div>
      {flexible && (
        <GrantTimeField
          label={t('req.form.grant')}
          required={false}
          value={values.grantTime}
          onValueChange={(total) => set('grantTime', total)}
          withMinutes={withMinutes}
          description={t('req.form.grantSum', { sum: sumText(values.grantTime, t) })}
          invalid={showErrors && !!errors.grant}
          errorMessage={t('req.form.grantRequired')}
        />
      )}
      <Field label={t('req.form.reason')} invalid={showErrors && !!errors.reason} errorMessage={t('req.form.reasonRequired')}>
        <Textarea
          value={values.reason}
          placeholder={overtime ? t('req.form.reasonCompPlaceholder') : t('req.form.reasonVacationPlaceholder')}
          aria-invalid={(showErrors && !!errors.reason) || undefined}
          onChange={(e) => set('reason', e.target.value)}
        />
      </Field>
      <div className='flex flex-col gap-x2' data-approvers>
        {approversQuery.isLoadingError ? (
          retryRow(t('req.form.approversFailureTitle'), approversQuery)
        ) : approversQuery.isPending ? (
          <Skeleton radius='12' className='block h-[56px] w-full' />
        ) : approversData?.is_auto_approval && policyRequired > 0 ? (
          <Callout tone='informative'>{t('req.form.autoApprovalCallout')}</Callout>
        ) : required === 0 ? (
          <p className='m-0 text-t4 text-fg-neutral-muted'>{t('req.form.autoApproval')}</p>
        ) : (
          <>
            {required < policyRequired && <Callout tone='informative'>{t('req.form.reducedCallout', { required: policyRequired, available: required })}</Callout>}
            <div className='-mx-x6 flex flex-col' data-approver-rows>
              <ListHeader as='h3'>{t('req.form.approvers', { n: required })}</ListHeader>
              {approverRows}
            </div>
          </>
        )}
      </div>
      <p className='m-0 text-t3 text-fg-neutral-subtle'>{t('req.form.notice')}</p>
    </div>
  )

  const title = step === 1 || !policy ? t('req.form.step1Title') : overtime ? t('req.form.titleComp') : t('req.form.titleVacation')
  const description =
    step === 1 || !policy
      ? t('req.form.step1Desc')
      : t('req.form.step2Desc', { policy: policy.vacation_policy_name, approval: policyRequired > 0 ? t('req.form.approvalN', { n: policyRequired }) : t('req.form.approvalNone') })

  return (
    <>
      <ResponsiveDialog open={open} form dirty={dirty} busy={busy} onOpenChange={(o) => !o && onClose()}>
        <ResponsiveDialogContent title={title} description={description} onBack={step === 2 && !wide ? () => setStep(1) : undefined}>
          <ResponsiveDialogBody>
            {saveError && (
              <Callout tone='critical' role='alert' className='mb-x4' data-save-failure>
                {saveError}
              </Callout>
            )}
            {step === 1 ? stepOne : stepTwo}
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            {step === 2 && wide && (
              <Button variant='ghost' disabled={busy} onClick={() => setStep(1)} data-request-prev>
                {t('req.form.prev')}
              </Button>
            )}
            <ResponsiveDialogCancel>{tc('cancel')}</ResponsiveDialogCancel>
            {step === 1 ? (
              <Button variant='neutralSolid' disabled={policiesQuery.isPending || policiesQuery.isLoadingError || policies.length === 0} onClick={next} data-request-next>
                {t('req.form.next')}
              </Button>
            ) : (
              <Button variant='brandSolid' loading={busy} disabled={approversQuery.isPending || approversQuery.isLoadingError} onClick={() => void submit()} data-request-submit>
                {t('req.form.submit')}
              </Button>
            )}
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
      <ConfirmDialog
        open={resetTo !== null}
        onOpenChange={(o) => {
          if (!o) {
            // [계속 작성] — 정책은 그대로 두고 ② 로 돌아간다
            setResetTo(null)
            setStep(2)
          }
        }}
        kind='reset'
        tone='neutralSolid'
        title={t('req.form.resetTitle')}
        description={t('req.form.resetDesc')}
        confirmLabel={t('req.form.change')}
        cancelLabel={t('req.form.keep')}
        onConfirm={() => {
          if (resetTo) enter(resetTo)
        }}
      />
    </>
  )
}

export { ApplicationFormDialog }
