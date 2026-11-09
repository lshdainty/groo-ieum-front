import { useTranslation } from 'react-i18next'

import { Field } from '@/shared/ds/field'
import { Select, SelectItem } from '@/shared/ds/select'
import { formatWorkTime, WORK_TIME_VALUES } from '@/shared/lib/work-time'
import type { TypeResp } from '@/entities/type'

/** 고르는 값 한 칸 — Field + ds Select(1280 이상 목록 · 미만 시트). 사용자 초대 · 수정 · 내 정보가 같은 칸을 쓴다 */
function ListField({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  invalid,
  errorMessage,
  required,
}: {
  label: string
  value: string
  onValueChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  invalid?: boolean
  errorMessage?: string
  required?: boolean
}) {
  return (
    <Field label={label} showRequiredIndicator={required} invalid={invalid} errorMessage={errorMessage}>
      <Select value={value} onValueChange={onValueChange} placeholder={placeholder} aria-invalid={invalid || undefined}>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} label={o.label} />
        ))}
      </Select>
    </Field>
  )
}

export function CompanyField({ value, onValueChange, options, required, invalid }: { value: string; onValueChange: (v: string) => void; options: TypeResp[]; required?: boolean; invalid?: boolean }) {
  const { t } = useTranslation('admin')
  return (
    <ListField
      label={t('user.company')}
      value={value}
      onValueChange={onValueChange}
      options={options.map((o) => ({ value: o.code, label: o.name }))}
      placeholder={t('user.companyPlaceholder')}
      required={required}
      invalid={invalid}
      errorMessage={t('user.companyRequired')}
    />
  )
}

export function WorkTimeField({ value, onValueChange, required, invalid }: { value: string; onValueChange: (v: string) => void; required?: boolean; invalid?: boolean }) {
  const { t } = useTranslation('admin')
  return (
    <ListField
      label={t('users.workTimeLabel')}
      value={value}
      onValueChange={onValueChange}
      options={WORK_TIME_VALUES.map((v) => ({ value: v, label: formatWorkTime(v) }))}
      placeholder={t('user.workTimePlaceholder')}
      required={required}
      invalid={invalid}
      errorMessage={t('user.workTimeRequired')}
    />
  )
}

export function CountryField({ value, onValueChange, options, required, invalid }: { value: string; onValueChange: (v: string) => void; options: TypeResp[]; required?: boolean; invalid?: boolean }) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  return (
    <ListField
      label={tc('country')}
      value={value}
      onValueChange={onValueChange}
      options={options.map((o) => ({ value: o.code, label: o.name }))}
      placeholder={t('user.countryCodePlaceholder')}
      required={required}
      invalid={invalid}
      errorMessage={t('user.countryCodeRequired')}
    />
  )
}
