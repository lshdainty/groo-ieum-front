import QueryAsyncBoundary from '@/shared/ui/async-boundary/QueryAsyncBoundary';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { EmptyPlan } from '@/features/admin-vacation-plan/ui/EmptyPlan';
import { PlanContentSkeleton } from '@/features/admin-vacation-plan/ui/PlanContentSkeleton';
import { VacationPlanFormDialog } from '@/features/admin-vacation-plan/ui/VacationPlanFormDialog';
import { VacationPlanLists } from '@/features/admin-vacation-plan/ui/VacationPlanLists';
import { usePlanContext } from '@/features/admin-vacation-plan/model/PlanContext';
import { useVacationPlansQuery } from '@/entities/vacation-plan';
import { type VacationPlanResp } from '@/entities/vacation-plan';
import { Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PlanContentInnerProps {
  vacationPlans: VacationPlanResp[];
}

const PlanContentInner = ({ vacationPlans }: PlanContentInnerProps) => {
  const { t } = useTranslation('vacation');
  const { searchQuery, setSearchQuery } = usePlanContext();

  const filteredPlans = vacationPlans.filter(
    plan =>
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (plan.desc && plan.desc.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className='p-4 min-[40rem]:p-6 min-[48rem]:p-8'>
      <div className="flex flex-col gap-7">
        {/* Header area */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{t('plan.management')}</h1>
          <p className="text-muted-foreground">{t('plan.managementDesc')}</p>
        </div>

        {/* Search and list area */}
        <div className="flex flex-col gap-4">
          {/* Search area */}
          <div className="flex flex-col min-[40rem]:flex-row items-start min-[40rem]:items-center justify-between gap-4">
            <div className="flex flex-col min-[40rem]:flex-row items-start min-[40rem]:items-center gap-4 w-full min-[40rem]:w-auto">
              <div className="relative w-full min-[40rem]:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t('plan.searchPlaceholder')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 w-full min-[40rem]:w-80"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {t('plan.totalCount', { count: filteredPlans.length })}
              </div>
            </div>

            <VacationPlanFormDialog
              isEditing={false}
              trigger={
                <Button className="flex items-center justify-center gap-2 w-full min-[40rem]:w-auto">
                  <Plus className="h-4 w-4" />
                  {t('plan.addTitle')}
                </Button>
              }
            />
          </div>

          {/* Plan list */}
          <VacationPlanLists plans={filteredPlans} searchQuery={searchQuery} />
        </div>
      </div>
    </div>
  );
};

const PlanContent = () => {
  const { data: vacationPlans, isLoading, error } = useVacationPlansQuery();

  return (
    <QueryAsyncBoundary
      queryState={{ isLoading, error, data: vacationPlans }}
      loadingComponent={<PlanContentSkeleton />}
      emptyComponent={<EmptyPlan className="h-full flex items-center justify-center" />}
      isEmpty={(data) => !data || data.length === 0}
    >
      <PlanContentInner vacationPlans={vacationPlans!} />
    </QueryAsyncBoundary>
  );
};

export { PlanContent };
