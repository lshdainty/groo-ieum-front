import { useUser } from '@/entities/session'
import { useUserQuery } from '@/entities/user'
import { UserInfoContent } from '@/features/user-profile/ui/UserInfoContent'
import { WidgetBoundary } from '@/features/dashboard/ui/WidgetResults'
import { WidgetFrame } from '@/features/dashboard/ui/WidgetFrame'

/** 내 정보(D 35 — 홈뿐) — 로그인한 사람의 사진 · 이름 · 키-값 여섯 줄. 받는 동안 같은 부품 — 줄 라벨은 실제 글, 사진 · 이름 · 값 자리만 스켈레톤 */
export const ProfileWidget = () => {
  const { loginUser } = useUser()
  const userId = loginUser?.user_id || ''
  const query = useUserQuery(userId, { quiet: true })

  return (
    <WidgetFrame id='profile'>
      <WidgetBoundary id='profile' queries={[query]} fallback={<UserInfoContent />}>
        {query.data && <UserInfoContent user={query.data} />}
      </WidgetBoundary>
    </WidgetFrame>
  )
}
