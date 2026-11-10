import { ChevronDown, RotateCcw } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@/shared/ds/avatar'
import { BottomSheet, BottomSheetBody, BottomSheetContent, BottomSheetFooter } from '@/shared/ds/bottom-sheet'
import { Button } from '@/shared/ds/button'
import { Chip, ChipGroup } from '@/shared/ds/chip'
import { DATE_PRESETS, DatePicker, dayKey, parseDayKey, type DateRange } from '@/shared/ds/date-picker'
import { ListRadioGroup, ListRadioItem } from '@/shared/ds/list'
import { useWideSurface } from '@/shared/ds/overlay'
import { Popover, PopoverBody, PopoverContent, PopoverFooter, PopoverTrigger } from '@/shared/ds/popover'
import { ResultSection } from '@/shared/ds/result-section'
import {
  SearchableList,
  SearchableListEmpty,
  SearchableListInput,
  SearchableListItem,
  SearchableListResults,
  focusSearchableList,
  matchesSearch,
} from '@/shared/ds/searchable-list'
import { formatMonthDayText, rangeSep } from '@/shared/lib/date-text'
import type { GetUsersResp } from '@/entities/user'
import type { WorkCodeResp, WorkGroupWithParts } from '@/entities/work'
import { ALL, isFiltered, isPeriodDefault, type ReportFilters } from '../lib/report-filter'
import { partsOf } from '../lib/report-format'
import { useReportContext } from '../model/ReportContext'

/**
 * 여는 칩 하나 + 그것이 여는 표면 — 1280 이상 Popover · 미만 Bottom Sheet(I-25 H 49, 캘린더 필터 칩과 같은 문법).
 * 안은 쓰는 쪽(`children(draft, setDraft)`), 바닥 [초기화][적용]. 고른 값은 [적용] 에서만 걸린다. 칩 글은 걸린 값의 요약이고 걸리면 짙은 채움.
 * 열 때마다 시안(draft)을 지금 값으로 맞춘다.
 */
function FilterChip<T>({
  title,
  summary,
  active,
  disabled,
  disabledHint,
  value,
  resetValue,
  canApply = () => true,
  onApply,
  children,
}: {
  title: string
  summary: string
  active: boolean
  disabled?: boolean
  /** 막힌 칩의 까닭 — 이름에 붙는다 */
  disabledHint?: string
  value: T
  resetValue: T
  canApply?: (draft: T) => boolean
  onApply: (draft: T) => void
  children: (draft: T, setDraft: (next: T) => void) => ReactNode
}) {
  const { t } = useTranslation('work')
  const wide = useWideSurface()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<T>(value)

  const apply = () => {
    onApply(draft)
    setOpen(false)
  }

  const chip = (
    <Chip
      variant='outlineWeak'
      size={wide ? 'small' : 'medium'}
      selected={active}
      suffixIcon={<ChevronDown />}
      aria-haspopup='dialog'
      aria-label={disabled && disabledHint ? `${title}, ${disabledHint}` : `${title}, ${summary}`}
      disabled={disabled}
      data-filter={title}
      onClick={() => {
        setDraft(value)
        if (!wide) setOpen(true)
      }}
    >
      {summary}
    </Chip>
  )
  const reset = (
    <Button variant='neutralWeak' size={wide ? 'small' : 'large'} onClick={() => setDraft(resetValue)} data-filter-reset>
      {t('rep.filterReset')}
    </Button>
  )
  const submit = (
    <Button variant='neutralSolid' size={wide ? 'small' : 'large'} disabled={!canApply(draft)} onClick={apply} data-filter-apply>
      {t('rep.filterApply')}
    </Button>
  )

  if (wide) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{chip}</PopoverTrigger>
        <PopoverContent align='start' aria-label={title} className='w-[320px]' onOpenAutoFocus={focusSearchableList}>
          <PopoverBody scrollFog>
            <div className='-mx-x6'>{children(draft, setDraft)}</div>
          </PopoverBody>
          <PopoverFooter>
            {reset}
            {submit}
          </PopoverFooter>
        </PopoverContent>
      </Popover>
    )
  }
  return (
    <>
      {chip}
      <BottomSheet open={open} onOpenChange={setOpen}>
        <BottomSheetContent title={title} aria-describedby={undefined} onOpenAutoFocus={focusSearchableList}>
          <BottomSheetBody scrollFog>
            <div className='-mx-x6'>{children(draft, setDraft)}</div>
          </BottomSheetBody>
          <BottomSheetFooter>
            {reset}
            {submit}
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    </>
  )
}

