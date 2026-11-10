import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { BottomSheet, BottomSheetBody, BottomSheetContent, BottomSheetFooter } from '@/shared/ds/bottom-sheet'
import { Button } from '@/shared/ds/button'
import { DatePicker, dayKey, formatDateValue, parseDayKey } from '@/shared/ds/date-picker'
import { Field } from '@/shared/ds/field'
import { InputButton, useInputButtonSurface } from '@/shared/ds/input-button'
import { Popover, PopoverBody, PopoverContent, PopoverFooter, PopoverTrigger } from '@/shared/ds/popover'

/**
 * 날짜 칸 하나 — Input Button 이 Date Picker 를 연다(1280 이상 Popover · 미만 Bottom Sheet), 바닥 [완료].
 * 값은 "YYYY-MM-DD"(비면 ""). 필수 칸이라 지우기는 없다 — 칸 오류는 쓰는 쪽이 invalid · errorMessage 로 준다.
 */
export function DayField({
  label,
  value,
  onValueChange,
  placeholder,
  invalid,
  errorMessage,
  inputRef,
  required = true,
  size,
}: {
  label: string
  value: string
  onValueChange: (next: string) => void
  placeholder: string
  invalid?: boolean
  errorMessage?: string
  inputRef?: React.Ref<HTMLButtonElement>
  /** 필수 점 — 선택 칸이면 false(기본 true) */
  required?: boolean
  /** 칸 크기 — 기본(responsive)은 1280 미만 52 · 이상 40. 표 안 편집 줄처럼 다른 칸과 높이를 맞출 때 */
  size?: 'large' | 'medium' | 'responsive'
}) {
  const { t: tc } = useTranslation('common')
  const surface = useInputButtonSurface()
  const [open, setOpen] = useState(false)
  const current = value ? parseDayKey(value) : undefined
  const [draft, setDraft] = useState<Date | undefined>(current)
  const trigger = (
    <InputButton
      ref={inputRef}
      size={size}
      placeholder={placeholder}
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
  const picker = <DatePicker selection='single' visibleRange='month' aria-label={label} value={draft} onValueChange={setDraft} autoFocus />
  const done = (
    <Button
      disabled={!draft}
      onClick={() => {
        if (draft) onValueChange(dayKey(draft))
        setOpen(false)
      }}
    >
      {tc('done')}
    </Button>
  )
  return (
    <Field label={label} showRequiredIndicator={required} invalid={invalid} errorMessage={errorMessage}>
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
