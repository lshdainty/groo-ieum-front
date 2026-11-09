import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { ListButtonItem, ListItem, ListLinkItem } from '@/shared/ds/list'
import { TagGroup } from '@/shared/ds/tag-group'
import type { NoticeListResp } from '@/entities/notice/model/types'
import { formatNoticeDay } from '@/entities/notice/lib/notice-format'
import { NoticeKinds } from '@/entities/notice/ui/NoticeKinds'

/**
 * 공지 줄 — 공용(I-23 G 55). 위 배지 줄(분류만 — 고정은 목록의 "고정" 머리 묶음이 말한다, Q-i23-a 1) → 아래 4 제목(줄바꿈 전부 · 말줄임 없음) → 메타 "{작성자} · {날짜} · 조회 {n}".
 * 두 갈래: ① `href` 를 주면 누르는 줄(상세 주소로 가는 링크 — 사용자 목록) ② 안 주면 누르지 않는 줄(관리 폰 목록 — I-24 J 50 이 쓴다).
 * 관리 쪽이 붙일 것은 `badges`(배지 줄 뒤 — 노출 상태 배지) · `suffix`(뒤 붙이개 — ⋮) 로 넘긴다.
 */
export const NoticeRow = ({
  notice,
  href,
  badges,
  suffix,
  onClick,
}: {
  notice: NoticeListResp
  href?: string
  /** 누르면 하는 일 — 관리 폰 목록의 줄(누르면 수정 시트). `href` 와 함께 쓰지 않는다 */
  onClick?: () => void
  badges?: React.ReactNode
  suffix?: React.ReactNode
}) => {
  const { t, i18n } = useTranslation('notice')
  const title = (
    <>
      <span className='mb-x1 block'>
        <NoticeKinds type={notice.notice_type} typeName={notice.notice_type_name}>
          {badges}
        </NoticeKinds>
      </span>
      {notice.title}
    </>
  )
  const meta = (
    <TagGroup size='t3'>
      {notice.writer_name}
      {formatNoticeDay(notice.create_date, i18n.language)}
      {t('views', { count: notice.view_count, n: notice.view_count.toLocaleString(i18n.language) })}
    </TagGroup>
  )
  if (href) {
    return (
      <ListLinkItem asChild title={title} detail={meta} align='top' suffix={suffix}>
        <Link to={href} />
      </ListLinkItem>
    )
  }
  if (onClick) return <ListButtonItem title={title} detail={meta} align='top' suffix={suffix} onClick={onClick} data-notice-id={notice.notice_id} />
  return <ListItem title={title} detail={meta} align='top' suffix={suffix} />
}
