import { useState } from 'react'
import { CalendarX2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { claimFailure, writeFailureKey } from '@/shared/api/failure'
import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import { Checkbox } from '@/shared/ds/checkbox'
import { DatePicker, dayKey, parseDayKey } from '@/shared/ds/date-picker'
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogCancel, ResponsiveDialogContent, ResponsiveDialogFooter } from '@/shared/ds/dialog'
import { Input } from '@/shared/ds/input'
import { ResponsiveMenu, ResponsiveMenuContent, ResponsiveMenuItem, ResponsiveMenuTrigger } from '@/shared/ds/menu'
import { Popover, PopoverBody, PopoverContent, PopoverTrigger } from '@/shared/ds/popover'
import { ResultSection } from '@/shared/ds/result-section'
import { Select, SelectItem } from '@/shared/ds/select'
import { useSnackbar } from '@/shared/ds/snackbar'
import {
  Table,
  TableBody,
  TableBulkBar,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableRowHeader,
  TableSelectCell,
  TableSelectHead,
  TableSkeletonRows,
} from '@/shared/ds/table'
import { useBulkSaveHolidaysMutation, useRecurringHolidaysPreviewQuery, type GetRecurringHolidaysPreviewResp } from '@/entities/holiday'
import { useCountryCodeTypesQuery } from '@/entities/type'
import { HOLIDAY_TYPES, HOLIDAY_TYPE_KEY, formatHolidayDate } from '../lib/holiday-format'

/** 연도 선택지 — 올해부터 5년 뒤까지(지금 그대로) */
const yearOptions = (): number[] => {
  const current = new Date().getFullYear()
  return Array.from({ length: 6 }, (_, i) => current + i)
}

const CELL_BUTTON =
  'min-h-[36px] w-full rounded-r2 px-x2 py-x1 text-left text-t4 font-normal text-fg-neutral [overflow-wrap:break-word] [word-break:keep-all] hover:bg-bg-layer-default-pressed focus-visible:outline-2 focus-visible:-outline-offset-2'

/** 이름 칸 — 누르면 Input, Enter · 바깥 누름으로 끝, Esc 로 되돌린다 */
function NameCell({ value, label, onCommit }: { value: string; label: string; onCommit: (next: string) => void }) {
  const { t } = useTranslation('admin')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  if (!editing) {
    return (
      <button type='button' className={CELL_BUTTON} aria-label={t('adminHoliday.bulkEditCell', { column: label, value })} data-bulk-name onClick={() => { setDraft(value); setEditing(true) }}>
        {value}
      </button>
    )
  }
  const end = (commit: boolean) => {
    setEditing(false)
    const next = draft.trim()
    if (commit && next && next !== value) onCommit(next)
  }
  return (
    <Input
      autoFocus
      size='medium'
      aria-label={label}
      value={draft}
      maxLength={100}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => end(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') end(true)
        if (e.key === 'Escape') {
          e.stopPropagation()
          end(false)
        }
      }}
    />
  )
}

