import { useParams } from 'react-router-dom'

import { UserNoticeDetail } from '@/features/user-notice'

/** `/notice/:noticeId` — 주소의 번호가 올바른 정수가 아니면 서버에 묻지 않고 실패 화면(없는 공지와 같은 글)으로 */
export const UserNoticeDetailPage = () => {
  const { noticeId } = useParams()
  const id = Number(noticeId)
  return <UserNoticeDetail noticeId={Number.isInteger(id) && id > 0 ? id : 0} />
}
