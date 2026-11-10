import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { DatePicker, dayKey, formatDateValue, parseDayKey } from '@/shared/ds/date-picker'
import { TimePicker, formatTimeValue, type TimeValue } from '@/shared/ds/time-picker'
import { PickerRow } from '@/shared/ui/groo/picker-row'

/** 날짜 줄 칸 — 값은 "YYYY-MM-DD", 누르면 1280 미만 시트 · 이상 Popover 의 Date Picker + [완료] */
export const DayRow = ({ title, value, onChange, error }: { title: string; value: string; onChange: (v: string) => void; error?: string }) => {
  const { t } = useTranslation('calendar')
  const { t: tc } = useTranslation('common')
  const [draft, setDraft] = useState<Date | undefined>(value ? parseDayKey(value) : undefined)
  return (
    <PickerRow
      title={title}
      surfaceTitle={title}
      value={value ? formatDateValue(parseDayKey(value), new Date()) : ''}
      placeholder={t('form.datePlaceholder')}
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

/**
 * 시각 줄 칸 — Time Picker 휠, 일정 폼은 분 간격 30(스펙 "HR 일정 30" — `minuteStep={30}` 명시) · 시 제한 없음.
 * 휠 시트는 끌어서 닫히지 않는다(닫기 · [완료] · Esc 로만). 근무 시간 밖은 서버가 거절하고 그 글은 `error` 로 이 칸 아래에 둔다.
 */
export const TimeRow = ({ title, value, onChange, error }: { title: string; value: TimeValue | null; onChange: (v: TimeValue) => void; error?: string }) => {
  const { t } = useTranslation('calendar')
  const { t: tc } = useTranslation('common')
  const [draft, setDraft] = useState<TimeValue | undefined>(value ?? undefined)
  return (
    <PickerRow
      title={title}
      surfaceTitle={title}
      value={value ? formatTimeValue(value) : ''}
      placeholder={t('form.timePlaceholder')}
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
      <TimePicker aria-label={title} value={draft} onValueChange={setDraft} minuteStep={30} autoFocus />
    </PickerRow>
  )
}
