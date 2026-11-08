import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/shadcn/avatar';
import { Badge } from '@/shared/ui/shadcn/badge';
import { Button } from '@/shared/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/ui/shadcn/dropdownMenu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/shadcn/table';
import { config } from '@/shared/config'
import { usePermission } from '@/entities/session';
import { ResendEmailDialog } from '@/features/admin-users-management/ui/ResendEmailDialog';
import { UserDeleteDialog } from '@/features/admin-users-management/ui/UserDeleteDialog';
import { UserInviteDialog } from '@/features/admin-users-management/ui/UserInviteDialog';
import { UserPasswordResetDialog } from '@/features/admin-users-management/ui/UserPasswordResetDialog';
import { UserVacationPlanDialog } from '@/features/admin-users-management/ui/UserVacationPlanDialog';
import { useManagementContext } from '@/features/admin-users-management/model/ManagementContext';
import { UserEditDialog } from '@/features/user-profile/ui/UserEditDialog';
import { useCompanyTypesQuery } from '@/entities/type';
import { useDeleteUserMutation, usePutUserMutation } from '@/entities/user';
import { type GetUsersResp, type PutUserReq } from '@/entities/user';
import { cn } from '@/shared/lib'
import { Empty } from 'antd';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, EllipsisVertical, KeyRound, MailPlus, Pencil, ShieldEllipsis, Trash2 } from 'lucide-react';
import { Activity, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface UserTableProps {
  value: GetUsersResp[];
}

const ROWS_PER_PAGE = 10;

const UserTable = ({ value: users }: UserTableProps) => {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation('common');
  const { mutate: putUser } = usePutUserMutation();
  const { mutate: deleteUser } = useDeleteUserMutation();
  const { data: companyTypes } = useCompanyTypesQuery();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = users.length > 0 ? Math.ceil(users.length / ROWS_PER_PAGE) : 1;
  const paginatedUsers = users.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const {
    setShowInviteDialog,
    showEditDialog, setShowEditDialog,
    showResendDialog, setShowResendDialog,
    showPlanDialog, setPlanDialog,
    showDeleteDialog, setShowDeleteDialog,
    showInviteEditDialog, setShowInviteEditDialog,
    showPasswordResetDialog, setShowPasswordResetDialog
  } = useManagementContext();

  const { hasPermission, hasAllPermissions } = usePermission();

  const handleUpdateUser = (user: PutUserReq) => {
    putUser({
      user_id: user.user_id,
      user_name: user.user_name,
      user_email: user.user_email,
      user_birth: dayjs(user.user_birth).format('YYYY-MM-DD'),
      user_company_type: user.user_company_type,
      user_work_time: user.user_work_time,
      lunar_yn: user.lunar_yn,
      profile_url: user.profile_url,
      profile_uuid: user.profile_uuid,
      country_code: user.country_code
    });
  };

  const handleDeleteUser = (id: string) => {
    deleteUser(id);
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>{t('user.list')}</CardTitle>
          <div className='flex gap-2'>
            <Activity mode={hasPermission('USER:MANAGE') ? 'visible' : 'hidden'}>
              <Button className='text-sm h-8' size='sm' onClick={() => setShowInviteDialog(true)}>
                {t('user.invite')}
              </Button>
            </Activity>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {users && users.length > 0 ? (
          <div className='overflow-x-auto relative'>
            <Table className='min-w-[1000px]'>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className={cn(
                      'min-w-[180px] w-[180px] pl-4',
                      'sticky left-0 z-5 bg-card'
                    )}
                  >
                    {tc('name')}
                  </TableHead>
                  <TableHead className='min-w-[120px]'>{t('user.tableId')}</TableHead>
                  <TableHead className='min-w-[220px]'>{t('user.tableEmail')}</TableHead>
                  <TableHead className='min-w-[130px]'>{t('user.tableWorkTime')}</TableHead>
                  <TableHead className='min-w-[120px]'>{t('user.tableCompany')}</TableHead>
                  <TableHead className='min-w-[120px]'>{t('user.tableDepartment')}</TableHead>
                  <TableHead className='min-w-[120px]'>{t('user.tableInviteStatus')}</TableHead>
                  <TableHead className='min-w-20 pr-4'></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((row: GetUsersResp) => (
                  <TableRow
                    key={row.user_id}
                    className={cn(
                      'hover:bg-muted/50 hover:text-foreground',
                      'dark:hover:bg-muted/80 dark:hover:text-foreground'
                    )}
                  >
                    <TableCell 
                      className={cn(
                        'pl-4 w-[180px]',
                        'sticky left-0 z-5 bg-card'
                      )}
                    >
                      <div className='flex items-center gap-3'>
                        <Avatar className='w-8 h-8 shrink-0'>
                          <AvatarImage src={`${config.baseUrl}${row.profile_url}`} alt={row.user_name} />
                          <AvatarFallback>{row.user_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className='font-medium'>{row.user_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{row.user_id}</TableCell>
                    <TableCell>{row.user_email}</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        'text-xs whitespace-nowrap',
                        {
                          'bg-rose-500 text-white': row.user_work_time === '8 ~ 17',
                          'bg-sky-500 text-white': row.user_work_time === '9 ~ 18',
                          'bg-emerald-500 text-white': row.user_work_time === '10 ~ 19',
                          'bg-amber-500 text-white': row.user_work_time === '13 ~ 21'
                        }
                      )}>
                        {row.user_work_time}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className='text-sm'>{row.user_origin_company_name}</span>
                    </TableCell>
                    <TableCell>
                      <span className='text-sm'>{row.main_department_name_kr || '-'}</span>
                    </TableCell>

                    <TableCell>
                      <Badge className={cn(
                        'text-xs whitespace-nowrap',
                        {
                          'bg-yellow-500 text-white': row.invitation_status === 'PENDING',
                          'bg-green-500 text-white': row.invitation_status === 'ACTIVE',
                          'bg-gray-500 text-white': row.invitation_status === 'INACTIVE',
                          'bg-red-500 text-white': row.invitation_status === 'EXPIRED'
                        }
                      )}>
                        {row.invitation_status === 'PENDING' && t('user.statusPending')}
                        {row.invitation_status === 'ACTIVE' && t('user.statusActive')}
                        {row.invitation_status === 'INACTIVE' && t('user.statusInactive')}
                        {row.invitation_status === 'EXPIRED' && t('user.statusExpired')}
                        {!row.invitation_status && '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className='pr-4'>
                      <div className='flex justify-end'>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-8 w-8 p-0 data-[state=open]:bg-muted hover:bg-muted'
                            >
                              <EllipsisVertical className='w-4 h-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end' className='w-32'>
                            <Activity mode={hasPermission('USER:MANAGE') && row.invitation_status !== 'ACTIVE' ? 'visible' : 'hidden'}>
                              <DropdownMenuItem
                                onSelect={() => setShowResendDialog(row.user_id)}
                              >
                                <MailPlus className='h-4 w-4' />
                                <span>{t('user.resendEmail')}</span>
                              </DropdownMenuItem>
                            </Activity>
                            <Activity mode={row.invitation_status === 'ACTIVE' && hasPermission('USER:MANAGE') ? 'visible' : 'hidden'}>
                              <DropdownMenuItem
                                onSelect={() => setShowEditDialog(row.user_id)}
                              >
                                <Pencil className='h-4 w-4' />
                                <span>{t('user.editTitle')}</span>
                              </DropdownMenuItem>
                            </Activity>
                            <Activity mode={row.invitation_status === 'PENDING' && hasPermission('USER:MANAGE') ? 'visible' : 'hidden'}>
                              <DropdownMenuItem
                                onSelect={() => setShowInviteEditDialog(row.user_id)}
                              >
                                <Pencil className='h-4 w-4' />
                                <span>{t('user.inviteEdit')}</span>
                              </DropdownMenuItem>
                            </Activity>
                            <Activity mode={row.invitation_status !== 'ACTIVE' && row.invitation_status !== 'PENDING' ? 'visible' : 'hidden'}>
                              <DropdownMenuItem
                                disabled
                              >
                                <Pencil className='h-4 w-4' />
                                <span>{t('user.editTitle')}</span>
                              </DropdownMenuItem>
                            </Activity>
                            <Activity mode={row.invitation_status === 'ACTIVE' && hasAllPermissions(['USER:MANAGE', 'VACATION:MANAGE']) ? 'visible' : 'hidden'}>
                              <DropdownMenuItem
                                onSelect={() => setPlanDialog(row.user_id)}
                              >
                                <ShieldEllipsis className='h-4 w-4' />
                                <span>{t('user.vacationPlan')}</span>
                              </DropdownMenuItem>
                            </Activity>
                            <Activity mode={row.invitation_status === 'ACTIVE' && hasPermission('USER:MANAGE') ? 'visible' : 'hidden'}>
                              <DropdownMenuItem
                                onSelect={() => setShowPasswordResetDialog(row.user_id)}
                              >
                                <KeyRound className='h-4 w-4' />
                                <span>{t('user.passwordReset')}</span>
                              </DropdownMenuItem>
                            </Activity>
                            <DropdownMenuSeparator />
                            <Activity mode={hasPermission('USER:MANAGE') ? 'visible' : 'hidden'}>
                              <DropdownMenuItem
                                onSelect={() => setShowDeleteDialog(row.user_id)}
                                className='text-destructive focus:text-destructive hover:bg-destructive/20!'
                              >
                                <Trash2 className='h-4 w-4' />
                                <span>{tc('delete')}</span>
                              </DropdownMenuItem>
                            </Activity>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Empty />
        )}
        {users && users.length > 0 && (
          <div className='flex items-center justify-between pt-4 border-t mt-4'>
            <div className='text-sm text-muted-foreground'>
              {users.length} row(s)
            </div>
            <div className='flex items-center space-x-6 min-[64rem]:space-x-8'>
              <div className='flex items-center space-x-2'>
                <p className='text-sm font-medium'>
                  Page {currentPage} of {totalPages}
                </p>
              </div>
              <div className='flex items-center space-x-2'>
                <Button
                  variant='outline'
                  className='h-8 w-8 p-0'
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage <= 1}
                >
                  <span className='sr-only'>Go to first page</span>
                  <ChevronsLeft className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  className='h-8 w-8 p-0'
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <span className='sr-only'>Go to previous page</span>
                  <ChevronLeft className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  className='h-8 w-8 p-0'
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  <span className='sr-only'>Go to next page</span>
                  <ChevronRight className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  className='h-8 w-8 p-0'
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage >= totalPages}
                >
                  <span className='sr-only'>Go to last page</span>
                  <ChevronsRight className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* 메일 재전송 Dialog */}
      {showResendDialog && (
        <ResendEmailDialog
          open={true}
          onOpenChange={(open) => !open && setShowResendDialog(null)}
          userId={showResendDialog}
          userEmail={users.find(u => u.user_id === showResendDialog)?.user_email || ''}
        />
      )}

      {/* ACTIVE 상태 수정 Dialog */}
      {showEditDialog && (
        <UserEditDialog
          open={true}
          onOpenChange={(open) => !open && setShowEditDialog(null)}
          user={users.find(u => u.user_id === showEditDialog)!}
          onSave={handleUpdateUser}
        />
      )}

      {showPlanDialog && (
        <UserVacationPlanDialog
          open={true}
          onOpenChange={(open) => !open && setPlanDialog(null)}
          userId={showPlanDialog}
          userName={users.find(u => u.user_id === showPlanDialog)?.user_name}
        />
      )}

      {/* PENDING 상태 수정 Dialog */}
      {showInviteEditDialog && (() => {
        const user = users.find(u => u.user_id === showInviteEditDialog)
        return user ? (
          <UserInviteDialog
            open={true}
            onOpenChange={(open) => !open && setShowInviteEditDialog(null)}
            title={t('user.inviteEdit')}
            companyOptions={companyTypes || []}
            initialData={{
              user_id: user.user_id,
              user_name: user.user_name,
              user_email: user.user_email,
              user_company_type: user.user_company_type,
              user_work_time: user.user_work_time,
              join_date: user.join_date,
              country_code: user.country_code
            }}
          />
        ) : null
      })()}

      {/* 삭제 Dialog */}
      {showDeleteDialog && (
        <UserDeleteDialog
          open={true}
          onOpenChange={(open) => !open && setShowDeleteDialog(null)}
          user={users.find(u => u.user_id === showDeleteDialog)!}
          onDelete={handleDeleteUser}
        />
      )}

      {/* 비밀번호 초기화 Dialog */}
      {showPasswordResetDialog && (
        <UserPasswordResetDialog
          open={true}
          onOpenChange={(open) => !open && setShowPasswordResetDialog(null)}
          userId={showPasswordResetDialog}
          userName={users.find(u => u.user_id === showPasswordResetDialog)?.user_name || ''}
        />
      )}
    </Card>
  )
}

export { UserTable }