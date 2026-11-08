import { ReportFilterSkeleton } from '@/features/work-report/ui/ReportFilterSkeleton';
import { ReportHeaderSkeleton } from '@/features/work-report/ui/ReportHeaderSkeleton';
import { ReportTableSkeleton } from '@/features/work-report/ui/ReportTableSkeleton';

const ReportSkeleton = () => {
  return (
    <div className='p-4 min-[40rem]:p-6 min-[48rem]:p-8'>
      <ReportHeaderSkeleton />
      <ReportFilterSkeleton />
      <div className='mt-6'>
        <ReportTableSkeleton />
      </div>
    </div>
  );
};

export { ReportSkeleton }
