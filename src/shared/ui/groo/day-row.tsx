import { forwardRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { DatePicker, dayKey, formatDateValue, parseDayKey } from '@/shared/ds/date-picker'
import { PickerRow } from '@/shared/ui/groo/picker-row'

/**
 * 날짜 줄 칸 — 값은 "YYYY-MM-DD", 누르면 1280 미만 시트 · 이상 Popover 의 Date Picker + [완료].
 * 신청 폼 · 일정 폼 · 업무 보고 시트가 같은 줄을 쓴다(셋이 따로 지니던 복사본을 하나로 — 동작 변화 없음).
 * `placeholder` 는 쓰는 쪽 글("날짜 고르기" 같은 화면마다 다른 문구).
 */
export const DayRow = forwardRef<
  HTMLButtonElement,
  { title: string; value: string; onChange: (v: string) => void; placeholder: string; error?: string }
>(({ title, value, onChange, placeholder, error }, ref) => {
  const { t: tc } = useTranslation('common')
  const [draft, setDraft] = useState<Date | undefined>(value ? parseDayKey(value) : undefined)
  return (
    <PickerRow
      ref={ref}
      title={title}
      surfaceTitle={title}
      value={value ? formatDateValue(parseDayKey(value), new Date()) : ''}
      placeholder={placeholder}
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
})
DayRow.displayName = 'DayRow'
