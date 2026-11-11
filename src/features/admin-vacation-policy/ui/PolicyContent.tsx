import { useMemo, useState } from 'react'
import { FileText, Plus, SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { List, ListButtonItem } from '@/shared/ds/list'
import { ResultSection } from '@/shared/ds/result-section'
import { LoadingRegion, Skeleton } from '@/shared/ds/skeleton'
import { AdminListCard } from '@/shared/ui/groo/admin-list-card'
import { useConfirmTarget } from '@/shared/ui/confirm'
import { useEffectiveTypesQuery, useExpirationTypesQuery, useVacationTypesQuery } from '@/entities/type'
import { useVacationPoliciesQuery, type GetVacationPoliciesResp } from '@/entities/vacation-policy'
import { SCREEN_TITLE_BOX, ScreenBody } from '@/widgets/layout/ui/ScreenBody'
import { ScreenTitle } from '@/shared/ds/top-navigation'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { usePolicyContext } from '../model/PolicyContext'
import { policyRuleLine, policyValidityLine } from '../lib/policy-format'
import { PolicyEditDialog } from './PolicyEditDialog'
import { PolicyCreateDialog } from './PolicyCreateDialog'

const PolicyListSkeleton = () => (
  <div className='flex flex-col'>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className='flex flex-col gap-x1 px-x6 py-x3'>
        <Skeleton text='t5' className='block w-2/5' />
        <Skeleton text='t3' className='block w-4/5' />
        <Skeleton text='t3' className='block w-3/5' />
      </div>
    ))}
  </div>
)

/**
 * 휴가 정책(I-24 H 36) — 제목 줄 "휴가 정책" + [정책 추가] → 카드 "정책 {n}개"(밑줄 검색칸 + List 줄).
 * 줄을 누르면 수정 폼(이름 · 설명 — 부여 규칙은 읽기 전용, 삭제는 폼 바닥 왼쪽 — 11-08 줄 ⋮ 금지). 읽기는 quiet — 실패는 이 구역의 Result Section.
 * 폰은 상단 바가 제목이라 본문에는 [정책 추가] 만 둔다(상단 바 오른쪽 아이콘 자리는 24-2 가 만들어 머지되면 거기로 옮긴다).
 */
export const PolicyContent = () => {
  const { t, i18n } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  const desktop = useDesktop()
  const { searchQuery, setSearchQuery } = usePolicyContext()
  const policiesQuery = useVacationPoliciesQuery({ quiet: true })
  const { data: vacationTypes } = useVacationTypesQuery({ quiet: true })
  const { data: effectiveTypes } = useEffectiveTypesQuery({ quiet: true })
  const { data: expirationTypes } = useExpirationTypesQuery({ quiet: true })
  const edit = useConfirmTarget<GetVacationPoliciesResp>()
  const [createOpen, setCreateOpen] = useState(false)

  const policies = policiesQuery.data
  const needle = searchQuery.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      (policies ?? []).filter(
        (p) => p.vacation_policy_name.toLowerCase().includes(needle) || (p.vacation_policy_desc ?? '').toLowerCase().includes(needle)
      ),
    [policies, needle]
  )
  const names = { vacationTypes, effectiveTypes, expirationTypes }
  const none = policiesQuery.isSuccess && (policies?.length ?? 0) === 0

  const addButton = (
    <Button variant='neutralOutline' size='small' onClick={() => setCreateOpen(true)} data-policy-add>
      <Plus className='size-[18px]' aria-hidden />
      {t('adminPolicy.add')}
    </Button>
  )

  return (
    <ScreenBody density='medium'>
      <div className={SCREEN_TITLE_BOX}>
        <ScreenTitle actions={addButton}>{t('adminPolicy.title')}</ScreenTitle>
      </div>
      {!desktop && <div className='flex justify-end bg-bg-layer-default px-x6 pt-x3'>{addButton}</div>}
      <AdminListCard
        heading={t('adminPolicy.count', { count: filtered.length })}
        searchLabel={t('adminPolicy.searchLabel')}
        searchPlaceholder={t('adminPolicy.searchPlaceholder')}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        showSearch={!none && !policiesQuery.isPending && !policiesQuery.isLoadingError}
      >
        <LoadingRegion
          pending={policiesQuery.isPending}
          failed={policiesQuery.isLoadingError}
          fallback={<PolicyListSkeleton />}
          failure={
            <ResultSection
              kind='failure'
              size='medium'
              title={t('adminPolicy.failureTitle')}
              description={t('memberVacation.failureDescription')}
              primaryAction={{ label: tc('retry'), onClick: () => void policiesQuery.refetch(), loading: policiesQuery.isFetching }}
            />
          }
        >
          {none ? (
            <ResultSection size='medium' icon={<FileText />} title={t('adminPolicy.emptyTitle')} description={t('adminPolicy.emptyDescription')} />
          ) : filtered.length === 0 ? (
            <ResultSection size='medium' icon={<SearchX />} title={t('adminPolicy.noMatch')} />
          ) : (
            <List aria-label={t('adminPolicy.listLabel')}>
              {filtered.map((policy) => (
                <ListButtonItem
                  key={policy.vacation_policy_id}
                  data-policy-id={policy.vacation_policy_id}
                  title={<span className='[overflow-wrap:break-word] [word-break:keep-all]'>{policy.vacation_policy_name}</span>}
                  detail={
                    <>
                      <span className='block [overflow-wrap:break-word]'>{policyRuleLine(t, policy, names, i18n.language)}</span>
                      <span className='block [overflow-wrap:break-word]'>{policyValidityLine(t, policy, names)}</span>
                    </>
                  }
                  align='top'
                  onClick={() => edit.ask(policy)}
                />
              ))}
            </List>
          )}
        </LoadingRegion>
      </AdminListCard>
      <PolicyEditDialog policy={edit.target} open={edit.open} onOpenChange={edit.onOpenChange} names={names} />
      <PolicyCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </ScreenBody>
  )
}
