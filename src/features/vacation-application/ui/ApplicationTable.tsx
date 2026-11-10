import { CalendarX2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ResultSection } from '@/shared/ds/result-section'
import { LoadingRegion } from '@/shared/ds/skeleton'
import { ScreenCard } from '@/shared/ui/groo/screen-card'
import type { GetUserRequestedVacationsResp } from '@/entities/vacation'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { useWide } from '@/widgets/layout/lib/use-wide'
import { RequestListContent, RequestListSkeleton, RequestTableSkeleton } from './RequestListContent'

export interface RequestListStatus {
  pending: boolean
  failed: boolean
  fetching: boolean
  onRetry: () => void
}

/**
 * 신청 내역 구역(I-25 D 20) — 데스크톱 카드 "신청 내역" · 폰 띠. 머리는 늘 그리고 내용 자리만 기다린다(읽기는 quiet — 실패는 이 구역이 말한다).
 * 구성원 휴가의 직원 탭도 같은 부품을 쓴다(취소 없음 `cancelUserId` 안 줌 · 제목 · 빈 글을 인자로).
 */
export function ApplicationTable({
  requests,
  status,
  year,
  cancelUserId,
  title,
  emptyTitle,
  emptyDescription,
  onCreate,
}: {
  requests: GetUserRequestedVacationsResp[]
  status?: RequestListStatus
  year: number
  /** 내 신청 화면이면 로그인한 사람의 id — 취소 길이 열린다. 구성원 휴가는 주지 않는다(남의 신청은 취소 못 함) */
  cancelUserId?: string
  title?: string
  emptyTitle?: string
  emptyDescription?: string
  /** 빈 목록의 [휴가 신청] — 내 신청 화면만 */
  onCreate?: () => void
}) {
  const { t } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  const desktop = useDesktop()
  const wide = useWide()
  return (
    <ScreenCard title={title ?? t('req.listTitle')}>
      <div data-section='requests'>
        <LoadingRegion
          pending={status?.pending ?? false}
          failed={status?.failed ?? false}
          fallback={desktop ? <RequestTableSkeleton wide={wide} /> : <RequestListSkeleton />}
          failure={
            <ResultSection
              kind='failure'
              size='medium'
              title={t('req.failureTitle')}
              description={t('memberVacation.failureDescription')}
              primaryAction={{ label: tc('retry'), onClick: () => status?.onRetry(), loading: status?.fetching }}
            />
          }
        >
          {requests.length === 0 ? (
            <ResultSection
              size='medium'
              icon={<CalendarX2 />}
              title={emptyTitle ?? t('req.emptyTitle', { year })}
              description={emptyDescription ?? t('req.emptyDescription')}
              primaryAction={onCreate ? { label: t('req.create'), onClick: onCreate } : undefined}
            />
          ) : (
            <RequestListContent rows={requests} cancelUserId={cancelUserId} />
          )}
        </LoadingRegion>
      </div>
    </ScreenCard>
  )
}
