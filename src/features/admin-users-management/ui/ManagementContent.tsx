import { useTranslation } from 'react-i18next'

import { Card, CardHeader } from '@/shared/ds/card'
import { LoadingRegion, Skeleton } from '@/shared/ds/skeleton'
import { ResultSection } from '@/shared/ds/result-section'
import { Table, TableBody, TableHead, TableHeader, TableRow, TableSkeletonRows } from '@/shared/ds/table'
import { useUsersQuery } from '@/entities/user'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { ScreenBody, ScreenTitleRow } from '@/widgets/layout/ui/ScreenBody'
import { UserCompanyCard } from './UserCompanyCard'
import { UserDialogs } from './UserDialogs'
import { UserListCard } from './UserTable'

const UsersSkeleton = ({ desktop }: { desktop: boolean }) => {
  const { t } = useTranslation('admin')
  if (!desktop) {
    return (
      <div className='flex flex-col gap-x2'>
        {[4, 5].map((rows, k) => (
          <div key={k} className='bg-bg-layer-default pb-x2 pt-x1'>
            <div className='px-global-gutter pb-x1 pt-x5'>
              <Skeleton text='t5' className='block w-1/3' />
            </div>
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className='flex items-center gap-x3 px-global-gutter py-x3'>
                <Skeleton className='size-[42px] shrink-0 rounded-full' />
                <div className='flex flex-1 flex-col gap-x1'>
                  <Skeleton text='t5' className='block w-3/5' />
                  <Skeleton text='t3' className='block w-4/5' />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className='flex flex-col gap-x6'>
      <div className='grid grid-cols-2 gap-x6 min-[80rem]:grid-cols-4'>
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <div className='flex items-center gap-x3'>
              <Skeleton radius='8' className='size-x8 shrink-0' />
              <div className='flex flex-1 flex-col gap-x1'>
                <Skeleton text='t3' className='block w-1/2' />
                <Skeleton text='t5' className='block w-1/3' />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Card body='list'>
        <CardHeader>
          <Skeleton text='t5' className='block w-24' />
        </CardHeader>
        <Table caption={t('users.listCaption')} rowHeight='rich'>
          <TableHeader>
            <TableRow>
              <TableHead>{t('users.colName')}</TableHead>
              <TableHead>{t('users.colId')}</TableHead>
              <TableHead>{t('users.colWorkTime')}</TableHead>
              <TableHead>{t('users.colCompany')}</TableHead>
              <TableHead>{t('users.colStatus')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableSkeletonRows rows={5} columns={[{ width: '70%' }, { width: '60%' }, { width: '70%' }, { width: '60%' }, { width: '50%' }]} />
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

/**
 * 사용자 관리(I-24 F) — 데스크톱: 제목 줄 → 회사별 지표 카드 → 24 → 카드 "사용자 {n}명" 안 표. 폰: 띠 둘(회사별 인원 · 사용자).
 * 표면(초대 · 수정 · 휴가 플랜 · 확인창)은 폭을 가르는 트리 밖(UserDialogs)에 하나로 두어 768 을 넘나들어도 열린 폼이 이어진다.
 * 읽기는 quiet — 실패는 이 구역의 Result Section + [다시 시도].
 */
const ManagementContent = () => {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const desktop = useDesktop()
  const query = useUsersQuery({ quiet: true })
  const users = query.data ?? []

  return (
    <ScreenBody density='high'>
      <ScreenTitleRow title={t('user.title')} />
      <LoadingRegion
        pending={query.isPending}
        failed={query.isLoadingError}
        fallback={<UsersSkeleton desktop={desktop} />}
        failure={
          <ResultSection
            kind='failure'
            size='medium'
            title={t('users.failureTitle')}
            description={t('users.failureDescription')}
            primaryAction={{ label: tc('retry'), onClick: () => void query.refetch(), loading: query.isFetching }}
          />
        }
      >
        <div className={desktop ? 'flex flex-col gap-x6' : 'flex flex-col gap-x2'}>
          <UserCompanyCard value={users} desktop={desktop} />
          <UserListCard users={users} />
        </div>
      </LoadingRegion>
      <UserDialogs users={users} />
    </ScreenBody>
  )
}

export { ManagementContent }
