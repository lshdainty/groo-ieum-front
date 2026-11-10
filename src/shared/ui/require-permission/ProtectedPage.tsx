import { usePermission } from '@/entities/session';
import { ProgressCircle } from '@/shared/ds/progress-circle';
import { ResultSection } from '@/shared/ds/result-section';
import { Lock } from 'lucide-react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface ProtectedPageProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * 페이지 레벨 권한 체크 컴포넌트
 * 권한이 없으면 접근 불가 메시지를 표시합니다.
 *
 * @param permission - 단일 권한 코드 (예: "ROLE:MANAGE")
 * @param permissions - 여러 권한 코드 배열 (예: ["USER:READ", "USER:EDIT"])
 * @param requireAll - true면 모든 권한 필요, false면 하나만 있어도 됨 (기본값: false)
 * @param children - 권한이 있을 때 렌더링할 페이지 내용
 * @param fallback - 권한이 없을 때 표시할 커스텀 컴포넌트 (선택사항)
 *
 * @example
 * // 단일 권한 체크
 * <ProtectedPage permission="ROLE:MANAGE">
 *   <AuthorityPage />
 * </ProtectedPage>
 *
 * @example
 * // 여러 권한 중 하나만 있으면 됨
 * <ProtectedPage permissions={["USER:READ", "USER:MANAGE"]}>
 *   <UserListPage />
 * </ProtectedPage>
 *
 * @example
 * // 모든 권한이 필요
 * <ProtectedPage permissions={["USER:READ", "USER:EDIT"]} requireAll={true}>
 *   <UserEditPage />
 * </ProtectedPage>
 */
export function ProtectedPage({
  permission,
  permissions,
  requireAll = false,
  children,
  fallback
}: ProtectedPageProps) {
  const { t } = useTranslation('common');
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermission();

  // 로딩 중일 때는 로딩 표시
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <ProgressCircle size="40" aria-label={t('accessDenied.checking')} />
      </div>
    );
  }

  // 권한 체크
  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  // 권한이 없으면 fallback 또는 기본 에러 메시지 표시
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex h-full items-center justify-center p-x8">
        <ResultSection
          kind="failure"
          size="medium"
          icon={<Lock />}
          title={t('accessDenied.title')}
          description={
            <>
              {permission && (
                <span className="block text-t3">
                  {t('accessDenied.required')}: <code className="font-mono">{permission}</code>
                </span>
              )}
              {permissions && permissions.length > 0 && (
                <span className="block text-t3">
                  {t(requireAll ? 'accessDenied.requiredAll' : 'accessDenied.requiredAny')}: <code className="font-mono">{permissions.join(', ')}</code>
                </span>
              )}
              <span className="mt-x2 block">{t('accessDenied.description')}</span>
            </>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}
