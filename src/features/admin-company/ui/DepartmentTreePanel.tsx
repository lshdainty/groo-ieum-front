import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Building2, EllipsisVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { dsText } from '@/shared/ds/i18n'
import { Button } from '@/shared/ds/button'
import { ResponsiveMenu, ResponsiveMenuContent, ResponsiveMenuGroup, ResponsiveMenuItem, ResponsiveMenuTrigger } from '@/shared/ds/menu'
import { ResultSection } from '@/shared/ds/result-section'
import { Skeleton } from '@/shared/ds/skeleton'
import { TreeView } from '@/shared/ds/tree-view'
import { findDept, flattenDepts, hasChildren, toTreeNodes, type Dept } from '../lib/dept-tree'

/** 패널 머리 — "부서"(t5 700) + 오른쪽 ⋮ 자리. 머리 위 12 · 아래 8 · 좌 16 · 우 8(T12) */
export function PanelHeader({ title, id, action }: { title: string; id: string; action?: ReactNode }) {
  return (
    <div className='flex min-h-11 items-center justify-between gap-x2 pb-x2 pl-x4 pr-x2 pt-x3'>
      <h2 id={id} className='m-0 min-w-0 text-t5 font-bold text-fg-neutral'>
        {title}
      </h2>
      {action}
    </div>
  )
}

/** 부서 나무 자리 — 머리는 그대로 두고 줄 여섯(들임 셋 단계)만 기다린다 */
export function TreeSkeleton() {
  return (
    <div className='px-x2 pb-x4' aria-hidden>
      {[1, 2, 2, 3, 3, 2].map((level, i) => (
        <div key={i} className='flex min-h-11 items-center gap-x1_5 py-x3 pr-x2' style={{ paddingLeft: `calc(var(--spacing-x2) + ${level - 1} * var(--spacing-x5))` }}>
          <Skeleton className='size-4 shrink-0' />
          <Skeleton text='t4' className='block w-3/5' />
        </div>
      ))}
    </div>
  )
}

/** 패널 안 실패 — Result Section medium "{구역}을/를 불러오지 못했어요" + [다시 시도] */
export function PanelFailure({ title, onRetry, retrying }: { title: string; onRetry: () => void; retrying?: boolean }) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  return (
    <ResultSection
      kind='failure'
      size='medium'
      title={title}
      description={t('department.failureDesc')}
      primaryAction={{ label: tc('retry'), onClick: onRetry, loading: retrying }}
    />
  )
}

/**
 * 부서 나무 패널(D 18 · E 24) — 머리 "부서" + 오른쪽 ⋮(고른 부서의 동작 — 회사 관리만) + 나무.
 * `foldable`(회사 관리): 줄 전체 = 고르기 + 접고 펴기, 처음엔 모두 펼친다. `fixed`(부서 배치): 늘 펼친 나무, ⋮ 없음.
 * 노드마다의 + ✎ 🗑 · 끌어 놓기는 없다 — 동작은 머리 ⋮ 하나가 고른 부서에 건다.
 */
export function DepartmentTreePanel({
  departments,
  selectedId,
  onSelect,
  mode = 'foldable',
  hideHeader,
  actions,
  empty,
}: {
  departments: Dept[]
  selectedId: number | null
  onSelect: (id: number) => void
  mode?: 'foldable' | 'fixed'
  /** 폰 부서 배치 첫 화면은 머리 없이 나무만 — 제목이 상단 바에 있다 */
  hideHeader?: boolean
  /** 고른 부서의 동작(⋮) — 주면 머리 오른쪽에 단다 */
  actions?: {
    onAddChild: (dept: Dept) => void
    onEdit: (dept: Dept) => void
    onDelete: (dept: Dept) => void
  }
  /** 부서가 하나도 없을 때의 동작 — [부서 추가] */
  empty?: { onAdd?: () => void }
}) {
  const { t } = useTranslation('admin')
  const headingId = useId()
  const nodes = toTreeNodes(departments)
  const selected = selectedId == null ? null : findDept(departments, selectedId)

  // 펼침 — 처음엔 모두 펼치고, 새로 생긴 부모(하위 부서 추가)는 바로 펼쳐 새 부서가 보이게 한다
  const [expanded, setExpanded] = useState<string[]>(() => flattenDepts(departments).filter(hasChildren).map((d) => String(d.department_id)))
  const seen = useRef(new Set(expanded))
  useEffect(() => {
    const fresh = flattenDepts(departments)
      .filter(hasChildren)
      .map((d) => String(d.department_id))
      .filter((id) => !seen.current.has(id))
    if (fresh.length === 0) return
    fresh.forEach((id) => seen.current.add(id))
    setExpanded((list) => [...list, ...fresh])
  }, [departments])

  const menu =
    actions && selected ? (
      <ResponsiveMenu>
        <ResponsiveMenuTrigger asChild>
          <Button variant='ghost' layout='iconOnly' size='medium' aria-label={dsText('common.moreFor', { label: selected.department_name_kr })}>
            <EllipsisVertical />
          </Button>
        </ResponsiveMenuTrigger>
        <ResponsiveMenuContent title={selected.department_name_kr}>
          <ResponsiveMenuGroup>
            <ResponsiveMenuItem icon={<Plus />} label={t('department.addSubBtn')} onSelect={() => actions.onAddChild(selected)} />
            <ResponsiveMenuItem icon={<Pencil />} label={t('department.editBtn')} onSelect={() => actions.onEdit(selected)} />
          </ResponsiveMenuGroup>
          <ResponsiveMenuGroup>
            {hasChildren(selected) ? (
              <ResponsiveMenuItem icon={<Trash2 />} label={t('department.deleteBtn')} disabled description={t('department.deleteBlocked')} />
            ) : (
              <ResponsiveMenuItem icon={<Trash2 />} label={t('department.deleteBtn')} tone='critical' onSelect={() => actions.onDelete(selected)} />
            )}
          </ResponsiveMenuGroup>
        </ResponsiveMenuContent>
      </ResponsiveMenu>
    ) : undefined

  return (
    <div className='flex min-h-0 flex-1 flex-col' data-dept-tree-panel>
      {!hideHeader && <PanelHeader id={headingId} title={t('department.title')} action={menu} />}
      <div className='min-h-0 flex-1 overflow-y-auto'>
        {departments.length === 0 ? (
          <ResultSection
            size='medium'
            icon={<Building2 />}
            title={t('department.noDepartments')}
            primaryAction={empty?.onAdd ? { label: t('department.addBtn'), onClick: empty.onAdd } : undefined}
          />
        ) : (
          <TreeView
            {...(hideHeader ? { 'aria-label': t('department.title') } : { 'aria-labelledby': headingId })}
            nodes={nodes}
            icon={<Building2 />}
            collapsible={mode === 'foldable'}
            selectedId={selectedId == null ? null : String(selectedId)}
            onSelectedChange={(id) => onSelect(Number(id))}
            expandedIds={mode === 'foldable' ? expanded : undefined}
            onExpandedChange={mode === 'foldable' ? setExpanded : undefined}
          />
        )}
      </div>
    </div>
  )
}
