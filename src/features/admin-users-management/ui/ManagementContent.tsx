import QueryAsyncBoundary from '@/shared/ui/async-boundary/QueryAsyncBoundary'
import { ManagementContentSkeleton } from '@/features/admin-users-management/ui/ManagementContentSkeleton'
import { ManagementEmpty } from '@/features/admin-users-management/ui/ManagementEmpty'
import { UserCompanyCard } from '@/features/admin-users-management/ui/UserCompanyCard'
import { UserInviteDialog } from '@/features/admin-users-management/ui/UserInviteDialog'
import { UserTable } from '@/features/admin-users-management/ui/UserTable'
import { useManagementContext } from '@/features/admin-users-management/model/ManagementContext'
import { useCompanyTypesQuery } from '@/entities/type'
import { useUsersQuery } from '@/entities/user'
import { useTranslation } from 'react-i18next'

const ManagementContent = () => {
  const { t } = useTranslation('admin')
  const { data: users, isLoading, error } = useUsersQuery()
  const { data: companyTypes } = useCompanyTypesQuery()
  const { showInviteDialog, setShowInviteDialog } = useManagementContext()

  return (
    <div className='flex w-full h-full p-4 min-[40rem]:p-6 md:p-8'>
      <div className='w-full flex flex-col h-full'>
        <h1 className='text-3xl font-bold mb-6 shrink-0'>{t('user.title')}</h1>
        <div className='flex-0'>
          <QueryAsyncBoundary
            queryState={{ isLoading, error, data: users }}
            loadingComponent={<ManagementContentSkeleton />}
            emptyComponent={<ManagementEmpty className="h-full flex items-center justify-center" />}
            isEmpty={(data) => !data || data.length === 0}
          >
            <div className='flex flex-col gap-6 h-full mb-6'>
              <UserCompanyCard value={users || []} />
              <UserTable value={users || []} />
            </div>
          </QueryAsyncBoundary>
        </div>
      </div>

      {/* 사용자 초대 Dialog - Empty 상태에서도 사용 가능 */}
      <UserInviteDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        title={t('user.inviteTitle')}
        companyOptions={companyTypes || []}
      />
    </div>
  )
}

export { ManagementContent }
