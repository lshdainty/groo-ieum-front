import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/shared/ds/resizable";
import { UserList } from "@/features/admin-authority/ui/UserList";
import { UserListSkeleton } from "@/features/admin-authority/ui/UserListSkeleton";
import { UserRoleAssignment } from "@/features/admin-authority/ui/UserRoleAssignment";
import { UserRoleAssignmentSkeleton } from "@/features/admin-authority/ui/UserRoleAssignmentSkeleton";
import { Authority, Role, User } from "@/features/admin-authority/types";
import { usePermissionsQuery } from '@/entities/permission';
import { useRolesQuery } from '@/entities/role';
import { usePutUserMutation, useUsersQuery, userApi } from '@/entities/user'
import { useIsMobile } from '@/shared/hooks/useIsMobile'
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ResultSection } from "@/shared/ds/result-section";
import { useSnackbar } from "@/shared/ds/snackbar";
import { claimFailure } from '@/shared/api/failure'

const UserManagementPanel = () => {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation('common');
  const usersQ = useUsersQuery({ quiet: true });
  const { data: usersData = [], isLoading: isUsersLoading, refetch: refetchUsers } = usersQ;
  const rolesQ = useRolesQuery({ quiet: true });
  const { data: roles = [], isLoading: isRolesLoading } = rolesQ;
  const permsQ = usePermissionsQuery({ quiet: true });
  const { data: authorities = [], isLoading: isPermissionsLoading } = permsQ;
  const { mutateAsync: updateUser } = usePutUserMutation();
  const isMobile = useIsMobile();
  const snackbar = useSnackbar();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  // 폰: 목록을 내린 채 사용자를 누르면 상세가 맨 위부터 보이게 — 페이지 스크롤이 목록 자리에 남지 않는다
  useEffect(() => {
    if (isMobile && selectedUserId) detailRef.current?.scrollIntoView({ block: "start" });
  }, [isMobile, selectedUserId]);

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

  if (usersQ.isLoadingError || rolesQ.isLoadingError || permsQ.isLoadingError) {
    return (
      <ResultSection
        kind='failure'
        size='medium'
        title={t('authority.userFailureTitle')}
        description={t('users.failureDescription')}
        primaryAction={{ label: tc('retry'), onClick: () => { void usersQ.refetch(); void rolesQ.refetch(); void permsQ.refetch() }, loading: usersQ.isFetching || rolesQ.isFetching || permsQ.isFetching }}
      />
    )
  }

  // 폰은 목록 → 사용자를 누르면 그 사용자 화면(뒤로 = 목록) — 역할 탭과 같은 길. 목록은 숨겨 두어 검색어가 남는다
  if (isMobile) {
    return (
      <div className="flex min-h-[28rem] flex-col bg-bg-layer-default">
        <div hidden={!!selectedUser} className="flex min-h-0 flex-1 flex-col">
          {isLoading ? (
            <UserListSkeleton />
          ) : (
            <UserList
              users={users}
              selectedUserId={selectedUserId}
              onSelectUser={setSelectedUserId}
            />
          )}
        </div>
        {selectedUser && (
          <div ref={detailRef} className="flex min-h-0 flex-1 flex-col" data-user-detail>
            <UserRoleAssignment
              key={selectedUser.id}
              user={selectedUser}
              allRoles={domainRoles}
              onUpdateUserRole={handleUpdateUserRole}
              onBack={() => setSelectedUserId(null)}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <ResizablePanelGroup storageKey="hr-admin-authority-users" className="min-h-[28rem] rounded-r3 border border-solid border-stroke-neutral-subtle bg-bg-layer-default">
      <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="flex flex-col">
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
      <ResizableHandle label={t('department.resizeLabel')} />
      <ResizablePanel className="flex flex-col">
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
          <div className="flex h-full items-center justify-center text-t4 text-fg-neutral-muted">
            {t('authority.selectUserToManage')}
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export { UserManagementPanel };
