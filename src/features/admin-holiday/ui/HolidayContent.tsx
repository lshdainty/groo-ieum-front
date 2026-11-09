import { useRef, useState } from 'react'
import { CalendarX2, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/shared/ds/badge'
import { Button } from '@/shared/ds/button'
import { List, ListButtonItem } from '@/shared/ds/list'
import { ResponsiveMenuContent, ResponsiveMenuGroup, ResponsiveMenuItem } from '@/shared/ds/menu'
import { ResultSection } from '@/shared/ds/result-section'
import { Select, SelectItem } from '@/shared/ds/select'
import { LoadingRegion, Skeleton } from '@/shared/ds/skeleton'
import { useSnackbar } from '@/shared/ds/snackbar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableMoreCell, TableMoreHead, TableRow, TableRowHeader, TableSkeletonRows } from '@/shared/ds/table'
import { ConfirmDialog, useConfirmTarget } from '@/shared/ui/confirm'
import { ScreenCard } from '@/shared/ui/groo/screen-card'
import { useDeleteHolidayMutation, useHolidaysByPeriodQuery, type GetHolidaysResp } from '@/entities/holiday'
import { useCountryCodeTypesQuery } from '@/entities/type'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { useScreenAction } from '@/widgets/layout/lib/screen-action'
import { ScreenBody, ScreenTitleRow } from '@/widgets/layout/ui/ScreenBody'
import { HOLIDAY_TYPE_KEY, formatHolidayDate, holidayRowName, repeatKey } from '../lib/holiday-format'
import { CountryLoadNotice } from './CountryLoadNotice'
import { HolidayBulkDialog } from './HolidayBulkDialog'
import { HolidayFormDialog, type HolidayFormTarget } from './HolidayFormDialog'

/** 연도 선택지 — 올해 기준 앞 · 뒤 5년(지금 그대로) */
const yearOptions = (): number[] => {
  const current = new Date().getFullYear()
  return Array.from({ length: 11 }, (_, i) => current - 5 + i)
}

const TEXT_WRAP = '[overflow-wrap:break-word] [word-break:keep-all]'

const focusFirst = (selectors: string[]): boolean => {
  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el) {
      el.focus({ preventScroll: true })
      return true
    }
  }
  return false
}

/**
 * 공휴일 관리(I-24 J 44) — 데스크톱: 제목 줄(오른쪽 [일괄 생성] [추가]) → 국가 · 연도 조절 줄(아래 16) → 카드 "공휴일 n개" 안 ds Table.
 * 폰: 상단 바 오른쪽 [추가] · 흰 면 안 조절 줄 → "공휴일 n개" → List 줄(줄을 누르면 수정 시트, 삭제는 시트 바닥 왼쪽 — 줄 ⋮ 없음).
 * 읽기는 quiet — 실패는 이 구역의 Result Section + [다시 시도]. 한 해 목록이라 쪽 넘김이 없다.
 * 화면 트리는 폭과 상관없이 하나다(열린 폼 · 확인창이 768 을 넘나들어도 이어진다) — 달라지는 것은 표 ↔ List 와 제목 줄 · 조절 줄 자리뿐.
 */
