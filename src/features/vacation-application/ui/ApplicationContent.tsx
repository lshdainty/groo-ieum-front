import QueryAsyncBoundary from '@/shared/ui/async-boundary/QueryAsyncBoundary';
import { Button } from '@/shared/ui/shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/ui/shadcn/select';
import { useUser } from '@/entities/session';
import { ApplicationFormDialog } from '@/features/vacation-application/ui/ApplicationFormDialog';
import { ApplicationTable } from '@/features/vacation-application/ui/ApplicationTable';
import { ApplicationTableSkeleton } from '@/features/vacation-application/ui/ApplicationTableSkeleton';
import { VacationRequestStatsCards } from '@/features/vacation-application/ui/VacationRequestStatsCards';
import { VacationRequestStatsContentSkeleton } from '@/features/vacation-application/ui/VacationRequestStatsCardsSkeleton';
import { useApplicationContext } from '@/features/vacation-application/model/ApplicationContext';
import { useGrantStatusTypesQuery } from '@/entities/type';
import { useUserApproversQuery } from '@/entities/user';
import { useUserRequestedVacationsQuery, useUserRequestedVacationStatsQuery } from '@/entities/vacation';
import { useUserVacationPoliciesQuery } from '@/entities/vacation-policy';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let i = currentYear - 5; i <= currentYear + 1; i++) {
    years.push(i.toString());
  }
  return years;
};

const ApplicationContent = () => {
  const { t } = useTranslation('vacation');
  const { t: tc } = useTranslation('common');
  const { isDialogOpen, setIsDialogOpen, selectedYear, setSelectedYear } = useApplicationContext();
  const { loginUser } = useUser();

  const { data: vacationPolicies = [] } = useUserVacationPoliciesQuery(
    loginUser?.user_id || '',
    'ON_REQUEST'
  );
  const { data: approversData } = useUserApproversQuery(loginUser?.user_id || '');
  const { data: vacationRequests = [], isLoading: isLoadingRequests, error: requestsError } = useUserRequestedVacationsQuery(
    loginUser?.user_id || '',
    parseInt(selectedYear)
  );
  const { data: grantStatusTypes = [] } = useGrantStatusTypesQuery();
  const { data: stats, isLoading: isLoadingStats, error: statsError } = useUserRequestedVacationStatsQuery(
    loginUser?.user_id || '',
    parseInt(selectedYear)
  );

  const isLoading = isLoadingRequests || isLoadingStats;
  const error = requestsError || statsError;

  const handleCreateNew = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleSubmitSuccess = () => {
    setIsDialogOpen(false);
  };

  const SkeletonContent = () => (
    <div className='p-4 min-[40rem]:p-6 min-[48rem]:p-8'>
      <div className='flex flex-col min-[64rem]:flex-row min-[64rem]:items-center min-[64rem]:justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold mb-2'>{t('application.pageTitle')}</h1>
          <p className='text-foreground/70'>{t('application.pageSubtitle')}</p>
        </div>
        <div className='flex items-center gap-2 mt-4 min-[64rem]:mt-0'>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className='w-[120px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getYearOptions().map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <VacationRequestStatsContentSkeleton />
      <ApplicationTableSkeleton />
    </div>
  );

  return (
    <QueryAsyncBoundary
      queryState={{ isLoading, error, data: vacationRequests }}
      loadingComponent={<SkeletonContent />}
      errorComponent={
        <div className='p-4 min-[40rem]:p-6 min-[48rem]:p-8'>
          <div className='p-8 text-center text-red-600'>
            {tc('loadFailed')}
          </div>
        </div>
      }
    >
      <div className='p-4 min-[40rem]:p-6 min-[48rem]:p-8'>
        <div className='flex flex-col min-[64rem]:flex-row min-[64rem]:items-center min-[64rem]:justify-between mb-8'>
          <div>
            <h1 className='text-3xl font-bold mb-2'>{t('application.pageTitle')}</h1>
            <p className='text-foreground/70'>{t('application.pageSubtitle')}</p>
          </div>
          <div className='flex items-center gap-2 mt-4 min-[64rem]:mt-0'>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className='w-[120px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getYearOptions().map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCreateNew} className='flex items-center gap-2'>
              <Plus className='w-4 h-4' />
              {t('application.newApplication')}
            </Button>
          </div>
        </div>
        {isLoadingStats ? (
          <VacationRequestStatsContentSkeleton />
        ) : (
          <VacationRequestStatsCards stats={stats} />
        )}
        <ApplicationTable
          vacationRequests={vacationRequests}
          grantStatusTypes={grantStatusTypes}
          userId={loginUser?.user_id || ''}
        />
        <ApplicationFormDialog
          open={isDialogOpen}
          onClose={handleCloseDialog}
          onSubmitSuccess={handleSubmitSuccess}
          vacationPolicies={vacationPolicies}
          approversData={approversData || { approvers: [], max_available_count: 0, is_auto_approval: false }}
        />
      </div>
    </QueryAsyncBoundary>
  );
};

export { ApplicationContent }
