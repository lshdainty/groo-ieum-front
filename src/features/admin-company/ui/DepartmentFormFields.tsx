import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@/shared/ds/avatar'
import { ColorSwatchGroup, colorName, type ChartColor, type ColorSwatchValue } from '@/shared/ds/color-swatch'
import { ResultSection } from '@/shared/ds/result-section'
import { ScrollFog } from '@/shared/ds/scroll-fog'
import {
  SearchableList,
  SearchableListEmpty,
  SearchableListInput,
  SearchableListItem,
  SearchableListResults,
  SearchableListSkeleton,
  focusSearchableList,
  matchesSearch,
} from '@/shared/ds/searchable-list'
import { TreeView } from '@/shared/ds/tree-view'
import { PickerRow } from '@/shared/ui/groo/picker-row'
import type { GetUsersResp } from '@/entities/user'
import { chartColorVar, findDept, toTreeNodes, type Dept } from '../lib/dept-tree'

/**
 * 상위 부서 줄(D 20) — 값 = 상위 부서 한글 이름. 누르면 1280 미만 고르기 시트(폼 시트 위) · 이상 그 자리 Popover.
 * 안은 늘 펼친 나무(Tree View `fixed` — 꺾쇠 없이 들임만) · 고른 줄 오른쪽 체크 · 자기와 그 아래 부서는 흐리고 누를 수 없다. 누르면 바로 고르고 닫힌다.
 * 최상위 부서(상위가 없다)의 수정에서는 보기만 하는 줄 "없음 — 최상위 부서".
 */
export function ParentRow({
  departments,
  value,
  onChange,
  blocked,
  selfName,
  readOnlyTop,
}: {
  departments: Dept[]
  value: number | null
  onChange: (id: number) => void
  /** 고를 수 없는 부서(자기와 그 아래) */
  blocked: Set<number>
  selfName?: string
  /** 최상위 부서를 고치는 중 — 보기만 */
  readOnlyTop?: boolean
}) {
  const { t } = useTranslation('admin')
  const nodes = useMemo(() => toTreeNodes(departments, blocked), [departments, blocked])
  const current = value == null ? null : findDept(departments, value)
  const title = t('department.parent')
  if (readOnlyTop) {
    return <PickerRow title={title} value={t('department.parentTop')} readOnly surfaceTitle={title} />
  }
  return (
    <PickerRow
      title={title}
      value={current?.department_name_kr ?? null}
      placeholder={t('department.parentNone')}
      surfaceTitle={title}
      scrollFog
    >
      {({ close }) => (
        <div className='-mx-x2'>
          {selfName && <p className='m-0 px-x4 pb-x2 text-t4 text-fg-neutral-subtle'>{t('department.parentSheetDesc', { name: selfName })}</p>}
          <TreeView
            aria-label={title}
            nodes={nodes}
            collapsible={false}
            selectionMark
            selectedId={value == null ? null : String(value)}
            onSelectedChange={(id) => {
              onChange(Number(id))
              close()
            }}
          />
        </div>
      )}
    </PickerRow>
  )
}

const NONE = '__none__'

/** 부서장 줄(D 20) — 값 = "{이름}" 또는 "없음". 누르면 사람 고르기(검색칸 + 줄 · 맨 위 "없음"), 하나 고르면 닫힌다 */
export function LeaderRow({
  people,
  state = 'ok',
  onRetry,
  value,
  onChange,
}: {
  people: GetUsersResp[]
  /** 사용자 목록 상태 — 받는 중 · 실패면 "없음" 대신 그 상태를 값으로 보이고, 실패면 고르기 안에서 다시 시도 */
  state?: 'ok' | 'pending' | 'error'
  onRetry?: () => void
  value: string
  onChange: (id: string) => void
}) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const [query, setQuery] = useState('')
  const title = t('department.leader')
  const current = people.find((p) => p.user_id === value)
  const shown = useMemo(() => people.filter((p) => matchesSearch(query, p.user_name, p.user_id)), [people, query])
  return (
    <PickerRow
      title={title}
      value={state === 'pending' ? t('department.leaderLoading') : state === 'error' ? t('department.leaderFailed') : (current?.user_name ?? t('department.leaderNone'))}
      ariaLabel={`${title}, ${state === 'pending' ? t('department.leaderLoading') : state === 'error' ? t('department.leaderFailed') : (current?.user_name ?? t('department.leaderNone'))}`}
      surfaceTitle={title}
      bodyless
      onOpen={() => setQuery('')}
      onOpenAutoFocus={focusSearchableList}
    >
      {({ close }) => state === 'error' ? (
        <ResultSection kind='failure' size='medium' title={t('department.leaderFailed')} primaryAction={{ label: tc('retry'), onClick: () => onRetry?.() }} />
      ) : state === 'pending' ? (
        <SearchableListSkeleton prefix='avatar' />
      ) : (
        <SearchableList
          value={value || NONE}
          onValueChange={(id) => {
            onChange(id === NONE ? '' : id)
            close()
          }}
          query={query}
          onQueryChange={setQuery}
          className='flex min-h-0 flex-1 flex-col'
        >
          <SearchableListInput placeholder={t('department.leaderSearch')} />
          <ScrollFog use='overlayBody' className='min-h-0 flex-1'>
            <SearchableListResults aria-label={title}>
              {query.trim() === '' && <SearchableListItem value={NONE} title={t('department.leaderNone')} />}
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
            {query.trim() !== '' && shown.length === 0 && <SearchableListEmpty title={t('department.leaderEmpty')} />}
          </ScrollFog>
        </SearchableList>
      )}
    </PickerRow>
  )
}

/** 색 줄(D 20) — 값 = 색 점 12 + 색 이름. 고르기 안은 Color Swatch(원 40 · 5 × 2). 팔레트 밖 저장 색은 "지금 색" 칸이 골라진 채 열린다 */
export function ColorRow({
  value,
  currentHex,
  onChange,
  errorMessage,
}: {
  /** 보이는 색 — 팔레트 색 이름, 팔레트 밖 hex 가 저장돼 있고 고르지 않았으면 "current", 색이 없으면 null */
  value: ChartColor | 'current' | null
  currentHex: string | null
  onChange: (color: ChartColor | null) => void
  errorMessage?: string | null
}) {
  const { t } = useTranslation('admin')
  const title = t('department.color')
  const name = value === 'current' ? t('department.colorCurrent') : value ? colorName(value) : t('department.colorNone')
  const dot = value === 'current' ? (currentHex ?? undefined) : value ? chartColorVar(value) : undefined
  return (
    <PickerRow
      title={title}
      value={name}
      dot={dot}
      dotSize={12}
      surfaceTitle={title}
      popoverClassName='w-fit'
      errorMessage={errorMessage}
    >
      {({ close }) => (
        <div className='pt-x1'>
          <ColorSwatchGroup
            aria-label={title}
            value={value as ColorSwatchValue | null}
            currentColor={currentHex ?? undefined}
            onValueChange={(v) => {
              // "지금 색" 칸을 고르면 고른 것을 되돌려 저장 값을 그대로 둔다
              onChange(v === 'current' ? null : v)
              close()
            }}
          />
        </div>
      )}
    </PickerRow>
  )
}
