import { ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@/shared/ds/avatar'
import { InputButton } from '@/shared/ds/input-button'
import { Popover, PopoverBody, PopoverContent, PopoverTrigger } from '@/shared/ds/popover'
import { SearchableList, SearchableListEmpty, SearchableListInput, SearchableListItem, SearchableListResults, focusSearchableList, matchesSearch } from '@/shared/ds/searchable-list'
import type { GetUsersResp } from '@/entities/user'

/** 담당자 하나 고르기 — 검색칸 + 사람 줄(25-4 칩 필터 바의 담당자 고르기와 같은 부품) */
export function PersonList({ people, value, onPick }: { people: GetUsersResp[]; value: string; onPick: (id: string) => void }) {
  const { t } = useTranslation('work')
  const [query, setQuery] = useState('')
  const shown = useMemo(() => people.filter((p) => matchesSearch(query, p.user_name, p.user_id)), [people, query])
  return (
    <SearchableList value={value} onValueChange={onPick} query={query} onQueryChange={setQuery} placement='inline'>
      <SearchableListInput placeholder={t('rep.peopleSearch')} />
      <SearchableListResults aria-label={t('rep.fUser')}>
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

/** 표 안 담당자 고르기 칸(1280 이상) — 입력칸 모양 버튼이 사람 검색 Popover 를 연다 */
export function PersonPick({ people, value, name, invalid, disabled, onPick }: { people: GetUsersResp[]; value: string; name: string; invalid: boolean; disabled: boolean; onPick: (id: string) => void }) {
  const { t } = useTranslation('work')
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <InputButton
          size='medium'
          rootClassName='w-[130px]'
          aria-label={t('rep.fManager')}
          placeholder={t('rep.xPickPerson')}
          value={invalid ? '' : name}
          suffixIcon={<ChevronDown />}
          aria-haspopup='dialog'
          aria-invalid={invalid || undefined}
          disabled={disabled}
          data-import-fix='manager'
        />
      </PopoverTrigger>
      <PopoverContent align='start' aria-label={t('rep.fManager')} className='w-[320px]' onOpenAutoFocus={focusSearchableList}>
        <PopoverBody scrollFog>
          <div className='-mx-x6'>
            <PersonList
              people={people}
              value={value}
              onPick={(id) => {
                onPick(id)
                setOpen(false)
              }}
            />
          </div>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}
