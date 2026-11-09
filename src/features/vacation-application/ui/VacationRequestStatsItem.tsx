import { Badge } from '@/shared/ui/shadcn/badge';
import { Progress } from '@/shared/ui/shadcn/progress';
import { type GetUserRequestedVacationStatsResp } from '@/entities/vacation';
import { VACATION_STATUS_CONFIG } from '@/shared/lib/vacationStatus'
import { Delta } from '@/shared/ds/card'
import { formatChangeRate, formatShare } from '@/shared/lib/groo/share'
import {
  CalendarDays,
  FileText,
} from 'lucide-react';
import { ReactNode } from 'react';
import { TFunction } from 'i18next';

export interface VacationRequestStatsItemProps {
  id?: string;
  icon: ReactNode;
  iconBg: string;
  headerRight?: ReactNode;
  title: string;
  value: string | number;
  description?: string;
  footer?: ReactNode;
}

const VacationRequestStatsItem = ({
  icon,
  iconBg,
  headerRight,
  title,
  value,
  description,
  footer
}: VacationRequestStatsItemProps) => {
  return (
    <div className='w-full h-full flex flex-col'>
      <div className='flex items-center justify-between mb-4'>
        <div className={`w-12 h-12 rounded-lg ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        {headerRight}
      </div>
      <div className='flex-1 flex flex-col'>
        <p className='text-sm text-foreground mb-1'>{title}</p>
        <p className='text-2xl font-bold text-foreground'>{value}</p>
        {description && (
          <p className='text-xs text-foreground/70 mt-1'>{description}</p>
        )}
        {footer && <div className='mt-auto pt-2'>{footer}</div>}
      </div>
    </div>
  );
};

export const getVacationRequestStatsConfig = (stats: GetUserRequestedVacationStatsResp | undefined, t: TFunction<'vacation', undefined>): VacationRequestStatsItemProps[] => {
  const totalRequests = stats?.total_request_count || 0;
  const pendingRequests = stats?.pending_count || 0;
  const inProgressRequests = stats?.progress_count || 0;
  const approvedRequests = stats?.approved_count || 0;
  const rejectedRequests = stats?.rejected_count || 0;
  const canceledRequests = stats?.canceled_count || 0;
  const approvalRate = stats?.approval_rate || 0;
  const thisMonthRequests = stats?.current_month_request_count || 0;
  const requestGrowth = stats?.change_rate || 0;
  const averageProcessingDays = stats?.average_processing_days || 0;

  return [
    {
      id: 'total',
      icon: <FileText className='w-6 h-6 text-blue-600' />,
      iconBg: 'bg-blue-100',
      // 증감은 ds Delta — 방향 색(▲ 빨강 · ▼ 파랑, 좋고 나쁨이 아니라 방향). 0 은 줄이 없다
      headerRight:
        requestGrowth === 0 ? undefined : (
          <Delta
            direction={requestGrowth > 0 ? 'up' : 'down'}
            value={formatChangeRate(requestGrowth, { sign: 'none' })}
            text={t('request.sinceLastMonth')}
            data-request-growth={requestGrowth > 0 ? 'up' : 'down'}
          />
        ),
      title: t('request.totalRequest'),
      value: totalRequests,
      description: t('request.thisMonth', { count: thisMonthRequests })
    },
    {
      id: 'canceled',
      icon: <VACATION_STATUS_CONFIG.CANCELED.icon className='w-6 h-6 text-foreground' />,
      iconBg: 'bg-muted',
      headerRight: (
        <Badge variant='secondary'>
          {t('request.canceledLabel')}
        </Badge>
      ),
      title: t('request.canceledLabel'),
      value: canceledRequests,
      description: t('request.canceledDesc')
    },
    {
      id: 'pending',
      icon: <VACATION_STATUS_CONFIG.PENDING.icon className='w-6 h-6 text-yellow-600' />,
      iconBg: 'bg-yellow-100',
      headerRight: (
        <Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
          {t('request.pendingLabel')}
        </Badge>
      ),
      title: t('request.pendingLabel'),
      value: pendingRequests,
      description: t('request.avgProcessingTime', { days: averageProcessingDays.toFixed(1) })
    },
    {
      id: 'progress',
      icon: <VACATION_STATUS_CONFIG.PROGRESS.icon className='w-6 h-6 text-blue-600' />,
      iconBg: 'bg-blue-100',
      headerRight: (
        <Badge variant='secondary' className='bg-blue-100 text-blue-800'>
          {t('request.progressLabel')}
        </Badge>
      ),
      title: t('request.progressLabel'),
      value: inProgressRequests,
      description: t('request.progressDesc')
    },
    {
      id: 'approved',
      icon: <VACATION_STATUS_CONFIG.APPROVED.icon className='w-6 h-6 text-green-600' />,
      iconBg: 'bg-green-100',
      headerRight: (
        <div className='text-right'>
          <p className='text-xs text-foreground/70'>{t('request.approvalRate')}</p>
          <p className='text-sm font-semibold text-foreground' data-approval-rate>{totalRequests > 0 ? formatShare(approvalRate) : '—'}</p>
        </div>
      ),
      title: t('request.approvedLabel'),
      value: approvedRequests,
      footer: <Progress value={approvalRate} className='h-2' />
    },
    {
      id: 'rejected',
      icon: <VACATION_STATUS_CONFIG.REJECTED.icon className='w-6 h-6 text-red-600' />,
      iconBg: 'bg-red-100',
      headerRight: (
        <Badge variant='secondary' className='bg-red-100 text-red-800'>
          {t('request.rejectedLabel')}
        </Badge>
      ),
      title: t('request.rejectedLabel'),
      value: rejectedRequests,
      description: t('request.rejectedDesc')
    },
    {
      id: 'acquired',
      icon: <CalendarDays className='w-6 h-6 text-purple-600' />,
      iconBg: 'bg-purple-100',
      title: t('request.acquiredVacation'),
      value: stats?.acquired_vacation_time_str || '0일',
      description: t('request.acquiredDesc')
    }
  ];
};

export { VacationRequestStatsItem }
