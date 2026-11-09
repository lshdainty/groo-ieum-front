import { Skeleton } from '@/shared/ds/skeleton'
import { useUser } from '@/entities/session'
import { useUserQuery } from '@/entities/user'
import { UserInfoContent } from '@/features/user-profile/ui/UserInfoContent'
import { WidgetBoundary } from '@/features/dashboard/ui/WidgetResults'
import { WidgetFrame } from '@/features/dashboard/ui/WidgetFrame'

/** 내 정보(D 35 — 홈뿐) — 로그인한 사람의 사진 · 이름 · 키-값 여섯 줄. 받는 동안 원 96 + 줄 여섯 */
export const ProfileWidget = () => {
  const { loginUser } = useUser()
  const userId = loginUser?.user_id || ''
  const query = useUserQuery(userId, { quiet: true })

  return (
    <WidgetFrame id='profile'>
      <WidgetBoundary id='profile' queries={[query]} fallback={<ProfileSkeleton />}>
        {query.data && <UserInfoContent user={query.data} />}
      </WidgetBoundary>
    </WidgetFrame>
  )
}

const ProfileSkeleton = () => (
  <div className='flex flex-col'>
    <div className='flex flex-col items-center gap-x2'>
      <Skeleton radius='full' className='size-[96px]' />
      <Skeleton text='t6' className='block w-1/2' />
      <Skeleton text='t4' className='block w-2/3' />
    </div>
    <div className='mt-x4 flex flex-col gap-x3 border-t border-stroke-neutral-subtle pt-x4'>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} text='t4' className='block w-full' />
      ))}
    </div>
  </div>
)
