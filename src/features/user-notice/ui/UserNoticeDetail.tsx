import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/shared/lib/cn'
import { Card } from '@/shared/ds/card'
import { Divider } from '@/shared/ds/divider'
import { LoadingRegion } from '@/shared/ds/skeleton'
import { TagGroup } from '@/shared/ds/tag-group'
import { ScreenTitle } from '@/shared/ds/top-navigation'
import { NoticeContentText, NoticeKinds, formatNoticeDateTime, useNoticeQuery } from '@/entities/notice'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { ParentLink } from '@/widgets/layout/ui/ParentLink'
import { ScreenBody } from '@/widgets/layout/ui/ScreenBody'
import { noticeListHref } from '../model/list-page'
import { NoticeFailure } from './NoticeResults'
import { NoticeDetailSkeleton } from './NoticeSkeletons'

/**
 * 공지 상세 페이지(HN2 B) — 데스크톱: "‹ 공지사항" → 배지 줄 → 카드(제목 h1 · 메타 · 선 · 본문, 글 기둥 최대 720).
 * 폰: 상단 바 ← + "공지사항"(h1) 아래 흰 면 하나(제목은 h2). 열면 상세 GET 이 조회수를 올린다.
 */
export const UserNoticeDetail = ({ noticeId }: { noticeId: number }) => {
  const { t, i18n } = useTranslation('notice')
  const { t: ts } = useTranslation('sidebar')
  const desktop = useDesktop()
  // 주소의 번호가 올바르지 않으면(0) 묻지 않고 실패 — 없는 공지와 같은 화면
  const invalid = noticeId <= 0
  const { data, isPending: loading, isLoadingError, isFetching, refetch } = useNoticeQuery(invalid ? null : noticeId, { quiet: true })
  const isPending = !invalid && loading
  const failed = invalid || isLoadingError

  // 문서 제목 "{공지 제목} - 그루 이음" — 데이터가 오기 전에는 틀이 쓴 "공지사항 - 그루 이음" 그대로, 떠나면 되돌린다
  const { t: tc } = useTranslation('common')
  const docTitle = data?.title
  useEffect(() => {
    if (!docTitle) return
    const prev = document.title
    document.title = `${docTitle} - ${tc('app.title')}`
    return () => {
      document.title = prev
    }
  }, [docTitle, tc])

  const failure = <NoticeFailure onRetry={() => void refetch()} retrying={isFetching} />
  const skeleton = <NoticeDetailSkeleton />

  const meta = data && (
    <TagGroup size='t3'>
      {data.writer_name}
      {formatNoticeDateTime(data.create_date, i18n.language)}
      {t('views', { count: data.view_count, n: data.view_count.toLocaleString(i18n.language) })}
    </TagGroup>
  )
  const body = data && (
    <>
      {/* flex — 줄 높이 24 안에 인라인으로 놓이면 메타(18)가 위아래로 떠서 제목과의 8 이 12 가 된다 */}
      <div className='mt-x2 flex'>{meta}</div>
      <Divider className='my-x5' />
      <NoticeContentText>{data.content}</NoticeContentText>
    </>
  )
  const titleClass = 'm-0 break-keep [overflow-wrap:break-word]'

  if (!desktop) {
    return (
      <LoadingRegion pending={isPending} failed={failed} className='bg-bg-layer-default px-x6 pb-x8 pt-x2' fallback={skeleton} failure={failure}>
        {data && (
          <article>
            <NoticeKinds type={data.notice_type} typeName={data.notice_type_name} pinned={data.is_pinned} />
            <h2 className={`${titleClass} mt-x2 text-t8 font-bold text-fg-neutral`}>{data.title}</h2>
            {body}
          </article>
        )}
      </LoadingRegion>
    )
  }

  return (
    <ScreenBody density='medium'>
      <div className='mx-auto w-full max-w-(--layout-max-low)'>
        <ParentLink to={noticeListHref()} label={ts('menu.notice')} />
        <article className='mt-x2'>
          {data && <NoticeKinds type={data.notice_type} typeName={data.notice_type_name} pinned={data.is_pinned} />}
          <Card className={data ? 'mt-x2' : undefined}>
            {/* h1 은 늘 이 자리에 하나 — 받는 동안 · 실패 때는 화면 이름(보조 기술용)이고, 제목이 오면 같은 요소가 제목이 된다(화면을 옮긴 뒤 초점이 유지된다) */}
            <ScreenTitle className={cn(titleClass, !data && 'sr-only')}>{data ? data.title : ts('menu.notice')}</ScreenTitle>
            <LoadingRegion pending={isPending} failed={failed} fallback={skeleton} failure={failure}>
              {body}
            </LoadingRegion>
          </Card>
        </article>
      </div>
    </ScreenBody>
  )
}
