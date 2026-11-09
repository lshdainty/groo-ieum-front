import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { claimFailure, writeFailureKey } from '@/shared/api/failure'
import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import { Checkbox } from '@/shared/ds/checkbox'
import { ChipRadio, ChipRadioGroup } from '@/shared/ds/chip'
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogCancel, ResponsiveDialogContent, ResponsiveDialogFooter } from '@/shared/ds/dialog'
import { Field } from '@/shared/ds/field'
import { Input } from '@/shared/ds/input'
import { useInputButtonSurface } from '@/shared/ds/input-button'
import { useSnackbar } from '@/shared/ds/snackbar'
import { Textarea } from '@/shared/ds/textarea'
import { PeriodField } from '@/shared/ui/groo/period-field'
import { useCreateNoticeMutation, useUpdateNoticeMutation, type NoticeListResp, type NoticeType } from '@/entities/notice'
import { useUser } from '@/entities/session'
import { NOTICE_TYPES, NOTICE_TYPE_KEY, emptyNoticeForm, noticeCreateOf, noticeFormChanged, noticeFormErrors, noticeFormOf, noticeUpdateOf, type NoticeFormValues } from '../lib/notice-form'

export type NoticeFormTarget = { kind: 'add' } | { kind: 'edit'; row: NoticeListResp }

const TITLE_MAX = 200

/**
 * 공지 폼(I-24 J 49) — ds Responsive Dialog `form`(1280 이상 대화상자 · 미만 Bottom Sheet), 바닥 [취소] [저장].
 * 칸 차례: 제목 → 종류(Chip 넷) → "맨 위에 고정해요" → 게시 기간(기간 Date Picker) → 본문(Textarea, 평문). 본문이 길면 본문만 스크롤.
 * 수정은 지금처럼 본문 칸이 비어 열린다(목록 응답에 본문이 없고, 상세를 받으면 서버가 조회수를 올린다) — 칸 아래 안내가 다시 쓰라고 말한다.
 * 저장 실패는 폼 맨 위 Callout(고정 글).
 * 폰(시트)에서 줄을 눌러 연 수정 폼은 바닥 왼쪽에 [삭제](10-25 줄 동작).
 */
export function NoticeFormDialog({
  open,
  target,
  onOpenChange,
  onSaved,
  onCloseAutoFocus,
  onDelete,
}: {
  open: boolean
  target: NoticeFormTarget
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  onCloseAutoFocus?: (e: Event) => void
  onDelete?: (row: NoticeListResp) => void
}) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const snackbar = useSnackbar()
  const { loginUser } = useUser()
  const sheet = useInputButtonSurface() === 'sheet'
  const editing = target.kind === 'edit'
  // 목록 응답에는 본문이 없다 — 상세를 받아 채우면 서버가 조회수를 올려(공지 상세 GET) 관리자 수정마다 조회가 쌓인다.
  // 그래서 지금처럼 본문 칸을 비워 열고 다시 쓰게 한다(서버 후속 후보: 관리용 상세 · 목록 응답에 본문)
  const initial: NoticeFormValues = target.kind === 'edit' ? noticeFormOf({ ...target.row, content: '' }) : emptyNoticeForm()
  const [values, setValues] = useState<NoticeFormValues>(initial)
  const [showErrors, setShowErrors] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const create = useCreateNoticeMutation()
  const update = useUpdateNoticeMutation()

  const set = <K extends keyof NoticeFormValues>(key: K, value: NoticeFormValues[K]) => setValues((v) => ({ ...v, [key]: value }))
  const errors = noticeFormErrors(values)
  const dirty = noticeFormChanged(values, initial)

  const submit = async () => {
    if (busy) return
    if (errors.title || errors.content || errors.period) {
      setShowErrors(true)
      if (errors.title) titleRef.current?.focus()
      return
    }
    setBusy(true)
    setSaveError(null)
    try {
      if (target.kind === 'edit') await update.mutateAsync({ noticeId: target.row.notice_id, data: noticeUpdateOf(values) })
      else await create.mutateAsync(noticeCreateOf(values, loginUser?.user_id ?? ''))
      onSaved()
      snackbar.show({ message: t('adminNotice.saved'), tone: 'positive' })
    } catch (error) {
      claimFailure(error)
      const key = writeFailureKey(error)
      if (key) setSaveError(key === 'failure.write' ? t('adminNotice.saveFailed') : tc(key))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ResponsiveDialog open={open} form dirty={dirty} busy={busy} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        title={editing ? t('notice.editTitle') : t('notice.addTitle')}
        onOpenAutoFocus={(e) => {
          if (editing) return
          e.preventDefault()
          titleRef.current?.focus({ preventScroll: true })
        }}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <ResponsiveDialogBody>
          {saveError && (
            <Callout tone='critical' role='alert' className='mb-x4' data-save-failure>
              {saveError}
            </Callout>
          )}
          <div className='flex flex-col gap-x6 pb-x2'>
            <Field label={t('adminNotice.title')} showRequiredIndicator invalid={showErrors && !!errors.title} errorMessage={t('adminNotice.titleRequired')} maxGraphemeCount={TITLE_MAX}>
              <Input ref={titleRef} value={values.title} placeholder={t('notice.titlePlaceholder')} maxLength={TITLE_MAX} onChange={(e) => set('title', e.target.value.slice(0, TITLE_MAX))} />
            </Field>
            <Field label={t('adminNotice.type')}>
              <ChipRadioGroup aria-label={t('adminNotice.type')} value={values.type} onValueChange={(v) => set('type', v as NoticeType)}>
                {NOTICE_TYPES.map((type) => (
                  <ChipRadio key={type} value={type} variant='outlineWeak' size='medium'>
                    {t(NOTICE_TYPE_KEY[type])}
                  </ChipRadio>
                ))}
              </ChipRadioGroup>
            </Field>
            <Checkbox label={t('adminNotice.pinnedCheck')} checked={values.pinned} onCheckedChange={(c) => set('pinned', c === true)} data-notice-pinned />
            <PeriodField
              label={t('adminNotice.period')}
              placeholder={t('adminNotice.periodPlaceholder')}
              value={{ start: values.start, end: values.end }}
              onValueChange={(p) => setValues((v) => ({ ...v, start: p.start, end: p.end }))}
              invalid={showErrors && !!errors.period}
              errorMessage={t('adminNotice.periodRequired')}
            />
            <Field
              label={t('adminNotice.content')}
              showRequiredIndicator
              description={editing ? t('adminNotice.contentEditHint') : undefined}
              invalid={showErrors && !!errors.content}
              errorMessage={t('adminNotice.contentRequired')}
            >
              <Textarea value={values.content} placeholder={t('notice.contentPlaceholder')} onChange={(e) => set('content', e.target.value)} />
            </Field>
          </div>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          {editing && sheet && onDelete && (
            <Button variant='ghost' ghostColor='critical' size='large' disabled={busy} onClick={() => onDelete(target.row)} data-notice-delete>
              {tc('delete')}
            </Button>
          )}
          <ResponsiveDialogCancel>{tc('cancel')}</ResponsiveDialogCancel>
          <Button loading={busy} onClick={() => void submit()}>
            {tc('save')}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
