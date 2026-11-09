import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Card } from '@/shared/ds/card'
import { Pagination } from '@/shared/ds/pagination'
import { LoadingRegion } from '@/shared/ds/skeleton'
import { useActiveNoticesQuery } from '@/entities/notice'
import { NoticeGroupedList } from './NoticeGroupedList'
import { NoticeEmpty, NoticeFailure } from './NoticeResults'
import { NoticeRowsSkeleton } from './NoticeSkeletons'

const PAGE_SIZE = 10

const parsePage = (raw: string | null): number => {
  const n = Number(raw)
  return Number.isInteger(n) && n >= 1 ? n : 1
}

/** 768 이상 공지 목록 — 머리 없는 목록 카드 하나 + 아래 Pagination(칸 40 · 쪽은 주소 `?page=n` 에 — 상세에서 돌아오면 그 쪽) */
export const NoticeListDesktop = () => {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const page = parsePage(params.get('page'))
  const cardRef = useRef<HTMLElement>(null)
  const { data, isPending, isLoadingError, isFetching, isPlaceholderData, refetch } = useActiveNoticesQuery(page - 1, PAGE_SIZE, {
    quiet: true,
    keepPrevious: true,
  })

  // 없는 쪽(지워져 줄었거나 손으로 쓴 주소)은 첫 쪽으로
  const outOfRange = data !== undefined && !isPlaceholderData && data.content.length === 0 && data.totalElements > 0 && page > 1
  useEffect(() => {
    if (outOfRange) navigate('/notice', { replace: true })
  }, [outOfRange, navigate])

  const hrefOf = (p: number) => (p <= 1 ? '/notice' : `/notice?page=${p}`)
  const items = data?.content ?? []
  const empty = data !== undefined && data.totalElements === 0

  return (
    <LoadingRegion
      pending={isPending}
      failed={isLoadingError}
      fallback={
        <Card body='list'>
          <NoticeRowsSkeleton />
        </Card>
      }
      failure={
        <Card>
          <NoticeFailure onRetry={() => void refetch()} retrying={isFetching} />
        </Card>
      }
    >
      {empty ? (
        <Card>
          <NoticeEmpty />
        </Card>
      ) : (
        <Card ref={cardRef} body='list' aria-busy={isPlaceholderData || undefined}>
          <NoticeGroupedList items={items} />
          <Pagination
            totalPages={data?.totalPages ?? 0}
            page={page}
            getHref={hrefOf}
            onPageChange={(p) => navigate(hrefOf(p))}
            scrollTarget={cardRef}
            disabled={isPlaceholderData}
          />
        </Card>
      )}
    </LoadingRegion>
  )
}
