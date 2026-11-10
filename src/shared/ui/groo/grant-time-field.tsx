import { useTranslation } from 'react-i18next'

import { Field } from '@/shared/ds/field'
import { Input } from '@/shared/ds/input'
import { QuantityPicker } from '@/shared/ds/quantity-picker'
import { SegmentedControl, SegmentedControlItem } from '@/shared/ds/segmented-control'
import { GRANT_MAX_DAYS, GRANT_MAX_HOURS, joinGrantTime, splitGrantTime, type GrantTimeParts } from '@/shared/lib/groo/grant-time'

/**
 * 부여 시간 칸(일 · 시간 · 분 공용 — I-25 E 26 의 부품을 이쪽이 먼저 짰다). 일은 숫자 칸 0 ~ 365, 시간은 Quantity Picker 0 ~ 7,
 * 분은 Segmented 0 · 30(분 단위 정책에서만). `locked` 는 정책이 시간을 정한 때 — 값을 보이되 바꾸지 못한다.
 * 라벨은 인자라 신청 폼도 같은 칸을 쓴다. 값은 서버 단위(일 = 1)의 숫자 하나.
 */
export function GrantTimeField({
  label,
  value,
  onValueChange,
  withMinutes,
  locked,
  description,
  invalid,
  errorMessage,
  required = true,
}: {
  label: string
  value: number
  onValueChange: (total: number) => void
  withMinutes: boolean
  locked?: boolean
  description?: string
  invalid?: boolean
  errorMessage?: string
  required?: boolean
}) {
  const { t } = useTranslation('vacation')
  const parts = splitGrantTime(value)
  const set = (patch: Partial<GrantTimeParts>) => onValueChange(joinGrantTime({ ...parts, ...patch }))
  return (
    <Field label={label} showRequiredIndicator={required} invalid={invalid} errorMessage={errorMessage} description={description}>
      <div className='flex flex-wrap items-center gap-x3' data-grant-time>
        <Input
          rootClassName='w-[104px]'
          inputMode='numeric'
          aria-label={t('grantTime.day')}
          suffix={t('grantTime.day')}
          value={parts.days === 0 && !locked ? '' : String(parts.days)}
          placeholder='0'
          disabled={locked}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 3)
            set({ days: Math.min(GRANT_MAX_DAYS, digits === '' ? 0 : parseInt(digits, 10)) })
          }}
        />
        <QuantityPicker
          aria-label={t('grantTime.hour')}
          value={parts.hours}
          min={0}
          max={GRANT_MAX_HOURS}
          disabled={locked}
          getValueText={(n) => t('grantTime.nHours', { n })}
          decrementAriaLabel={t('grantTime.hourDecrease')}
          incrementAriaLabel={t('grantTime.hourIncrease')}
          onValueChange={(hours) => set({ hours })}
        />
        {(withMinutes || parts.minutes === 30) && (
          <SegmentedControl aria-label={t('grantTime.minute')} value={String(parts.minutes)} disabled={locked} onValueChange={(v) => set({ minutes: v === '30' ? 30 : 0 })}>
            <SegmentedControlItem value='0'>{t('grantTime.nMinutes', { n: 0 })}</SegmentedControlItem>
            <SegmentedControlItem value='30'>{t('grantTime.nMinutes', { n: 30 })}</SegmentedControlItem>
          </SegmentedControl>
        )}
      </div>
    </Field>
  )
}