/** 날짜 칸 — 누르면 Date Picker(Popover), 날을 고르면 끝 */
function DateCell({ value, label, onCommit }: { value: string; label: string; onCommit: (next: string) => void }) {
  const { t } = useTranslation('admin')
  const [open, setOpen] = useState(false)
  const shown = formatHolidayDate(value)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type='button' className={`${CELL_BUTTON} whitespace-nowrap`} aria-label={t('adminHoliday.bulkEditCell', { column: label, value: shown })} data-bulk-date>
          {shown}
        </button>
      </PopoverTrigger>
      <PopoverContent aria-label={label} align='start'>
        <PopoverBody>
          <DatePicker
            selection='single'
            visibleRange='month'
            aria-label={label}
            value={value ? parseDayKey(value) : undefined}
            onValueChange={(d) => {
              if (d) onCommit(dayKey(d))
              setOpen(false)
            }}
            autoFocus
          />
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

/** 구분 칸 — 누르면 메뉴(공휴일 · 대체 · 기타) */
function TypeCell({ value, label, onCommit }: { value: string; label: string; onCommit: (next: string) => void }) {
  const { t } = useTranslation('admin')
  const shown = t(HOLIDAY_TYPE_KEY[value] ?? 'holiday.typeEtc')
  return (
    <ResponsiveMenu>
      <ResponsiveMenuTrigger asChild>
        <button type='button' className={CELL_BUTTON} aria-label={t('adminHoliday.bulkEditCell', { column: label, value: shown })} data-bulk-type>
          {shown}
        </button>
      </ResponsiveMenuTrigger>
      <ResponsiveMenuContent title={label} align='start'>
        {HOLIDAY_TYPES.map((type) => (
          <ResponsiveMenuItem key={type} label={t(HOLIDAY_TYPE_KEY[type])} onSelect={() => onCommit(type)} />
        ))}
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  )
}

/**
 * 반복 공휴일 일괄 생성(I-24 J 46) — Responsive Dialog `form` large(1280 이상 800 · 미만 Bottom Sheet), 바닥 [취소] [{n}개 저장].
 * 조절 줄(국가 · 연도 · [불러오기]) → 고르는 표(첫 열 체크 · 머리 "모두 선택" · 고른 줄 바탕 없음 · 고르면 표 위 일괄 작업 바).
 * 옛 줄의 ✎ 가 대화상자 위에 대화상자를 열던 것을 걷고 표 안에서 고친다 — 이름(Input) · 날짜(Date Picker) · 구분(메뉴) · 음력(체크).
 * 옛 줄의 🗑 (미리보기에서만 빼기)는 체크를 푸는 것으로 대신한다.
 */
export function HolidayBulkDialog({
  open,
  defaultCountry,
  onOpenChange,
  onCloseAutoFocus,
}: {
  open: boolean
  defaultCountry: string
  onOpenChange: (open: boolean) => void
  onCloseAutoFocus?: (e: Event) => void
}) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const snackbar = useSnackbar()
  const [country, setCountry] = useState(defaultCountry)
  const [year, setYear] = useState(new Date().getFullYear())
  const [rows, setRows] = useState<GetRecurringHolidaysPreviewResp[] | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [hint, setHint] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const countries = useCountryCodeTypesQuery({ quiet: true })
  const preview = useRecurringHolidaysPreviewQuery(year, country, false, { quiet: true })
  const save = useBulkSaveHolidaysMutation()

  const load = async () => {
    setSaveError(null)
    const res = await preview.refetch()
    if (res.data) {
      setRows(res.data.map((r) => ({ ...r })))
      setSelected(new Set(res.data.map((_, i) => i)))
      setHint(false)
    }
  }
  const resetRows = () => {
    setRows(null)
    setSelected(new Set())
    setHint(false)
  }
  const patch = (index: number, next: Partial<GetRecurringHolidaysPreviewResp>) =>
    setRows((cur) => (cur ? cur.map((r, i) => (i === index ? { ...r, ...next } : r)) : cur))

  const all = rows !== null && rows.length > 0 && selected.size === rows.length
  const headChecked: boolean | 'indeterminate' = all ? true : selected.size > 0 ? 'indeterminate' : false
  const toggle = (index: number, on: boolean) => {
    setHint(false)
    setSelected((cur) => {
      const next = new Set(cur)
      if (on) next.add(index)
      else next.delete(index)
      return next
    })
  }

  const submit = async () => {
    if (busy || rows === null) return
    if (selected.size === 0) {
      setHint(true)
      return
    }
    setBusy(true)
    setSaveError(null)
    try {
      const holidays = rows
        .filter((_, i) => selected.has(i))
        .map((r) => ({
          holiday_name: r.holiday_name.trim(),
          holiday_date: r.holiday_date,
          holiday_type: r.holiday_type,
          // 미리보기가 준 아이콘 값을 그대로 보낸다(아이콘 칸을 걷었다 — Q6 → A)
          holiday_icon: r.holiday_icon || '',
          country_code: r.country_code,
          lunar_yn: r.lunar_yn,
          lunar_date: r.lunar_date || '',
          is_recurring: r.is_recurring,
        }))
      const res = await save.mutateAsync({ holidays })
      onOpenChange(false)
      snackbar.show({ message: t('adminHoliday.bulkSaved', { count: res.saved_count }), tone: 'positive' })
    } catch (error) {
      claimFailure(error)
      const key = writeFailureKey(error)
      if (key) setSaveError(key === 'failure.write' ? t('adminHoliday.bulkSaveFailed') : tc(key))
    } finally {
      setBusy(false)
    }
  }

  const colName = t('adminHoliday.name')
  const colDate = t('adminHoliday.date')
  const colType = t('adminHoliday.type')
  const colLunar = t('holiday.lunar')

  const tableHead = (
    <TableHeader>
      <TableRow>
        <TableSelectHead checked={headChecked} onCheckedChange={(next) => { setHint(false); setSelected(next && rows ? new Set(rows.map((_, i) => i)) : new Set()) }} />
        <TableHead>{colName}</TableHead>
        <TableHead>{colDate}</TableHead>
        <TableHead>{colType}</TableHead>
        <TableHead>{colLunar}</TableHead>
      </TableRow>
    </TableHeader>
  )

  let body: React.ReactNode = null
  if (preview.isFetching && rows === null) {
    body = (
      <Table caption={t('adminHoliday.bulkCaption')}>
        {tableHead}
        <TableBody>
          <TableSkeletonRows rows={5} columns={[{ width: '30%' }, { width: '70%' }, { width: '70%' }, { width: '50%' }, { width: '40%' }]} />
        </TableBody>
      </Table>
    )
  } else if (preview.isError && rows === null) {
    body = (
      <ResultSection
        kind='failure'
        size='medium'
        title={t('adminHoliday.bulkFailureTitle')}
        description={t('adminHoliday.failureDescription')}
        primaryAction={{ label: tc('retry'), onClick: () => void load(), loading: preview.isFetching }}
      />
    )
  } else if (rows !== null && rows.length === 0) {
    body = <ResultSection size='medium' icon={<CalendarX2 />} title={t('adminHoliday.bulkEmpty', { year })} />
  } else if (rows !== null) {
    body = (
      <>
        <TableBulkBar count={selected.size} onClear={() => setSelected(new Set())} />
        {hint && (
          <Callout tone='critical' role='alert' className='mb-x2' data-bulk-hint>
            {t('adminHoliday.bulkPickNone')}
          </Callout>
        )}
        <Table caption={t('adminHoliday.bulkCaption')}>
          {tableHead}
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index} data-bulk-row={index}>
                <TableSelectCell label={row.holiday_name} checked={selected.has(index)} onCheckedChange={(on) => toggle(index, on)} />
                <TableRowHeader className='min-w-[140px] whitespace-normal py-x1'>
                  <NameCell value={row.holiday_name} label={colName} onCommit={(next) => patch(index, { holiday_name: next })} />
                </TableRowHeader>
                <TableCell className='min-w-[170px] py-x1'>
                  <DateCell value={row.holiday_date} label={colDate} onCommit={(next) => patch(index, { holiday_date: next })} />
                </TableCell>
                <TableCell className='min-w-[90px] py-x1'>
                  <TypeCell value={row.holiday_type} label={colType} onCommit={(next) => patch(index, { holiday_type: next })} />
                </TableCell>
                <TableCell className='min-w-[80px] py-x1'>
                  <Checkbox
                    label={colLunar}
                    checked={row.lunar_yn === 'Y'}
                    onCheckedChange={(c) => patch(index, { lunar_yn: c === true ? 'Y' : 'N' })}
                    data-bulk-lunar
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </>
    )
  }

  return (
    <ResponsiveDialog open={open} form dirty={rows !== null} busy={busy} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size='large' title={t('holiday.bulkGenerateTitle')} description={t('adminHoliday.bulkDescription')} onCloseAutoFocus={onCloseAutoFocus}>
        <ResponsiveDialogBody>
          {saveError && (
            <Callout tone='critical' role='alert' className='mb-x4' data-save-failure>
              {saveError}
            </Callout>
          )}
          <div className='mb-x4 flex flex-wrap items-center gap-x2'>
            <Select size='medium' aria-label={t('adminHoliday.countryAria')} value={country} onValueChange={(v) => { setCountry(v); resetRows() }} className='w-[140px]'>
              {(countries.data ?? []).map((c) => (
                <SelectItem key={c.code} value={c.code} label={c.name} />
              ))}
            </Select>
            <Select size='medium' aria-label={t('adminHoliday.yearAria')} value={String(year)} onValueChange={(v) => { setYear(parseInt(v, 10)); resetRows() }} className='w-[120px]'>
              {yearOptions().map((y) => (
                <SelectItem key={y} value={String(y)} label={t('adminHoliday.yearLabel', { year: y })} />
              ))}
            </Select>
            <Button variant='neutralOutline' size='medium' loading={preview.isFetching} onClick={() => void load()} data-bulk-load>
              {t('holiday.loadPreview')}
            </Button>
          </div>
          {body}
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <ResponsiveDialogCancel>{tc('cancel')}</ResponsiveDialogCancel>
          <Button loading={busy} disabled={rows === null || rows.length === 0} onClick={() => void submit()} data-bulk-save>
            {t('adminHoliday.bulkSave', { count: selected.size })}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
