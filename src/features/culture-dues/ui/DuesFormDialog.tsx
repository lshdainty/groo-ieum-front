import { useRef, useState } from 'react'
import { CalendarDays, EllipsisVertical, Copy, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { writeFailureKey, claimFailure } from '@/shared/api/failure'
import { dsText } from '@/shared/ds/i18n'
import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import { ChipRadio, ChipRadioGroup } from '@/shared/ds/chip'
import { DatePicker, dayKey, formatDateValue, parseDayKey } from '@/shared/ds/date-picker'
import { BottomSheet, BottomSheetBody, BottomSheetContent, BottomSheetFooter } from '@/shared/ds/bottom-sheet'
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogCancel,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
} from '@/shared/ds/dialog'
import { Field } from '@/shared/ds/field'
import { Input } from '@/shared/ds/input'
import { InputButton, useInputButtonSurface } from '@/shared/ds/input-button'
import { ResponsiveMenu, ResponsiveMenuContent, ResponsiveMenuItem, ResponsiveMenuTrigger } from '@/shared/ds/menu'
import { Popover, PopoverBody, PopoverContent, PopoverFooter, PopoverTrigger } from '@/shared/ds/popover'
import { SegmentedControl, SegmentedControlItem } from '@/shared/ds/segmented-control'
import { Textarea } from '@/shared/ds/textarea'
import { AmountInput } from '@/shared/ui/groo/amount-input'
import { usePostDuesMutation, usePutDuesMutation, type GetYearDuesResp } from '@/entities/dues'
import {
  DUES_DETAIL_MAX,
  DUES_NAME_MAX,
  DUES_TYPES,
  DUES_TYPE_KEY,
  duesFormChanged,
  duesFormErrors,
  duesFormOf,
  duesPayloadOf,
  emptyDuesForm,
  type DuesCalc,
  type DuesFormValues,
  type DuesType,
} from '../lib/dues-form'
import { duesRowName } from '../lib/dues-format'

/** 폼이 무엇을 하나 — 새 줄 · 그 줄 값으로 채운 새 줄(복사해서 추가) · 그 줄 수정 */
export type DuesFormTarget = { kind: 'add' } | { kind: 'copy'; row: GetYearDuesResp } | { kind: 'edit'; row: GetYearDuesResp }

const initialOf = (target: DuesFormTarget): DuesFormValues => (target.kind === 'add' ? emptyDuesForm() : duesFormOf(target.row))

/** 날짜 칸 — Input Button 하나가 Date Picker 를 연다(1280 이상 팝오버 · 미만 시트). 필수라 지우기는 없다 */
function DateField({ value, onChange, invalid, inputRef }: { value: string; onChange: (next: string) => void; invalid: boolean; inputRef: React.Ref<HTMLButtonElement> }) {
  const { t } = useTranslation('culture')
  const surface = useInputButtonSurface()
  const [open, setOpen] = useState(false)
  const current = value ? parseDayKey(value) : undefined
  const [draft, setDraft] = useState<Date | undefined>(current)
  const label = t('dues.form.date')
  const trigger = (
    <InputButton
      ref={inputRef}
      placeholder={t('dues.form.datePlaceholder')}
      value={current ? formatDateValue(current, new Date()) : ''}
      suffixIcon={<CalendarDays />}
      aria-haspopup='dialog'
      aria-expanded={open}
      aria-invalid={invalid || undefined}
      onClick={() => {
        setDraft(current)
        setOpen(true)
      }}
    />
  )
  const picker = (
    <DatePicker selection='single' visibleRange='month' aria-label={label} value={draft} onValueChange={setDraft} autoFocus />
  )
  const done = (
    <Button
      disabled={!draft}
      onClick={() => {
        if (draft) onChange(dayKey(draft))
        setOpen(false)
      }}
    >
      {t('dues.form.done')}
    </Button>
  )
  return (
    <Field label={label} showRequiredIndicator invalid={invalid} errorMessage={t('dues.form.dateRequired')}>
      {surface === 'sheet' ? (
        <BottomSheet open={open} onOpenChange={setOpen}>
          {trigger}
          <BottomSheetContent title={label}>
            <BottomSheetBody>{picker}</BottomSheetBody>
            <BottomSheetFooter>{done}</BottomSheetFooter>
          </BottomSheetContent>
        </BottomSheet>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent aria-label={label} align='start'>
            <PopoverBody>{picker}</PopoverBody>
            <PopoverFooter>{done}</PopoverFooter>
          </PopoverContent>
        </Popover>
      )}
    </Field>
  )
}

/**
 * 입출금 추가 · 수정 폼(E 41) — ds Responsive Dialog `form`(1280 이상 대화상자 · 미만 Bottom Sheet), 바닥 [취소] [저장] · 머리 ✕ 없음.
 * 칸 차례: 입금 · 출금 → 금액 → 날짜 → 분류 → 이름 → 내용. 바뀐 채 닫으면 "작성한 내용이 사라져요"(ds 가 묻는다).
 * 저장 실패는 폼 맨 위 Callout(고정 글 — 서버 글을 그리지 않는다), 칸 오류는 칸 아래. [저장] 은 켜 두고 누를 때 검사한다.
 * 폰 목록에서 연 수정 시트(`rowActions`)에는 머리에 ⋮ 하나(복사해서 추가 · 삭제) — 폰 줄에는 ⋮ 를 두지 않는다(menu.md "줄의 동작").
 */
