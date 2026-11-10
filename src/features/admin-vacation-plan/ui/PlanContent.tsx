import { useMemo, useState } from 'react'
import { Layers, Plus, SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { List, ListButtonItem } from '@/shared/ds/list'
import { ResultSection } from '@/shared/ds/result-section'
import { LoadingRegion, Skeleton } from '@/shared/ds/skeleton'
import { AdminListCard } from '@/shared/ui/groo/admin-list-card'
import { useConfirmTarget } from '@/shared/ui/confirm'
import { useVacationPlansQuery, type VacationPlanResp } from '@/entities/vacation-plan'
import { SCREEN_TITLE_BOX, ScreenBody } from '@/widgets/layout/ui/ScreenBody'
import { ScreenTitle } from '@/shared/ds/top-navigation'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { usePlanContext } from '../model/PlanContext'
import { PlanFormDialog } from './PlanFormDialog'

const PlanListSkeleton = () => (
  <div className='flex flex-col'>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className='flex flex-col gap-x1 px-x6 py-x3'>
        <Skeleton text='t5' className='block w-2/5' />
        <Skeleton text='t3' className='block w-3/5' />
      </div>
    ))}
  </div>
)

/**
 * 휴가 플랜(I-24 I 41) — 정책 화면과 같은 틀: 제목 줄 "휴가 플랜" + [플랜 추가] → 카드 "플랜 {n}개"(밑줄 검색칸 + List 줄).
 * 줄 = 플랜 이름 + "{설명} · 정책 {n}개"(코드 배지 · 정책 이름 배지는 목록에서 뺐다 — 코드는 폼에서). 줄을 누르면 플랜 폼(머리 ⋮ 정책 관리 · 삭제).
 * 검색은 이름 · 코드 · 설명(지금 그대로). 읽기는 quiet — 실패는 이 구역의 Result Section.
 */
export const PlanContent = () => {
  const { t } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  const desktop = useDesktop()
  const { searchQuery, setSearchQuery } = usePlanContext()
  const plansQuery = useVacationPlansQuery({ quiet: true })
  const edit = useConfirmTarget<VacationPlanResp>()
  const [createOpen, setCreateOpen] = useState(false)

  const plans = plansQuery.data
  const needle = searchQuery.trim().toLowerCase()
  const filtered = useMemo(
    () => (plans ?? []).filter((p) => p.name.toLowerCase().includes(needle) || p.code.toLowerCase().includes(needle) || (p.desc ?? '').toLowerCase().includes(needle)),
    [plans, needle]
  )
  const none = plansQuery.isSuccess && (plans?.length ?? 0) === 0

  const addButton = (
    <Button variant='neutralOutline' size='small' onClick={() => setCreateOpen(true)} data-plan-add>
      <Plus className='size-[18px]' aria-hidden />
      {t('adminPlan.add')}
    </Button>
  )

  return (
    <ScreenBody density='medium'>
      <div className={SCREEN_TITLE_BOX}>
        <ScreenTitle actions={addButton}>{t('adminPlan.title')}</ScreenTitle>
      </div>
      {!desktop && <div className='flex justify-end bg-bg-layer-default px-x6 pt-x3'>{addButton}</div>}
      <AdminListCard
        heading={t('adminPlan.count', { count: filtered.length })}
        searchLabel={t('adminPlan.searchLabel')}
        searchPlaceholder={t('adminPlan.searchPlaceholder')}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        showSearch={!none && !plansQuery.isPending && !plansQuery.isLoadingError}
      >
        <LoadingRegion
          pending={plansQuery.isPending}
          failed={plansQuery.isLoadingError}
          fallback={<PlanListSkeleton />}
          failure={
            <ResultSection
              kind='failure'
              size='medium'
              title={t('adminPlan.failureTitle')}
              description={t('memberVacation.failureDescription')}
              primaryAction={{ label: tc('retry'), onClick: () => void plansQuery.refetch(), loading: plansQuery.isFetching }}
            />
          }
        >
          {none ? (
            <ResultSection size='medium' icon={<Layers />} title={t('adminPlan.emptyTitle')} description={t('adminPlan.emptyDescription')} />
          ) : filtered.length === 0 ? (
            <ResultSection size='medium' icon={<SearchX />} title={t('adminPlan.noMatch')} />
          ) : (
            <List aria-label={t('adminPlan.listLabel')}>
              {filtered.map((plan) => {
                const count = t('adminPlan.policyCount', { count: plan.policies?.length ?? 0 })
                return (
                  <ListButtonItem
                    key={plan.id}
                    data-plan-id={plan.id}
                    title={<span className='[overflow-wrap:break-word] [word-break:keep-all]'>{plan.name}</span>}
                    detail={<span className='block [overflow-wrap:break-word]'>{plan.desc?.trim() ? `${plan.desc} · ${count}` : count}</span>}
                    align='top'
                    onClick={() => edit.ask(plan)}
                  />
                )
              })}
            </List>
          )}
        </LoadingRegion>
      </AdminListCard>
      <PlanFormDialog plan={edit.target} open={edit.open} onOpenChange={edit.onOpenChange} />
      <PlanFormDialog plan={null} open={createOpen} onOpenChange={setCreateOpen} />
    </ScreenBody>
  )
}
