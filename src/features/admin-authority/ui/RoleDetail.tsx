import { RequirePermission } from "@/shared/ui/require-permission/RequirePermission";
import { Button } from "@/shared/ui/shadcn/button";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import { Spinner } from "@/shared/ui/shadcn/spinner";
import { Textarea } from "@/shared/ui/shadcn/textarea";
import { usePermission } from '@/entities/session';
import { MobilePermissionDrawer } from "@/features/admin-authority/ui/MobilePermissionDrawer";
import { PermissionMatrix } from "@/features/admin-authority/ui/PermissionMatrix";
import { Authority, Role } from "@/features/admin-authority/types";
import { useIsMobile } from '@/shared/hooks/useIsMobile'
import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface RoleDetailProps {
  role: Role;
  allAuthorities: Authority[];
  onUpdateRole: (updatedRole: Role) => void;
  onSaveRole: (role?: Role) => void;
  onSavePermissions: (permissionCodes: string[]) => Promise<void>;
  onBack?: () => void;
  isSavingRole?: boolean;
  isSavingPermissions?: boolean;
}

const RoleDetail = ({
  role,
  allAuthorities,
  onUpdateRole,
  onSaveRole,
  onSavePermissions,
  onBack,
  isSavingRole = false,
  isSavingPermissions = false
}: RoleDetailProps) => {
  const { t } = useTranslation('admin');
  const { hasPermission } = usePermission();
  const canManageRoles = hasPermission("ROLE:MANAGE");
  const isMobile = useIsMobile();

  // 새 역할인지 확인
  const isNewRole = (role as any).isNew;

  // 데스크톱에서 권한을 로컬로 관리
  const [localPermissionIds, setLocalPermissionIds] = useState<string[]>(
    (role.permissions || []).filter(p => p && p.code).map(p => p.code)
  );

  // role이 변경되면 로컬 권한 상태도 동기화
  useEffect(() => {
    setLocalPermissionIds((role.permissions || []).filter(p => p && p.code).map(p => p.code));
  }, [role.role_code, role.permissions]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateRole({ ...role, role_code: e.target.value });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateRole({ ...role, role_name: e.target.value });
  };

  const handleDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateRole({ ...role, desc: e.target.value });
  };

  // 데스크톱용 로컬 권한 토글
  const handleToggleLocalAuthority = (authCode: string, checked: boolean) => {
    setLocalPermissionIds(prev =>
      checked
        ? [...prev.filter(id => id !== authCode), authCode] // 중복 방지
        : prev.filter(id => id !== authCode)
    );
  };

  // 데스크톱용 로컬 권한 그룹 토글
  const handleToggleLocalGroup = (authCodes: string[], checked: boolean) => {
    setLocalPermissionIds(prev => {
      if (checked) {
        const newIds = authCodes.filter(id => !prev.includes(id));
        return [...prev, ...newIds];
      } else {
        return prev.filter(id => !authCodes.includes(id));
      }
    });
  };

  // 데스크톱에서 권한 저장
  const handleSavePermissions = async () => {
    // 새 역할인 경우 로컬 상태를 role.permissions에 반영
    if (isNewRole) {
      const newPermissions = allAuthorities.filter(a => localPermissionIds.includes(a.code));
      onUpdateRole({ ...role, permissions: newPermissions });
    }
    await onSavePermissions(localPermissionIds);
  };

  // 모바일에서 권한 저장
  const handleMobileSave = async (newPermissionCodes: string[]) => {
    // 새 역할인 경우 로컬 상태를 role.permissions에 반영
    if (isNewRole) {
      const newPermissions = allAuthorities.filter(a => newPermissionCodes.includes(a.code));
      onUpdateRole({ ...role, permissions: newPermissions });
    }
    await onSavePermissions(newPermissionCodes);
  };

  // 권한 변경 여부 확인
  const originalPermissionIds = (role.permissions || []).filter(p => p && p.code).map(p => p.code).sort();
  const currentPermissionIds = [...localPermissionIds].sort();
  const hasPermissionChanges = JSON.stringify(originalPermissionIds) !== JSON.stringify(currentPermissionIds);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 md:p-6 border-b bg-background sticky top-0 z-20">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2">
            {onBack && (
              <Button variant="outline" size="icon" onClick={onBack} className="mr-2 md:hidden shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{t('authority.roleDetail')}</h2>
              {!isMobile && (
                <p className="text-muted-foreground">{t('authority.roleDetailDesc')}</p>
              )}
            </div>
          </div>
          <RequirePermission permission="ROLE:MANAGE">
            <Button onClick={() => onSaveRole()} className="gap-2" disabled={isSavingRole}>
              {isSavingRole ? <Spinner /> : <Save className="w-4 h-4" />}
              {isNewRole ? t('authority.createRole') : t('authority.saveRole')}
            </Button>
          </RequirePermission>
        </div>

        <div className="grid gap-4 max-w-[42rem]">
          <div className="grid gap-2">
            <Label htmlFor="role-code">{t('authority.roleCode')}</Label>
            <Input
              id="role-code"
              value={role.role_code}
              onChange={handleCodeChange}
              placeholder={t('authority.roleCodePlaceholder')}
              disabled={!isNewRole}
              className={!isNewRole ? "bg-muted" : ""}
            />
            {!isNewRole && (
              <p className="text-xs text-muted-foreground">{t('authority.roleCodeDisabledHint')}</p>
            )}
            {isNewRole && (
              <p className="text-xs text-muted-foreground">{t('authority.roleCodeHint')}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role-name">{t('authority.roleName')}</Label>
            <Input
              id="role-name"
              value={role.role_name}
              onChange={handleNameChange}
              placeholder={t('authority.roleNamePlaceholder')}
              disabled={!canManageRoles}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role-desc">{t('authority.roleDesc')}</Label>
            <Textarea
              id="role-desc"
              value={role.desc}
              onChange={handleDescChange}
              placeholder={t('authority.roleDescPlaceholder')}
              className="resize-none"
              disabled={!canManageRoles}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/10 pb-20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t('authority.permissions')}</h3>
          {!isMobile && (
            <RequirePermission permission="ROLE:MANAGE">
              <Button
                onClick={handleSavePermissions}
                className="gap-2"
                disabled={isSavingPermissions || (!hasPermissionChanges && !isNewRole)}
                variant={hasPermissionChanges ? "default" : "outline"}
              >
                {isSavingPermissions ? <Spinner /> : <Save className="w-4 h-4" />}
                {t('authority.savePermissions')}
                {hasPermissionChanges && (
                  <span className="bg-primary-foreground/20 text-xs px-1.5 py-0.5 rounded-full">
                    {t('authority.changed')}
                  </span>
                )}
              </Button>
            </RequirePermission>
          )}
        </div>
        {isMobile ? (
          <MobilePermissionDrawer
            authorities={allAuthorities}
            selectedAuthorityIds={(role.permissions || []).filter(p => p && p.code).map(p => p.code)}
            onSave={handleMobileSave}
            disabled={!canManageRoles}
          />
        ) : (
          <PermissionMatrix
            authorities={allAuthorities}
            selectedAuthorityIds={localPermissionIds}
            onToggleAuthority={handleToggleLocalAuthority}
            onToggleGroup={handleToggleLocalGroup}
            disabled={!canManageRoles || isSavingPermissions}
          />
        )}
      </div>
    </div>
  );
};

export { RoleDetail };