/** 하나 고르기 — 맨 위 "전체"(chip.md "전체는 맨 앞") + 선택지 라디오 줄 */
function RadioList({ label, value, onChange, items, allLabel }: { label: string; value: string; onChange: (v: string) => void; items: { value: string; title: string }[]; allLabel?: string }) {
  return (
    <ListRadioGroup aria-label={label} value={value} onValueChange={onChange}>
      {allLabel && <ListRadioItem value={ALL} title={allLabel} data-filter-option={ALL} />}
      {items.map((i) => (
        <ListRadioItem key={i.value} value={i.value} title={i.title} data-filter-option={i.value} />
      ))}
    </ListRadioGroup>
  )
}

const EVERYONE = '__everyone__'

/** 담당자 고르기 — 검색칸 + 맨 위 "모든 사람" 줄 + 사람 줄. 목록이 실패하면 그 자리에서 말하고 다시 받는다 */
function PeopleList({
  people,
  failed,
  fetching,
  onRetry,
  value,
  onChange,
}: {
  people: GetUsersResp[]
  failed: boolean
  fetching: boolean
  onRetry: () => void
  value: string
  onChange: (v: string) => void
}) {
  const { t } = useTranslation('work')
  const { t: tc } = useTranslation('common')
  const [query, setQuery] = useState('')
  const shown = useMemo(() => people.filter((p) => matchesSearch(query, p.user_name, p.user_id)), [people, query])
  if (failed) {
    return <ResultSection kind='failure' size='medium' title={t('rep.peopleFailed')} primaryAction={{ label: tc('retry'), onClick: onRetry, loading: fetching }} />
  }
  return (
    <SearchableList value={value || EVERYONE} onValueChange={(v) => onChange(v === EVERYONE ? '' : v)} query={query} onQueryChange={setQuery} placement='inline'>
      <SearchableListInput placeholder={t('rep.peopleSearch')} />
      <SearchableListResults aria-label={t('rep.fUser')}>
        {query.trim() === '' && <SearchableListItem value={EVERYONE} title={t('rep.allPeople')} />}
        {shown.map((p) => (
          <SearchableListItem
            key={p.user_id}
            value={p.user_id}
            title={p.user_name}
            detail={p.main_department_name_kr ? `${p.user_id} · ${p.main_department_name_kr}` : p.user_id}
            prefix={<Avatar name={p.user_name} size={36} />}
          />
        ))}
      </SearchableListResults>
      {shown.length === 0 && <SearchableListEmpty title={t('rep.peopleEmpty')} />}
    </SearchableList>
  )
}

/**
 * 업무 보고 칩 필터 바(I-25 H 49, HC13 B) — 기간 · 담당자 · 업무 분류 · 업무 파트 · 업무 구분 · 정렬. 한 줄 가로 스크롤 · 양 끝 흐림.
 * 기간 칩은 늘 있고 처음 값 "최근 한 달" 은 걸린 조건으로 세지 않는다. 파트는 분류를 고른 뒤에만(막힌 칩 · 이름에 까닭).
 * 분류를 바꾸면 파트는 "전체". 하나라도 걸리면 맨 앞 ↺ 칩("필터 지우기" — 기간 · 정렬은 처음 값, 나머지 전체).
 * [적용] 을 누르면 바로 걸린다(옛 [조회] 단추는 없다). 상태는 화면 상태(주소에 싣지 않는다).
 */
