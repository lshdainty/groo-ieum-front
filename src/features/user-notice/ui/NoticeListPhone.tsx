import { useTranslation } from 'react-i18next'

import { InfiniteListEnd } from '@/shared/ds/infinite-list'
import { LoadingRegion } from '@/shared/ds/skeleton'
import { useActiveNoticesInfiniteQuery } from '@/entities/notice'
import { NoticeGroupedList } from './NoticeGroupedList'
import { NoticeEmpty, NoticeFailure } from './NoticeResults'
import { NoticeRowsSkeleton } from './NoticeSkeletons'

const PAGE_SIZE = 10

/**
 * 768 미만 공지 목록 — 흰 면 하나 + 끝없이 불러오기(Infinite List: 받는 중 원 · "더 불러오지 못했어요." + [다시 시도] · 끝 글).
 * 상세에서 되돌아오면(POP) 불러온 쪽은 query 캐시가, 스크롤 · 누른 줄은 셸(widgets/layout/lib/screen-memory)이 되살린다.
 */
export const NoticeListPhone = () => {
  const { t } = useTranslation('notice')
  const { data, isPending, isLoadingError, isFetching, isFetchNextPageError, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useActiveNoticesInfiniteQuery(PAGE_SIZE, { quiet: true })

  const items = data?.pages.flatMap((p) => p.content) ?? []
  const ready = data !== undefined

  const single = (data?.pages.length ?? 0) <= 1 && !hasNextPage
  const status = isFetchNextPageError ? 'error' : hasNextPage || isFetchingNextPage ? 'loading' : 'end'

  return (
    <LoadingRegion
      pending={isPending}
      failed={isLoadingError}
      className='bg-bg-layer-default'
      fallback={<NoticeRowsSkeleton />}
      failure={<NoticeFailure onRetry={() => void refetch()} retrying={isFetching} />}
    >
      {ready && items.length === 0 ? (
        <NoticeEmpty />
      ) : (
        <div className='pb-x2' aria-busy={isFetchingNextPage || undefined}>
          <NoticeGroupedList items={items} />
          {!single || status === 'error' ? (
            <InfiniteListEnd
              status={status}
              endText={t('listEnd')}
              onRetry={() => void fetchNextPage()}
              onReachEnd={() => {
                if (hasNextPage && !isFetchingNextPage) void fetchNextPage()
              }}
            />
          ) : null}
        </div>
      )}
    </LoadingRegion>
  )
}
