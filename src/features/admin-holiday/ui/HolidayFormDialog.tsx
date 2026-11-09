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
import { Select, SelectItem } from '@/shared/ds/select'
import { useSnackbar } from '@/shared/ds/snackbar'
import { DayField } from '@/shared/ui/groo/day-field'
import { usePostHolidayMutation, usePutHolidayMutation, type GetHolidaysResp } from '@/entities/holiday'
import { useCountryCodeTypesQuery } from '@/entities/type'
import { CountryLoadNotice } from './CountryLoadNotice'
import { emptyHolidayForm, holidayFormChanged, holidayFormErrors, holidayFormOf, holidayPayloadOf, type HolidayFormValues } from '../lib/holiday-form'
import { HOLIDAY_TYPES, HOLIDAY_TYPE_KEY, type HolidayType } from '../lib/holiday-format'

/** 폼이 무엇을 하나 — 새 공휴일 · 그 공휴일 수정 */
export type HolidayFormTarget = { kind: 'add'; country: string } | { kind: 'edit'; row: GetHolidaysResp }

const NAME_MAX = 100

/**
 * 공휴일 추가 · 수정 폼(I-24 J 45) — ds Responsive Dialog `form`(1280 이상 대화상자 · 미만 Bottom Sheet), 바닥 [취소] [저장].
 * 칸 차례: 이름 → 날짜 → 구분(Chip 셋) → "음력 날짜예요"(켜면 음력 날짜) → 국가 → "매년 반복해요". 아이콘 칸은 걷었다(Q6 → A) —
 * 수정은 저장된 아이콘을 그대로 싣고 새로 만들 때는 빈 값을 싣는다. 저장 실패는 폼 맨 위 Callout(고정 글), 중복 이름은 이름 칸 아래.
 * 폰(시트)에서 줄을 눌러 연 수정 폼은 바닥 왼쪽에 [삭제](10-25 줄 동작 — 줄 ⋮ 는 데스크톱 표에만).
 */
export function HolidayFormDialog({
  open,
  target,
  onOpenChange,
  onSaved,
  onCloseAutoFocus,
  onDelete,
}: {
  open: boolean
  target: HolidayFormTarget
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  onCloseAutoFocus?: (e: Event) => void
  /** 폰 수정 시트 바닥 왼쪽 [삭제] — 없으면 두지 않는다 */
  onDelete?: (row: GetHolidaysResp) => void
}) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const snackbar = useSnackbar()
  const sheet = useInputButtonSurface() === 'sheet'
  const editing = target.kind === 'edit'
  const initial = editing ? holidayFormOf(target.row) : emptyHolidayForm(target.country)
  const [values, setValues] = useState<HolidayFormValues>(initial)
  const [showErrors, setShowErrors] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [duplicate, setDuplicate] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const post = usePostHolidayMutation()
  const put = usePutHolidayMutation()
  const countries = useCountryCodeTypesQuery({ quiet: true })

  const set = <K extends keyof HolidayFormValues>(key: K, value: HolidayFormValues[K]) => {
    if (key === 'name') setDuplicate(false)
    setValues((v) => ({ ...v, [key]: value }))
  }
  const errors = holidayFormErrors(values)
  const dirty = holidayFormChanged(values, initial)

  const submit = async () => {
    if (busy) return
    if (errors.name || errors.date || errors.country) {
      setShowErrors(true)
      if (errors.name) nameRef.current?.focus()
      return
    }
    setBusy(true)
    setSaveError(null)
    try {
      const icon = target.kind === 'edit' ? (target.row.holiday_icon ?? '') : ''
      const body = holidayPayloadOf(values, icon)
      if (target.kind === 'edit') await put.mutateAsync({ holiday_id: target.row.holiday_id, ...body })
      else await post.mutateAsync(body)
      onSaved()
      snackbar.show({ message: t('adminHoliday.saved'), tone: 'positive' })
    } catch (error) {
      claimFailure(error)
      const key = writeFailureKey(error)
      if (key === 'failure.code.holidayExists') setDuplicate(true)
      else if (key) setSaveError(key === 'failure.write' ? t('adminHoliday.saveFailed') : tc(key))
    } finally {
      setBusy(false)
    }
  }

  const countryItems = (countries.data ?? []).map((c) => <SelectItem key={c.code} value={c.code} label={c.name} />)

  return (
    <ResponsiveDialog open={open} form dirty={dirty} busy={busy} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        title={editing ? t('holiday.editTitle') : t('holiday.addTitle')}
        onOpenAutoFocus={(e) => {
          if (editing) return
          e.preventDefault()
          nameRef.current?.focus({ preventScroll: true })
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
            <Field
              label={t('adminHoliday.name')}
              showRequiredIndicator
              invalid={(showErrors && !!errors.name) || duplicate}
              errorMessage={duplicate ? tc('failure.code.holidayExists') : t('adminHoliday.nameRequired')}
              maxGraphemeCount={NAME_MAX}
            >
              <Input ref={nameRef} value={values.name} placeholder={t('holiday.namePlaceholder')} maxLength={NAME_MAX} onChange={(e) => set('name', e.target.value.slice(0, NAME_MAX))} />
            </Field>
            <DayField
              label={t('adminHoliday.date')}
              placeholder={t('adminHoliday.datePlaceholder')}
              value={values.date}
              onValueChange={(d) => set('date', d)}
              invalid={showErrors && !!errors.date}
              errorMessage={t('adminHoliday.dateRequired')}
            />
            <Field label={t('adminHoliday.type')}>
              <ChipRadioGroup aria-label={t('adminHoliday.type')} value={values.type} onValueChange={(v) => set('type', v as HolidayType)}>
                {HOLIDAY_TYPES.map((type) => (
                  <ChipRadio key={type} value={type} variant='outlineWeak' size='medium'>
                    {t(HOLIDAY_TYPE_KEY[type])}
                  </ChipRadio>
                ))}
              </ChipRadioGroup>
            </Field>
            <Checkbox label={t('adminHoliday.lunarCheck')} checked={values.lunar} onCheckedChange={(c) => set('lunar', c === true)} data-holiday-lunar />
            {values.lunar && (
              <DayField
                label={t('holiday.lunarDate')}
                placeholder={t('adminHoliday.datePlaceholder')}
                value={values.lunarDate}
                onValueChange={(d) => set('lunarDate', d)}
                required={false}
              />
            )}
            <Field label={t('adminHoliday.country')} showRequiredIndicator invalid={showErrors && !!errors.country} errorMessage={t('adminHoliday.countryRequired')}>
              <Select value={values.country} onValueChange={(v) => set('country', v)} placeholder={t('holiday.countryPlaceholder')}>
                {countryItems}
              </Select>
            </Field>
            <CountryLoadNotice />
            <Checkbox label={t('adminHoliday.recurringCheck')} checked={values.recurring} onCheckedChange={(c) => set('recurring', c === true)} data-holiday-recurring />
          </div>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          {editing && sheet && onDelete && (
            <Button variant='ghost' ghostColor='critical' size='large' disabled={busy} onClick={() => onDelete(target.row)} data-holiday-delete>
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
