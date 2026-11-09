import { useEffect, useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigationType } from 'react-router-dom'

import { InfiniteListEnd } from '@/shared/ds/infinite-list'
import { LoadingRegion } from '@/shared/ds/skeleton'
import { useActiveNoticesInfiniteQuery } from '@/entities/notice'
import { forgetNoticeScroll, recallNoticeScroll, trackNoticeScroll } from '../model/scroll-memory'
import { NoticeGroupedList } from './NoticeGroupedList'
import { NoticeEmpty, NoticeFailure } from './NoticeResults'
import { NoticeRowsSkeleton } from './NoticeSkeletons'

const PAGE_SIZE = 10

/**
 * 768 미만 공지 목록 — 흰 면 하나 + 끝없이 불러오기(Infinite List: 받는 중 원 · "더 불러오지 못했어요." + [다시 시도] · 끝 글).
 * 상세에서 되돌아오면(POP) 불러온 쪽은 query 캐시가, 스크롤 자리는 scroll-memory 가 되살린다.
 */
export const NoticeListPhone = () => {
  const { t } = useTranslation('notice')
  const navType = useNavigationType()
  const { data, isPending, isLoadingError, isFetching, isFetchNextPageError, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useActiveNoticesInfiniteQuery(PAGE_SIZE, { quiet: true })

  const items = data?.pages.flatMap((p) => p.content) ?? []
  const ready = data !== undefined

  // 보는 동안 스크롤 자리를 따라 적는다 — 상세로 가는 링크를 누르면 이 화면이 사라지면서 scrollTop 이 먼저 0 이 된다
  useEffect(() => trackNoticeScroll(), [])
  // 되돌아올 때만 되살린다(POP) — 메뉴로 새로 들어오면 맨 위. 화면 이동 초점(focusScreenTitle)이 맨 위로 보낸 다음에 얹는다
  useLayoutEffect(() => {
    if (!ready) return
    if (navType !== 'POP') {
      forgetNoticeScroll()
      return
    }
    const top = recallNoticeScroll()
    if (top <= 0) return
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        document.querySelector('main')?.scrollTo({ top })
      })
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
    // 처음 그려질 때 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

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
