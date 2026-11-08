import QueryAsyncBoundary from '@/shared/ui/async-boundary/QueryAsyncBoundary';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/ui/shadcn/select';
import { DuesTable } from '@/features/culture-dues/ui/DuesTable';
import { DuesTableSkeleton } from '@/features/culture-dues/ui/DuesTableSkeleton';
import { TotalDues } from '@/features/culture-dues/ui/TotalDues';
import { TotalDuesSkeleton } from '@/features/culture-dues/ui/TotalDuesSkeleton';
import { UserBirthDues } from '@/features/culture-dues/ui/UserBirthDues';
import { UserBirthDuesPageSkeleton } from '@/features/culture-dues/ui/UserBirthDuesSkeleton';
import { useDuesContext } from '@/features/culture-dues/model/DuesContext';
import { useMonthBirthDuesQuery, useUsersMonthBirthDuesQuery, useYearDuesQuery, useYearOperationDuesQuery } from '@/entities/dues';
import { useUsersQuery } from '@/entities/user';
import { useTranslation } from 'react-i18next';

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let i = currentYear - 5; i <= currentYear + 1; i++) {
    years.push(i.toString());
  }
  return years;
};

const DuesContent = () => {
  const { t } = useTranslation('common');
  const { t: tc } = useTranslation('culture');
  const { year, setYear, month } = useDuesContext();

  const { data: totalDues, isLoading: totalDuesLoading, error: totalDuesError } = useYearOperationDuesQuery(year);
  const { data: birthDues, isLoading: birthDuesLoading, error: birthDuesError } = useMonthBirthDuesQuery(year, month);
  const { data: usersBirthDues, isLoading: usersBirthDuesLoading, error: usersBirthDuesError } = useUsersMonthBirthDuesQuery(year);
  const { data: users, isLoading: usersLoading, error: usersError } = useUsersQuery();
  const { data: yearDues, isLoading: yearDuesLoading, error: yearDuesError } = useYearDuesQuery(year);

  const isLoading = totalDuesLoading || birthDuesLoading || usersBirthDuesLoading || usersLoading || yearDuesLoading;
  const error = totalDuesError || birthDuesError || usersBirthDuesError || usersError || yearDuesError;

  return (
    <QueryAsyncBoundary
      queryState={{ isLoading, error, data: true }}
      loadingComponent={
        <div className='p-4 min-[40rem]:p-6 md:p-8'>
          <div className='flex items-center justify-between mb-6'>
            <h1 className='text-3xl font-bold'>{tc('dues.title')}</h1>
            <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
              <SelectTrigger className='w-[120px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getYearOptions().map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='mb-6'>
            <TotalDuesSkeleton />
          </div>
          <div className='mb-6'>
            <UserBirthDuesPageSkeleton />
          </div>
          <DuesTableSkeleton />
        </div>
      }
      errorComponent={
        <div className='p-4 min-[40rem]:p-6 md:p-8'>
          <div className='p-8 text-center text-red-600'>
            {t('loadFailed')}
          </div>
        </div>
      }
    >
      <div className='p-4 min-[40rem]:p-6 md:p-8'>
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-3xl font-bold'>{tc('dues.title')}</h1>
          <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
            <SelectTrigger className='w-[120px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getYearOptions().map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='mb-6'>
          <TotalDues
            totalDues={totalDues}
            birthDues={birthDues}
          />
        </div>
        <div className='mb-6'>
          <UserBirthDues
            usersBirthDues={usersBirthDues}
            users={users}
          />
        </div>
        <DuesTable yearDues={yearDues} />
      </div>
    </QueryAsyncBoundary>
  );
};

export { DuesContent };
