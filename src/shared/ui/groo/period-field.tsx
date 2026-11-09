import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { BottomSheet, BottomSheetBody, BottomSheetContent, BottomSheetFooter } from '@/shared/ds/bottom-sheet'
import { Button } from '@/shared/ds/button'
import { DatePicker, dayKey, formatRangeValue, parseDayKey, type DateRange } from '@/shared/ds/date-picker'
import { Field } from '@/shared/ds/field'
import { InputButton, useInputButtonSurface } from '@/shared/ds/input-button'
import { Popover, PopoverBody, PopoverContent, PopoverFooter, PopoverTrigger } from '@/shared/ds/popover'

export interface PeriodValue {
  /** "YYYY-MM-DD" — 비면 "" */
  start: string
  end: string
}

/**
 * 기간 칸 하나 — Input Button 이 기간(range) Date Picker 를 연다(1280 이상 Popover · 미만 Bottom Sheet), 바닥 [완료].
 * 시작 · 끝을 모두 고른 뒤에만 [완료] 가 켜진다(하루짜리 기간은 같은 날을 두 번 누른다). 값은 "YYYY-MM-DD" 둘. 칸 오류는 쓰는 쪽이 invalid · errorMessage 로 준다.
 */
export function PeriodField({
  label,
  value,
  onValueChange,
  placeholder,
  invalid,
  errorMessage,
  inputRef,
}: {
  label: string
  value: PeriodValue
  onValueChange: (next: PeriodValue) => void
  placeholder: string
  invalid?: boolean
  errorMessage?: string
  inputRef?: React.Ref<HTMLButtonElement>
}) {
  const { t: tc } = useTranslation('common')
  const surface = useInputButtonSurface()
  const [open, setOpen] = useState(false)
  const current: DateRange | undefined = value.start && value.end ? { start: parseDayKey(value.start), end: parseDayKey(value.end) } : undefined
  const [draft, setDraft] = useState<DateRange | undefined>(current)
  const trigger = (
    <InputButton
      ref={inputRef}
      placeholder={placeholder}
      value={current ? formatRangeValue(current, new Date()) : ''}
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
  const picker = <DatePicker selection='range' visibleRange='month' aria-label={label} value={draft} onValueChange={setDraft} autoFocus />
  const complete = !!draft?.start && !!draft?.end
  const done = (
    <Button
      disabled={!complete}
      onClick={() => {
        if (draft?.start && draft?.end) onValueChange({ start: dayKey(draft.start), end: dayKey(draft.end) })
        setOpen(false)
      }}
    >
      {tc('done')}
    </Button>
  )
  return (
    <Field label={label} showRequiredIndicator invalid={invalid} errorMessage={errorMessage}>
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
