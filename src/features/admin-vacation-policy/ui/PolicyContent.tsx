import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { usePolicyContext } from '@/features/admin-vacation-policy/model/PolicyContext';
import {
  useEffectiveTypesQuery,
  useExpirationTypesQuery,
  useGrantMethodTypesQuery,
  useRepeatUnitTypesQuery,
  useVacationTypesQuery
} from '@/entities/type';
import { useVacationPoliciesQuery } from '@/entities/vacation-policy';
import {
  Plus,
  Search,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { VacationPolicyFormDialog } from '@/features/admin-vacation-policy/ui/VacationPolicyFormDialog';
import { VacationPolicyLists } from '@/features/admin-vacation-policy/ui/VacationPolicyLists';
import { PolicyContentSkeleton } from '@/features/admin-vacation-policy/ui/PolicyContentSkeleton';

const PolicyContent = () => {
  const { t } = useTranslation('vacation');
  const { searchQuery, setSearchQuery } = usePolicyContext();

  const { data: vacationPolicies, isLoading } = useVacationPoliciesQuery();
  const { data: grantMethodTypes } = useGrantMethodTypesQuery();
  const { data: effectiveTypes } = useEffectiveTypesQuery();
  const { data: expirationTypes } = useExpirationTypesQuery();
  const { data: vacationTypes } = useVacationTypesQuery();
  const { data: repeatUnitTypes } = useRepeatUnitTypesQuery();

  const filteredPolicies = (vacationPolicies || []).filter(
    policy =>
      policy.vacation_policy_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (policy.vacation_policy_desc && policy.vacation_policy_desc.toLowerCase().includes(searchQuery.toLowerCase()))
  );



  if (isLoading) {
    return <PolicyContentSkeleton />;
  }

  return (
    <div className='p-4 min-[40rem]:p-6 md:p-8'>
      <div className="flex flex-col gap-7">
        {/* 헤더 영역 */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{t('policy.management')}</h1>
          <p className="text-muted-foreground">{t('policy.managementDesc')}</p>
        </div>

        {/* 검색 및 리스트 영역 */}
        <div className="flex flex-col gap-4">
          {/* 검색 영역 */}
          <div className="flex flex-col min-[40rem]:flex-row items-start min-[40rem]:items-center justify-between gap-4">
            <div className="flex flex-col min-[40rem]:flex-row items-start min-[40rem]:items-center gap-4 w-full min-[40rem]:w-auto">
              <div className="relative w-full min-[40rem]:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t('policy.searchPlaceholder')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 w-full min-[40rem]:w-80"
                />
              </div>
              <div className="text-sm text-muted-foreground">{t('policy.totalCount', { count: filteredPolicies.length })}</div>
            </div>

            <VacationPolicyFormDialog
              isEditing={false}
              grantMethodTypes={grantMethodTypes}
              vacationTypes={vacationTypes}
              effectiveTypes={effectiveTypes}
              expirationTypes={expirationTypes}
              repeatUnitTypes={repeatUnitTypes}
              trigger={
                <Button className="flex items-center justify-center gap-2 w-full min-[40rem]:w-auto">
                  <Plus className="h-4 w-4" />
                  {t('policy.addTitle')}
                </Button>
              }
            />
          </div>

          {/* 정책 리스트 */}
          <VacationPolicyLists policies={filteredPolicies} searchQuery={searchQuery} />
        </div>
      </div>
    </div>
  );
};

export { PolicyContent };
