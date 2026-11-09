import { Dialog, DialogContent } from "@/shared/ui/shadcn/dialog";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/shared/ui/shadcn/resizable";
import { UserList } from "@/features/admin-authority/ui/UserList";
import { UserListSkeleton } from "@/features/admin-authority/ui/UserListSkeleton";
import { UserRoleAssignment } from "@/features/admin-authority/ui/UserRoleAssignment";
import { UserRoleAssignmentSkeleton } from "@/features/admin-authority/ui/UserRoleAssignmentSkeleton";
import { Authority, Role, User } from "@/features/admin-authority/types";
import { usePermissionsQuery } from '@/entities/permission';
import { useRolesQuery } from '@/entities/role';
import { usePutUserMutation, useUsersQuery, userApi } from '@/entities/user'
import { useIsMobile } from '@/shared/hooks/useIsMobile'
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "@/shared/ds/snackbar";
import { claimFailure } from '@/shared/api/failure'

const UserManagementPanel = () => {
  const { t } = useTranslation('admin');
  const { data: usersData = [], isLoading: isUsersLoading, refetch: refetchUsers } = useUsersQuery();
  const { data: roles = [], isLoading: isRolesLoading } = useRolesQuery();
  const { data: authorities = [], isLoading: isPermissionsLoading } = usePermissionsQuery();
  const { mutateAsync: updateUser } = usePutUserMutation();
  const isMobile = useIsMobile();
  const snackbar = useSnackbar();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Map API roles to Domain roles
  const domainRoles: Role[] = useMemo(() => roles.map(r => ({
    ...r,
    permissions: r.permissions
      .map(code => authorities.find(a => a.code === code))
      .filter((a): a is Authority => a !== undefined)
  })), [roles, authorities]);

  useEffect(() => {
    if (usersData) {
      const mappedUsers: User[] = usersData.map(u => ({
        id: u.user_id,
        name: u.user_name,
        email: u.user_email,
        role_codes: u.roles?.map(r => r.role_code) || [], 
        department: u.main_department_name_kr || undefined,
        position: u.user_role_name
      }));
      setUsers(mappedUsers);

      // Check window width directly to avoid race condition with useIsMobile hook
      // which defaults to false (desktop) on first render
      const isDesktop = window.innerWidth >= 768;

      if (isDesktop && mappedUsers.length > 0 && !selectedUserId) {
        setSelectedUserId(mappedUsers[0].id);
      }
    }
  }, [usersData, selectedUserId]);

  const selectedUser = users.find(u => u.id === selectedUserId);
  const isLoading = isUsersLoading || isRolesLoading || isPermissionsLoading;

  const handleUpdateUserRole = async (userId: string, roleCodes: string[]) => {
    try {
      // 1. Fetch full user details (still need direct call here as we need fresh data for update)
      const userDetails = await userApi.getUser(userId);
      
      await updateUser({
        user_id: userDetails.user_id,
        user_name: userDetails.user_name,
        user_email: userDetails.user_email,
        user_birth: userDetails.user_birth,
        user_roles: roleCodes,
        user_company_type: userDetails.user_company_type,
        user_work_time: userDetails.user_work_time,
        lunar_yn: userDetails.lunar_yn,
        profile_url: userDetails.profile_url,
        country_code: userDetails.country_code,
        dashboard: userDetails.dashboard
      });
      
      // Refetch users to reflect changes
      await refetchUsers();

      snackbar.show({ message: t('authority.userRolesUpdated'), tone: 'positive' });
    } catch (error) {
      console.error("Failed to update user roles:", error);
      claimFailure(error);
      snackbar.show({ message: t('authority.userRolesUpdateFailed'), tone: 'critical' });
      // 고르기 화면이 실패를 알아야 고른 것을 그대로 두고 다시 저장하게 할 수 있다
      throw error
    }
  };

  if (isMobile) {
    return (
      <div className="min-h-[28rem] bg-background">
        {isLoading ? (
          <UserListSkeleton />
        ) : (
          <UserList
            users={users}
            selectedUserId={selectedUserId}
            onSelectUser={setSelectedUserId}
          />
        )}

        <Dialog
          open={!!selectedUserId}
          onOpenChange={(open) => {
            if (!open) setSelectedUserId(null);
          }}
        >
          <DialogContent className="w-full h-full max-w-none m-0 p-0 rounded-none border-none bg-background [&>button]:hidden">
            {selectedUser && (
              <UserRoleAssignment
                key={selectedUser.id}
                user={selectedUser}
                allRoles={domainRoles}
                onUpdateUserRole={handleUpdateUserRole}
                onBack={() => setSelectedUserId(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-[calc(100dvh-16rem)] min-h-[28rem] rounded-r3 border bg-background">
      <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
        {isLoading ? (
          <UserListSkeleton />
        ) : (
          <UserList
            users={users}
            selectedUserId={selectedUserId}
            onSelectUser={setSelectedUserId}
          />
        )}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75}>
        {isLoading ? (
          <UserRoleAssignmentSkeleton />
        ) : selectedUser ? (
          <UserRoleAssignment
            key={selectedUser.id}
            user={selectedUser}
            allRoles={domainRoles}
            onUpdateUserRole={handleUpdateUserRole}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {t('authority.selectUserToManage')}
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export { UserManagementPanel };
