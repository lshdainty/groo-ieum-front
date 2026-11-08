import { Card, CardContent, CardHeader } from '@/shared/ui/shadcn/card';
import { Skeleton } from '@/shared/ui/shadcn/skeleton';
import dayjs from 'dayjs';
import { BanknoteArrowDown, BanknoteArrowUp, DollarSign, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TotalDuesSkeleton = () => {
  const { t } = useTranslation('culture');
  const currentMonth = dayjs().format('MM');

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 min-[64rem]:grid-cols-4 gap-6'>
      <Card className='relative overflow-hidden'>
        <CardHeader className='pb-2'>
          <div className='flex items-center gap-2'>
            <DollarSign className='w-5 h-5 text-blue-600' />
            <h3 className='text-sm font-medium text-card-foreground'>{t('dues.totalOperationFee')}</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className='flex items-baseline gap-1 mb-2'>
            <Skeleton className='h-9 w-32' />
            <span className='text-lg text-card-foreground opacity-60'>{t('dues.currencyUnit')}</span>
          </div>
          <Skeleton className='h-3 w-24' />
        </CardContent>
        <div className='absolute bottom-0 right-0 w-16 h-16 opacity-10'>
          <DollarSign className='w-full h-full p-3' />
        </div>
      </Card>

      <Card className='relative overflow-hidden'>
        <CardHeader className='pb-2'>
          <div className='flex items-center gap-2'>
            <BanknoteArrowUp className='w-5 h-5 text-green-600' />
            <h3 className='text-sm font-medium text-card-foreground'>{t('dues.operationDeposit')}</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className='flex items-baseline gap-1 mb-2'>
            <Skeleton className='h-9 w-32' />
            <span className='text-lg text-card-foreground opacity-60'>{t('dues.currencyUnit')}</span>
          </div>
          <Skeleton className='h-3 w-20' />
        </CardContent>
        <div className='absolute bottom-0 right-0 w-16 h-16 opacity-10'>
          <BanknoteArrowUp className='w-full h-full p-3' />
        </div>
      </Card>

      <Card className='relative overflow-hidden'>
        <CardHeader className='pb-2'>
          <div className='flex items-center gap-2'>
            <BanknoteArrowDown className='w-5 h-5 text-red-600' />
            <h3 className='text-sm font-medium text-card-foreground'>{t('dues.operationWithdrawal')}</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className='flex items-baseline gap-1 mb-2'>
            <Skeleton className='h-9 w-32' />
            <span className='text-lg text-card-foreground opacity-60'>{t('dues.currencyUnit')}</span>
          </div>
          <Skeleton className='h-3 w-20' />
        </CardContent>
        <div className='absolute bottom-0 right-0 w-16 h-16 opacity-10'>
          <BanknoteArrowDown className='w-full h-full p-3' />
        </div>
      </Card>

      <Card className='relative overflow-hidden'>
        <CardHeader className='pb-2'>
          <div className='flex items-center gap-2'>
            <Users className='w-5 h-5 text-purple-600' />
            <h3 className='text-sm font-medium text-card-foreground'>{t('dues.monthBirthFee', { month: currentMonth })}</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className='flex items-baseline gap-1 mb-2'>
            <Skeleton className='h-9 w-32' />
            <span className='text-lg text-card-foreground opacity-60'>{t('dues.currencyUnit')}</span>
          </div>
          <Skeleton className='h-3 w-16' />
        </CardContent>
        <div className='absolute bottom-0 right-0 w-16 h-16 opacity-10'>
          <Users className='w-full h-full p-3' />
        </div>
      </Card>
    </div>
  );
};

export { TotalDuesSkeleton };