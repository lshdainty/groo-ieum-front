import QueryAsyncBoundary from '@/shared/ui/async-boundary/QueryAsyncBoundary'
import { Button } from '@/shared/ui/shadcn/button'
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/shadcn/dialog'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/shared/ui/shadcn/resizable'
import { DepartmentTreePanel } from '@/features/admin-company/ui/DepartmentTreePanel'
import { DepartmentContentSkeleton } from '@/features/admin-users-department/ui/DepartmentContentSkeleton'
import { DepartmentEmpty } from '@/features/admin-users-department/ui/DepartmentEmpty'
import { UserDepartmentTransfer } from '@/features/admin-users-department/ui/UserDepartmentTransfer'
import { useDepartmentContext } from '@/features/admin-users-department/model/DepartmentContext'
import { useCompanyQuery, useCompanyWithDepartmentsQuery } from '@/entities/company'
import { useDeleteDepartmentUsersMutation, useDepartmentUsersQuery, usePostDepartmentUsersMutation } from '@/entities/department'
import { useIsMobile } from '@/shared/hooks/useIsMobile'
import { type GetCompanyResp } from '@/entities/company'
import { type UserInfo } from '@/entities/department'
import { ArrowLeft, Building2 } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

interface DepartmentContentInnerProps {
  company: GetCompanyResp
}

const DepartmentContentInner = ({ company }: DepartmentContentInnerProps) => {
  const { t } = useTranslation('admin')
  const { selectedDept, setSelectedDept } = useDepartmentContext()
  const isMobile = useIsMobile()

  const { data: companyWithDepartments } = useCompanyWithDepartmentsQuery(company.company_id)

  const { data: departmentUsers, isLoading: isDepartmentUsersLoading } = useDepartmentUsersQuery(
    selectedDept?.department_id
  )

  const postDepartmentUsers = usePostDepartmentUsersMutation()
  const deleteDepartmentUsers = useDeleteDepartmentUsersMutation()

  const departments = useMemo(() => {
    return companyWithDepartments?.departments || []
  }, [companyWithDepartments])

  const handleTransfer = async (addedUsers: UserInfo[], removedUsers: UserInfo[]) => {
    if (!selectedDept?.department_id) return

    const departmentId = selectedDept.department_id

    try {
      if (addedUsers.length > 0) {
        await postDepartmentUsers.mutateAsync({
          departmentId,
          data: {
            users: addedUsers.map(user => ({
              user_id: user.user_id,
              main_yn: user.main_yn
            }))
          }
        })
      }

      if (removedUsers.length > 0) {
        await deleteDepartmentUsers.mutateAsync({
          departmentId,
          data: {
            user_ids: removedUsers.map(user => user.user_id)
          }
        })
      }
    } catch (error) {
      console.error('Failed to update department users:', error)
    }
  }

  if (isMobile) {
    return (
      <div className='h-full w-full flex flex-col p-4 gap-4 overflow-hidden'>
        <div className='flex items-center gap-2 shrink-0'>
          <Building2 />
          <h1 className='text-2xl font-bold'>{company.company_name}</h1>
        </div>

        <div className='flex-1 border rounded-lg overflow-hidden'>
          <DepartmentTreePanel
            departments={departments}
            selectedDept={selectedDept}
            onDeptSelect={setSelectedDept}
            onDeptUpdate={() => {}}
            onDeptDelete={() => {}}
            companyId={company.company_id}
            title={t('department.list')}
            showAddButton={false}
            showNodeActions={false}
            disableCollapse={true}
          />
        </div>

        <Dialog
          open={!!selectedDept}
          onOpenChange={(open) => {
            if (!open) setSelectedDept(null)
          }}
        >
          <DialogContent className="w-full h-full max-w-none m-0 p-0 rounded-none border-none bg-background [&>button]:hidden flex flex-col" aria-describedby={undefined}>
            <div className="p-4 border-b flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => setSelectedDept(null)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <DialogTitle className="text-lg font-semibold">
                {selectedDept?.department_name}
              </DialogTitle>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 min-h-full">
                {selectedDept && (
                  <UserDepartmentTransfer
                    key={selectedDept.department_id}
                    usersInDepartment={departmentUsers?.users_in_department || []}
                    usersNotInDepartment={departmentUsers?.users_not_in_department || []}
                    isLoading={isDepartmentUsersLoading}
                    isSaving={postDepartmentUsers.isPending || deleteDepartmentUsers.isPending}
                    onTransfer={handleTransfer}
                  />
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className='h-full w-full'>
      <div className='h-full flex flex-col p-4 min-[40rem]:p-6 min-[48rem]:p-8 gap-6 overflow-hidden'>
        <div className='flex items-center gap-2 shrink-0'>
          <Building2 />
          <h1 className='text-3xl font-bold'>{company.company_name}</h1>
        </div>
        <ResizablePanelGroup direction='horizontal' className='flex-1 min-h-0 rounded-lg border'>
          <ResizablePanel
            defaultSize={25}
            minSize={25}
            style={{ overflow: 'hidden' }}
          >
            <DepartmentTreePanel
              departments={departments}
              selectedDept={selectedDept}
              onDeptSelect={setSelectedDept}
              onDeptUpdate={() => {}}
              onDeptDelete={() => {}}
              companyId={company.company_id}
              title={t('department.list')}
              showAddButton={false}
              showNodeActions={false}
              disableCollapse={true}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel
            defaultSize={75}
            style={{ overflow: 'hidden' }}
          >
            <div className='p-4 h-full'>
              {selectedDept ? (
                <UserDepartmentTransfer
                  key={selectedDept.department_id}
                  usersInDepartment={departmentUsers?.users_in_department || []}
                  usersNotInDepartment={departmentUsers?.users_not_in_department || []}
                  isLoading={isDepartmentUsersLoading}
                  isSaving={postDepartmentUsers.isPending || deleteDepartmentUsers.isPending}
                  onTransfer={handleTransfer}
                />
              ) : (
                <div className='flex items-center justify-center h-full text-muted-foreground'>
                  <p>{t('user.selectDepartment')}</p>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}

const DepartmentContent = () => {
  const { data: company, isLoading, error } = useCompanyQuery()

  return (
    <QueryAsyncBoundary
      queryState={{ isLoading, error, data: company }}
      loadingComponent={<DepartmentContentSkeleton />}
      emptyComponent={<DepartmentEmpty className="h-full flex items-center justify-center" />}
      isEmpty={(data) => !data}
    >
      <DepartmentContentInner company={company!} />
    </QueryAsyncBoundary>
  )
}

export { DepartmentContent }
