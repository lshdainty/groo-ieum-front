import { ChevronDown, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@/shared/ds/avatar'
import { BottomSheet, BottomSheetBody, BottomSheetContent, BottomSheetFooter } from '@/shared/ds/bottom-sheet'
import { Button } from '@/shared/ds/button'
import { Chip, ChipGroup } from '@/shared/ds/chip'
import { ListCheckGroup, ListCheckItem } from '@/shared/ds/list'
import { Popover, PopoverBody, PopoverContent, PopoverFooter, PopoverTrigger } from '@/shared/ds/popover'
import { useWideSurface } from '@/shared/ds/overlay'
import { typeName } from '@/features/calendar/lib/event-text'
import { eventTone } from '@/features/calendar/lib/helpers'
import { useCalendar } from '@/features/calendar/model/calendar-context'
import { calendarTypes } from '@/features/calendar/model/types'

import type { IUser } from '@/features/calendar/model/interfaces'

type Selection = string[] | 'all'

interface Option {
  id: string
  label: string
  prefix: React.ReactNode
}

/**
 * 여는 칩 하나 + 그것이 여는 표면 — 1280 이상 Popover · 미만 Bottom Sheet(G 38).
 * 안: 맨 위 "모두" 줄 + 여럿 고르기 체크 줄(사람: Avatar 24 + 이름 · 유형: 색 점 + 종류 이름) + 바닥 [초기화][적용].
 * 고른 값은 [적용] 에서만 걸린다. 칩 글은 걸린 값의 요약이고 걸리면 짙은 채움.
 */
function FilterChip({
  title,
  summary,
  active,
  options,
  value,
  onApply,
}: {
  title: string
  summary: string
  active: boolean
  options: Option[]
  value: Selection
  onApply: (next: Selection) => void
}) {
  const { t } = useTranslation('calendar')
  const wide = useWideSurface()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Set<string>>(new Set())

  const begin = () => setDraft(new Set(value === 'all' ? options.map((o) => o.id) : value))
  const allChecked = options.length > 0 && options.every((o) => draft.has(o.id))
  const toggle = (id: string) =>
    setDraft((d) => {
      const next = new Set(d)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const apply = () => {
    onApply(options.every((o) => draft.has(o.id)) ? 'all' : options.filter((o) => draft.has(o.id)).map((o) => o.id))
    setOpen(false)
  }

  const chip = (
    <Chip
      variant='outlineWeak'
      size={wide ? 'small' : 'medium'}
      selected={active}
      suffixIcon={<ChevronDown />}
      aria-haspopup='dialog'
      aria-label={`${title}, ${summary}`}
      data-filter={title}
      onClick={() => {
        begin()
        if (!wide) setOpen(true)
      }}
    >
      {summary}
    </Chip>
  )

  const list = (
    <ListCheckGroup aria-label={title}>
      <ListCheckItem
        title={t('filter.all')}
        checked={allChecked}
        onCheckedChange={() => setDraft(allChecked ? new Set() : new Set(options.map((o) => o.id)))}
        data-filter-all
      />
      {options.map((o) => (
        <ListCheckItem key={o.id} title={o.label} prefix={o.prefix} checked={draft.has(o.id)} onCheckedChange={() => toggle(o.id)} data-filter-option={o.id} />
      ))}
    </ListCheckGroup>
  )
  const reset = (
    <Button variant='neutralWeak' size={wide ? 'small' : 'large'} onClick={() => setDraft(new Set(options.map((o) => o.id)))} data-filter-reset>
      {t('filter.reset')}
    </Button>
  )
  const submit = (
    <Button variant='neutralSolid' size={wide ? 'small' : 'large'} disabled={draft.size === 0} onClick={apply} data-filter-apply>
      {t('filter.apply')}
    </Button>
  )

  if (wide) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{chip}</PopoverTrigger>
        <PopoverContent align='start' aria-label={title} className='w-[320px]'>
          <PopoverBody scrollFog>
            <div className='-mx-x6'>{list}</div>
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
        <BottomSheetContent title={title} aria-describedby={undefined}>
          <BottomSheetBody scrollFog>
            <div className='-mx-x6'>{list}</div>
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

const summaryOf = (names: string[], total: number, all: string, some: (name: string, count: number) => string): string => {
  if (names.length === 0 || names.length === total) return all
  return names.length === 1 ? names[0] : some(names[0], names.length - 1)
}

/**
 * 필터 칩 둘 — "모든 사람" · "모든 유형"(G 38). 걸린 조건이 하나라도 있으면 맨 앞에 ↺ 칩("필터 지우기").
 * 상태는 화면 안(캘린더 상태) — 주소 · 저장소에 두지 않는다(지금 그대로).
 */
export function FilterChips({ people }: { people: IUser[] }) {
  const { t } = useTranslation('calendar')
  const { selectedUserIds, setSelectedUserIds, selectedTypeIds, setSelectedTypeIds } = useCalendar()
  const wide = useWideSurface()

  const personOptions: Option[] = people.map((u) => ({ id: u.id, label: u.name, prefix: <Avatar name={u.name} src={u.picturePath ?? undefined} size={24} /> }))
  const typeOptions: Option[] = calendarTypes.map((c) => ({
    id: c.id,
    label: t(c.nameKey),
    prefix: <span aria-hidden className='size-x2 shrink-0 rounded-full' style={{ background: eventTone({ type: c }).color }} />,
  }))

  const pickedPeople = selectedUserIds === 'all' ? [] : people.filter((u) => selectedUserIds.includes(u.id)).map((u) => u.name)
  const pickedTypes = selectedTypeIds === 'all' ? [] : calendarTypes.filter((c) => selectedTypeIds.includes(c.id)).map((c) => typeName({ type: c, title: c.name }, t))
  const filtered = selectedUserIds !== 'all' || selectedTypeIds !== 'all'

  return (
    <ChipGroup data-slot='calendar-filters' aria-label={t('filter.label')} layout='wrap' className='min-w-0'>
      {filtered && (
        <Chip
          variant='outlineWeak'
          size={wide ? 'small' : 'medium'}
          layout='iconOnly'
          aria-label={t('filter.clear')}
          title={t('filter.clear')}
          data-filter-clear
          onClick={() => {
            setSelectedUserIds('all')
            setSelectedTypeIds('all')
          }}
        >
          <RotateCcw />
        </Chip>
      )}
      <FilterChip
        title={t('filter.peopleTitle')}
        summary={summaryOf(pickedPeople, people.length, t('filter.allPeople'), (name, count) => t('filter.peopleSome', { name, count }))}
        active={selectedUserIds !== 'all'}
        options={personOptions}
        value={selectedUserIds}
        onApply={setSelectedUserIds}
      />
      <FilterChip
        title={t('filter.typeTitle')}
        summary={summaryOf(pickedTypes, calendarTypes.length, t('filter.allTypes'), (name, count) => t('filter.typesSome', { name, count }))}
        active={selectedTypeIds !== 'all'}
        options={typeOptions}
        value={selectedTypeIds}
        onApply={setSelectedTypeIds}
      />
    </ChipGroup>
  )
}
