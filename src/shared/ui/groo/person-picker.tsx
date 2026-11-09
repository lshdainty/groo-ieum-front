import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

import { Avatar } from '@/shared/ds/avatar'
import { BottomSheet, BottomSheetContent } from '@/shared/ds/bottom-sheet'
import { InputButton, useInputButtonSurface } from '@/shared/ds/input-button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ds/popover'
import { ScrollFog } from '@/shared/ds/scroll-fog'
import {
  SearchableList,
  SearchableListEmpty,
  SearchableListInput,
  SearchableListItem,
  SearchableListResults,
  focusSearchableList,
  matchesSearch,
} from '@/shared/ds/searchable-list'

/** 사람 한 명 — 고르기 목록이 아는 만큼(사용자 응답에서 뽑는다) */
export interface PersonOption {
  id: string
  name: string
  /** 이름 옆 보조 글 — 주 부서 같은 것. 없으면 이름만 */
  department?: string | null
}

/** 값 글 — "{이름} · {주 부서}", 부서가 없으면 이름만 */
const personLabel = (p: PersonOption): string => (p.department?.trim() ? `${p.name} · ${p.department}` : p.name)

/**
 * 사람 고르기(I-24 C 15) — Input Button 이 고르기 표면을 연다: 1280 이상 Popover · 미만 Bottom Sheet(input-button 표면 규칙).
 * 위 검색칸 "이름 · 아이디 검색"(NFC · 대소문자 · 공백 무시 — 초성은 하지 않는다), 아래 줄(Avatar 32 · 이름 · "{아이디} · {주 부서}"),
 * 하나 고르면 바로 닫힌다. 찾기 0건은 "찾는 직원이 없어요.". 목록은 쓰는 쪽이 준다.
 */
export function PersonPicker({
  people,
  value,
  onValueChange,
  ariaLabel,
  placeholder,
  surfaceTitle,
  searchPlaceholder,
  emptyTitle,
  disabled,
  className,
}: {
  people: PersonOption[]
  value: string
  onValueChange: (id: string) => void
  /** 단추 이름 — 보이는 라벨이 없는 줄이라 이름을 준다 */
  ariaLabel: string
  placeholder: string
  surfaceTitle: string
  searchPlaceholder: string
  emptyTitle: string
  disabled?: boolean
  className?: string
}) {
  const surface = useInputButtonSurface()
  const [open, setOpen] = useState(false)
  const current = people.find((p) => p.id === value)
  const trigger = (
    <InputButton
      className={className}
      size='responsive'
      aria-label={ariaLabel}
      aria-haspopup='dialog'
      aria-expanded={open}
      disabled={disabled}
      placeholder={placeholder}
      value={current ? personLabel(current) : ''}
      suffixIcon={<ChevronDown />}
      onClick={() => setOpen(true)}
      data-person-picker
    />
  )
  const body: ReactNode = (
    <PersonList
      people={people}
      value={value}
      searchPlaceholder={searchPlaceholder}
      emptyTitle={emptyTitle}
      resultsLabel={surfaceTitle}
      onPick={(id) => {
        onValueChange(id)
        setOpen(false)
      }}
    />
  )
  return surface === 'sheet' ? (
    <BottomSheet open={open} onOpenChange={setOpen}>
      {trigger}
      <BottomSheetContent title={surfaceTitle} onOpenAutoFocus={focusSearchableList}>
        <div className='flex min-h-0 flex-1 flex-col'>{body}</div>
      </BottomSheetContent>
    </BottomSheet>
  ) : (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent aria-label={surfaceTitle} align='start' onOpenAutoFocus={focusSearchableList}>
        <div className='flex min-h-0 flex-1 flex-col'>{body}</div>
      </PopoverContent>
    </Popover>
  )
}

function PersonList({
  people,
  value,
  searchPlaceholder,
  emptyTitle,
  resultsLabel,
  onPick,
}: {
  people: PersonOption[]
  value: string
  searchPlaceholder: string
  emptyTitle: string
  resultsLabel: string
  onPick: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const shown = useMemo(() => people.filter((p) => matchesSearch(query, p.name, p.id)), [people, query])
  return (
    <SearchableList value={value} onValueChange={onPick} query={query} onQueryChange={setQuery} className='flex min-h-0 flex-1 flex-col'>
      <SearchableListInput placeholder={searchPlaceholder} />
      <ScrollFog use='overlayBody' className='min-h-0 flex-1'>
        {shown.length === 0 ? (
          <SearchableListEmpty title={emptyTitle} />
        ) : (
          <SearchableListResults aria-label={resultsLabel}>
            {shown.map((p) => (
              <SearchableListItem
                key={p.id}
                value={p.id}
                title={p.name}
                detail={p.department?.trim() ? `${p.id} · ${p.department}` : p.id}
                prefix={<Avatar name={p.name} size={36} />}
              />
            ))}
          </SearchableListResults>
        )}
      </ScrollFog>
    </SearchableList>
  )
}