export const HolidayContent = () => {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const desktop = useDesktop()
  const snackbar = useSnackbar()
  const [year, setYear] = useState(new Date().getFullYear())
  const [country, setCountry] = useState('KR')
  const [form, setForm] = useState<{ target: HolidayFormTarget; open: boolean; key: number } | null>(null)
  const [bulk, setBulk] = useState<{ open: boolean; key: number } | null>(null)
  const deleteConfirm = useConfirmTarget<GetHolidaysResp>()
  const del = useDeleteHolidayMutation()
  const countries = useCountryCodeTypesQuery({ quiet: true })
  const query = useHolidaysByPeriodQuery(`${year}-01-01`, `${year}-12-31`, country, { quiet: true })
  const rows = query.data ?? []
  const lastRowId = useRef<number | null>(null)
  const afterDelete = useRef<number[]>([])
  const removed = useRef(false)
  const fromSheet = useRef(false)

  const openAdd = () => {
    lastRowId.current = null
    setForm((cur) => ({ target: { kind: 'add', country }, open: true, key: (cur?.key ?? 0) + 1 }))
  }
  const openEdit = (row: GetHolidaysResp) => {
    lastRowId.current = row.holiday_id
    setForm((cur) => ({ target: { kind: 'edit', row }, open: true, key: (cur?.key ?? 0) + 1 }))
  }
  const closeForm = () => setForm((cur) => (cur ? { ...cur, open: false } : cur))
  const openBulk = () => setBulk((cur) => ({ open: true, key: (cur?.key ?? 0) + 1 }))

  const askDelete = (row: GetHolidaysResp, sheet: boolean) => {
    fromSheet.current = sheet
    removed.current = false
    const index = rows.findIndex((r) => r.holiday_id === row.holiday_id)
    afterDelete.current = [rows[index + 1]?.holiday_id, rows[index - 1]?.holiday_id].filter((id): id is number => id !== undefined)
    deleteConfirm.ask(row)
  }
  /** 지운 줄은 없다 — 초점은 다음 줄(없으면 이전 줄)의 ⋮ · 줄로, 하나도 없으면 [추가] 로 */
  const focusAfterRemoval = () => {
    const part = desktop ? '[data-slot=table-more-button]' : ''
    const selectors = afterDelete.current.map((id) => `[data-holiday-id="${id}"] ${part}`.trim()).concat(afterDelete.current.map((id) => `[data-holiday-id="${id}"]`))
    if (!focusFirst([...selectors, '[data-holiday-add]'])) document.getElementById('main')?.focus({ preventScroll: true })
  }
  const onFormClosed = (e: Event) => {
    e.preventDefault()
    const id = lastRowId.current
    if (id !== null && focusFirst([`[data-holiday-id="${id}"]`])) return
    if (id === null && focusFirst(['[data-holiday-add]'])) return
    if (id !== null) focusAfterRemoval()
  }
  const onDeleteClosed = (e: Event) => {
    if (!removed.current) return
    if (!fromSheet.current) return
    e.preventDefault()
    focusAfterRemoval()
  }

  useScreenAction(desktop ? null : { label: tc('add'), onClick: openAdd })

  const countrySelect = (
    <Select size='responsive' aria-label={t('adminHoliday.countryAria')} value={country} onValueChange={setCountry} className='w-[160px]'>
      {(countries.data ?? []).map((c) => (
        <SelectItem key={c.code} value={c.code} label={c.name} />
      ))}
    </Select>
  )
  const yearSelect = (
    <Select size='responsive' aria-label={t('adminHoliday.yearAria')} value={String(year)} onValueChange={(v) => setYear(parseInt(v, 10))} className='w-[120px]'>
      {yearOptions().map((y) => (
        <SelectItem key={y} value={String(y)} label={t('adminHoliday.yearLabel', { year: y })} />
      ))}
    </Select>
  )
  const controls = (
    <div className='flex flex-col gap-x2' data-holiday-controls>
      <div className='flex items-center gap-x2'>
        {countrySelect}
        {yearSelect}
      </div>
      <CountryLoadNotice />
    </div>
  )

  const titleActions = (
    <div className='flex items-center gap-x2'>
      <Button variant='neutralOutline' size='small' onClick={openBulk} data-holiday-bulk>
        {t('holiday.bulkGenerateBtn')}
      </Button>
      <Button variant='neutralOutline' size='small' onClick={openAdd} data-holiday-add>
        <Plus />
        {tc('add')}
      </Button>
    </div>
  )

  const caption = t('adminHoliday.caption')
  const cardTitle = query.isSuccess ? t('adminHoliday.listTitle', { count: rows.length }) : t('adminHoliday.listTitleBase')
  const typeText = (row: GetHolidaysResp) => t(HOLIDAY_TYPE_KEY[row.holiday_type] ?? 'holiday.typeEtc')

  const tableHead = (
    <TableHeader>
      <TableRow>
        <TableHead>{t('adminHoliday.colName')}</TableHead>
        <TableHead>{t('adminHoliday.colDate')}</TableHead>
        <TableHead>{t('adminHoliday.colType')}</TableHead>
        <TableHead>{t('adminHoliday.colRepeat')}</TableHead>
        <TableMoreHead />
      </TableRow>
    </TableHeader>
  )

  const tableSkeleton = (
    <Table caption={caption}>
      {tableHead}
      <TableBody>
        <TableSkeletonRows rows={5} columns={[{ width: '60%' }, { width: '70%' }, { width: '40%' }, { width: '40%' }, { width: '30%' }]} />
      </TableBody>
    </Table>
  )
  const listSkeleton = (
    <div className='flex flex-col'>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className='flex flex-col gap-x1 px-x6 py-x3'>
          <Skeleton text='t5' className='block w-3/5' />
          <Skeleton text='t3' className='block w-4/5' />
        </div>
      ))}
    </div>
  )

  const target = deleteConfirm.target

  return (
    <ScreenBody density='medium'>
      <ScreenTitleRow title={t('holiday.title')} action={titleActions} />
      <div className='bg-bg-layer-default min-[48rem]:bg-transparent'>
        <div className='mb-x4 hidden min-[48rem]:block'>{controls}</div>
        <ScreenCard
          title={cardTitle}
          leading={desktop ? undefined : controls}
          action={
            desktop ? undefined : (
              <Button variant='ghost' size='small' ghostColor='neutralMuted' onClick={openBulk} data-holiday-bulk>
                {t('holiday.bulkGenerateBtn')}
              </Button>
            )
          }
        >
          <LoadingRegion
            pending={query.isPending}
            failed={query.isLoadingError}
            fallback={desktop ? tableSkeleton : listSkeleton}
            failure={
              <ResultSection
                kind='failure'
                size='medium'
                title={t('adminHoliday.failureTitle')}
                description={t('adminHoliday.failureDescription')}
                primaryAction={{ label: tc('retry'), onClick: () => void query.refetch(), loading: query.isFetching }}
              />
            }
          >
            {query.data && rows.length === 0 ? (
              <ResultSection
                size='medium'
                icon={<CalendarX2 />}
                title={t('adminHoliday.emptyTitle', { year })}
                description={t('adminHoliday.emptyDescription')}
                primaryAction={{ label: t('holiday.bulkGenerateBtn'), onClick: openBulk }}
              />
            ) : desktop ? (
              <Table caption={caption}>
                {tableHead}
                <TableBody>
                  {rows.map((row) => {
                    const name = holidayRowName(row)
                    return (
                      <TableRow key={row.holiday_id} data-holiday-id={row.holiday_id}>
                        <TableRowHeader className={`min-w-[160px] whitespace-normal ${TEXT_WRAP}`}>{row.holiday_name}</TableRowHeader>
                        <TableCell className='whitespace-nowrap'>{formatHolidayDate(row.holiday_date)}</TableCell>
                        <TableCell className='whitespace-nowrap'>
                          <Badge>{typeText(row)}</Badge>
                        </TableCell>
                        <TableCell className='whitespace-nowrap'>{t(repeatKey(row))}</TableCell>
                        <TableMoreCell label={name}>
                          <ResponsiveMenuContent title={name}>
                            <ResponsiveMenuGroup>
                              <ResponsiveMenuItem label={tc('edit')} onSelect={() => openEdit(row)} />
                            </ResponsiveMenuGroup>
                            <ResponsiveMenuGroup>
                              <ResponsiveMenuItem label={tc('delete')} tone='critical' onSelect={() => askDelete(row, false)} />
                            </ResponsiveMenuGroup>
                          </ResponsiveMenuContent>
                        </TableMoreCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <List>
                {rows.map((row) => (
                  <ListButtonItem
                    key={row.holiday_id}
                    data-holiday-id={row.holiday_id}
                    title={row.holiday_name}
                    detail={t('adminHoliday.rowDetail', { date: formatHolidayDate(row.holiday_date), type: typeText(row), repeat: t(repeatKey(row)) })}
                    align='top'
                    onClick={() => openEdit(row)}
                  />
                ))}
              </List>
            )}
          </LoadingRegion>
        </ScreenCard>
      </div>
      {form && (
        <HolidayFormDialog
          key={form.key}
          open={form.open}
          target={form.target}
          onOpenChange={(next) => (next ? undefined : closeForm())}
          onSaved={closeForm}
          onCloseAutoFocus={onFormClosed}
          onDelete={(row) => askDelete(row, true)}
        />
      )}
      {bulk && <HolidayBulkDialog key={bulk.key} open={bulk.open} defaultCountry={country} onOpenChange={(next) => setBulk((cur) => (cur ? { ...cur, open: next } : cur))} />}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title={t('holiday.deleteTitle')}
        description={t('holiday.deleteConfirm', { name: target?.holiday_name ?? '' })}
        onConfirm={async () => {
          if (target) await del.mutateAsync(String(target.holiday_id))
          removed.current = true
        }}
        // 시트(폰 수정 폼) 안에서 지웠으면 시트도 닫는다 — 다시 시도로 지운 뒤에도 불린다
        onDone={() => {
          if (fromSheet.current) closeForm()
          snackbar.show({ message: t('adminHoliday.deleted'), tone: 'positive' })
        }}
        onCloseAutoFocus={onDeleteClosed}
      />
    </ScreenBody>
  )
}