export function DuesFormDialog({
  open,
  target,
  onOpenChange,
  onSaved,
  onCloseAutoFocus,
  rowActions,
}: {
  open: boolean
  target: DuesFormTarget
  onOpenChange: (open: boolean) => void
  /** 저장이 끝났다 — 부모가 닫는다 */
  onSaved: () => void
  onCloseAutoFocus?: (e: Event) => void
  /** 폰 수정 시트 머리 ⋮ 의 동작 — 없으면 머리 ⋮ 를 두지 않는다 */
  rowActions?: { onCopy: (row: GetYearDuesResp) => void; onDelete: (row: GetYearDuesResp) => void }
}) {
  const { t } = useTranslation('culture')
  const { t: tc } = useTranslation('common')
  const initial = initialOf(target)
  const [values, setValues] = useState<DuesFormValues>(initial)
  const [showErrors, setShowErrors] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<{ text: string } | null>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLButtonElement>(null)
  const post = usePostDuesMutation()
  const put = usePutDuesMutation()

  const set = <K extends keyof DuesFormValues>(key: K, value: DuesFormValues[K]) => setValues((v) => ({ ...v, [key]: value }))
  const errors = duesFormErrors(values)
  const dirty = duesFormChanged(values, initial)
  const editing = target.kind === 'edit'

  const failureText = (error: unknown): string | null => {
    const key = writeFailureKey(error)
    if (key === null) return null
    // 사유가 없는 일반 실패는 이 폼의 글, 권한 · 응답 못 받음 · 사유 코드는 22-1 사유 표 글 그대로
    return key === 'failure.write' ? t('dues.form.saveFailed') : tc(key)
  }

  const submit = async () => {
    if (busy) return
    if (errors.amount || errors.date) {
      setShowErrors(true)
      if (errors.amount) amountRef.current?.focus()
      else dateRef.current?.focus()
      return
    }
    setBusy(true)
    setSaveError(null)
    try {
      const body = duesPayloadOf(values)
      if (target.kind === 'edit') await put.mutateAsync({ dues_id: target.row.dues_id, ...body })
      else await post.mutateAsync(body)
      onSaved()
    } catch (error) {
      claimFailure(error)
      const text = failureText(error)
      if (text) setSaveError({ text })
    } finally {
      setBusy(false)
    }
  }

  const rowName = editing ? duesRowName(target.row) : ''
  const headerAction =
    editing && rowActions ? (
      <ResponsiveMenu>
        <ResponsiveMenuTrigger asChild>
          <Button variant='ghost' layout='iconOnly' size='medium' aria-label={dsText('common.moreFor', { label: rowName })}>
            <EllipsisVertical />
          </Button>
        </ResponsiveMenuTrigger>
        <ResponsiveMenuContent title={rowName}>
          <ResponsiveMenuItem icon={<Copy />} label={t('dues.copyAdd')} onSelect={() => rowActions.onCopy(target.row)} />
          <ResponsiveMenuItem icon={<Trash2 />} label={tc('delete')} tone='critical' onSelect={() => rowActions.onDelete(target.row)} />
        </ResponsiveMenuContent>
      </ResponsiveMenu>
    ) : undefined

  return (
    <ResponsiveDialog open={open} form dirty={dirty} busy={busy} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        title={editing ? t('dues.form.editTitle') : t('dues.form.addTitle')}
        headerAction={headerAction}
        onOpenAutoFocus={(e) => {
          if (editing) return
          e.preventDefault()
          amountRef.current?.focus({ preventScroll: true })
        }}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <ResponsiveDialogBody>
          {saveError && (
            <Callout tone='critical' role='alert' className='mb-x4' data-save-failure>
              {saveError.text}
            </Callout>
          )}
          <div className='flex flex-col gap-x4 pb-x2'>
            <Field label={t('dues.form.calc')}>
              <SegmentedControl aria-label={t('dues.form.calc')} value={values.calc} onValueChange={(v) => set('calc', v as DuesCalc)}>
                <SegmentedControlItem value='PLUS'>{t('dues.calcPlus')}</SegmentedControlItem>
                <SegmentedControlItem value='MINUS'>{t('dues.calcMinus')}</SegmentedControlItem>
              </SegmentedControl>
            </Field>
            <Field
              label={t('dues.form.amount')}
              showRequiredIndicator
              invalid={showErrors && !!errors.amount}
              errorMessage={t('dues.form.amountRequired')}
            >
              <AmountInput ref={amountRef} value={values.amount} onValueChange={(digits) => set('amount', digits)} />
            </Field>
            <DateField value={values.date} onChange={(d) => set('date', d)} invalid={showErrors && !!errors.date} inputRef={dateRef} />
            <Field label={t('dues.form.type')}>
              <ChipRadioGroup aria-label={t('dues.form.type')} value={values.type} onValueChange={(v) => set('type', v as DuesType)}>
                {DUES_TYPES.map((type) => (
                  <ChipRadio key={type} value={type} variant='outlineWeak' size='medium'>
                    {t(DUES_TYPE_KEY[type])}
                  </ChipRadio>
                ))}
              </ChipRadioGroup>
            </Field>
            <Field label={t('dues.form.name')} maxGraphemeCount={DUES_NAME_MAX}>
              <Input value={values.name} onChange={(e) => set('name', e.target.value.slice(0, DUES_NAME_MAX))} maxLength={DUES_NAME_MAX} />
            </Field>
            <Field label={t('dues.form.detail')} maxGraphemeCount={DUES_DETAIL_MAX}>
              <Textarea value={values.detail} onChange={(e) => set('detail', e.target.value.slice(0, DUES_DETAIL_MAX))} maxLength={DUES_DETAIL_MAX} />
            </Field>
          </div>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <ResponsiveDialogCancel>{tc('cancel')}</ResponsiveDialogCancel>
          <Button loading={busy} onClick={() => void submit()}>
            {tc('save')}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
