import { useUser } from '@/entities/session'
import { useUserQuery } from '@/entities/user'
import { DashboardContent } from '@/features/dashboard/ui/DashboardContent'

/** 홈 — 사용자 정보에 실린 저장된 배치(`dashboard`)를 읽어 그린다. 읽기 실패는 그 자리 Result Section + [다시 시도](GET 은 조용히) */
const DashboardPage = () => {
  const { loginUser } = useUser()
  const userId = loginUser?.user_id || ''
  const user = useUserQuery(userId, { quiet: true })

  return (
    <DashboardContent
      userId={userId}
      dashboard={user.data?.dashboard}
      pending={!userId || user.isPending}
      failed={user.isLoadingError}
      retrying={user.isFetching}
      onRetry={() => void user.refetch()}
    />
  )
}

export { DashboardPage }