export function ReportFilterBar({
  users,
  groups,
  divisions,
  disabled,
}: {
  users: { data: GetUsersResp[]; failed: boolean; fetching: boolean; refetch: () => void }
  groups: WorkGroupWithParts[]
  divisions: WorkCodeResp[]
  /** 분류 · 구분 목록을 못 받았을 때 그 칩을 막는다 */
  disabled?: { codes?: boolean; all?: boolean }
}) {
  const { t } = useTranslation('work')
  const wide = useWideSurface()
  const { base, filters, setFilters, resetFilters } = useReportContext()
  const periodDefault = isPeriodDefault(filters, base)
  const filtered = isFiltered(filters, base)

  const set = (patch: Partial<ReportFilters>) => setFilters({ ...filters, ...patch })

  const periodSummary = periodDefault ? t('rep.periodDefault') : `${formatMonthDayText(filters.startDate)}${rangeSep()}${formatMonthDayText(filters.endDate)}`
  const person = filters.userId ? (users.data.find((u) => u.user_id === filters.userId)?.user_name ?? filters.userId) : t('rep.allPeople')
  const group = groups.find((g) => g.work_code === filters.groupCode)
  const parts = partsOf(groups, filters.groupCode)
  const part = parts.find((p) => p.work_code === filters.partCode)
  const division = divisions.find((d) => d.work_code === filters.divisionCode)

  const size = wide ? 'small' : 'medium'

  return (
    <ChipGroup layout='scroll' aria-label={t('rep.filterLabel')} data-slot='report-filters' className='py-x2'>
      {filtered && (
        <Chip variant='outlineWeak' size={size} layout='iconOnly' aria-label={t('rep.filterClear')} title={t('rep.filterClear')} data-filter-clear disabled={disabled?.all} onClick={resetFilters}>
          <RotateCcw />
        </Chip>
      )}

      <FilterChip<DateRange | undefined>
        title={t('rep.fPeriod')}
        summary={periodSummary}
        active={!periodDefault}
        disabled={disabled?.all}
        value={{ start: parseDayKey(filters.startDate), end: parseDayKey(filters.endDate) }}
        resetValue={{ start: parseDayKey(base.startDate), end: parseDayKey(base.endDate) }}
        canApply={(d) => !!d?.start && !!d?.end}
        onApply={(d) => d?.start && d?.end && set({ startDate: dayKey(d.start), endDate: dayKey(d.end) })}
      >
        {(draft, setDraft) => (
          <div className='px-x6'>
            <DatePicker selection='range' visibleRange='month' presets={DATE_PRESETS} aria-label={t('rep.fPeriod')} value={draft} onValueChange={setDraft} />
          </div>
        )}
      </FilterChip>

      <FilterChip<string>
        title={t('rep.fUser')}
        summary={person}
        active={filters.userId !== ''}
        disabled={disabled?.all}
        value={filters.userId}
        resetValue=''
        onApply={(v) => set({ userId: v })}
      >
        {(draft, setDraft) => <PeopleList people={users.data} failed={users.failed} fetching={users.fetching} onRetry={users.refetch} value={draft} onChange={setDraft} />}
      </FilterChip>

      <FilterChip<string>
        title={t('rep.fGroup')}
        summary={group?.work_code_name ?? t('rep.fGroup')}
        active={filters.groupCode !== ALL}
        disabled={disabled?.all || disabled?.codes}
        value={filters.groupCode}
        resetValue={ALL}
        onApply={(v) => set({ groupCode: v, partCode: ALL })}
      >
        {(draft, setDraft) => <RadioList label={t('rep.fGroup')} value={draft} onChange={setDraft} allLabel={t('rep.all')} items={groups.map((g) => ({ value: g.work_code, title: g.work_code_name }))} />}
      </FilterChip>

      <FilterChip<string>
        title={t('rep.fPart')}
        summary={part?.work_code_name ?? t('rep.fPart')}
        active={filters.partCode !== ALL}
        disabled={disabled?.all || disabled?.codes || filters.groupCode === ALL}
        disabledHint={t('rep.partNeedGroup')}
        value={filters.partCode}
        resetValue={ALL}
        onApply={(v) => set({ partCode: v })}
      >
        {(draft, setDraft) => <RadioList label={t('rep.fPart')} value={draft} onChange={setDraft} allLabel={t('rep.all')} items={parts.map((p) => ({ value: p.work_code, title: p.work_code_name }))} />}
      </FilterChip>

      <FilterChip<string>
        title={t('rep.fDivision')}
        summary={division?.work_code_name ?? t('rep.fDivision')}
        active={filters.divisionCode !== ALL}
        disabled={disabled?.all || disabled?.codes}
        value={filters.divisionCode}
        resetValue={ALL}
        onApply={(v) => set({ divisionCode: v })}
      >
        {(draft, setDraft) => <RadioList label={t('rep.fDivision')} value={draft} onChange={setDraft} allLabel={t('rep.all')} items={divisions.map((d) => ({ value: d.work_code, title: d.work_code_name }))} />}
      </FilterChip>

      <FilterChip<'latest' | 'oldest'>
        title={t('rep.fSort')}
        summary={filters.sort === 'latest' ? t('rep.latest') : t('rep.oldest')}
        active={filters.sort !== 'latest'}
        disabled={disabled?.all}
        value={filters.sort}
        resetValue='latest'
        onApply={(v) => set({ sort: v })}
      >
        {(draft, setDraft) => (
          <RadioList
            label={t('rep.fSort')}
            value={draft}
            onChange={(v) => setDraft(v as 'latest' | 'oldest')}
            items={[
              { value: 'latest', title: t('rep.latest') },
              { value: 'oldest', title: t('rep.oldest') },
            ]}
          />
        )}
      </FilterChip>
    </ChipGroup>
  )
}
