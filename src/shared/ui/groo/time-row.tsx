import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { TimePicker, formatTimeValue, type MinuteStep, type TimeValue } from '@/shared/ds/time-picker'
import { PickerRow } from '@/shared/ui/groo/picker-row'

/**
 * 시각 줄 칸 — Time Picker 휠. 분 간격은 쓰는 쪽이 정한다(신청 폼 1 · 일정 폼 30 — 스펙 "HR 일정 30", 둘 다 명시).
 * 휠 시트는 끌어서 닫히지 않는다(닫기 · [완료] · Esc 로만). 값 밖의 사유(근무 시간 밖 등)는 `error` 로 이 칸 아래에 둔다.
 */
export const TimeRow = ({
  title,
  value,
  onChange,
  placeholder,
  minuteStep,
  error,
}: {
  title: string
  value: TimeValue | null
  onChange: (v: TimeValue) => void
  placeholder: string
  minuteStep: MinuteStep
  error?: string
}) => {
  const { t: tc } = useTranslation('common')
  const [draft, setDraft] = useState<TimeValue | undefined>(value ?? undefined)
  return (
    <PickerRow
      title={title}
      surfaceTitle={title}
      value={value ? formatTimeValue(value) : ''}
      placeholder={placeholder}
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
      <TimePicker aria-label={title} value={draft} onValueChange={setDraft} minuteStep={minuteStep} autoFocus />
    </PickerRow>
  )
}
