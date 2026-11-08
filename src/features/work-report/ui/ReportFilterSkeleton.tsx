import { Card, CardContent } from '@/shared/ui/shadcn/card';
import { Skeleton } from '@/shared/ui/shadcn/skeleton';

const ReportFilterSkeleton = () => {
  return (
    <Card className='mb-6'>
      <CardContent className='pt-6'>
        <div className='space-y-4'>
          {/* 필터 헤더 */}
          <div className='flex items-center justify-between pb-2 border-b'>
            <div className='flex items-center gap-2'>
              <Skeleton className='h-5 w-24' />
            </div>
            <Skeleton className='h-8 w-16' />
          </div>

          {/* 필터 입력 필드들 */}
          <div className='grid grid-cols-1 min-[48rem]:grid-cols-2 min-[64rem]:grid-cols-4 gap-4'>
            {/* 시작 날짜 */}
            <div className='space-y-2'>
              <Skeleton className='h-4 w-16' />
              <Skeleton className='h-10 w-full' />
            </div>

            {/* 종료 날짜 */}
            <div className='space-y-2'>
              <Skeleton className='h-4 w-16' />
              <Skeleton className='h-10 w-full' />
            </div>

            {/* 이름 */}
            <div className='space-y-2'>
              <Skeleton className='h-4 w-10' />
              <Skeleton className='h-10 w-full' />
            </div>

            {/* 정렬 */}
            <div className='space-y-2'>
              <Skeleton className='h-4 w-10' />
              <Skeleton className='h-10 w-full' />
            </div>
          </div>

          {/* 조회 버튼 */}
          <div className='flex justify-end pt-2'>
            <Skeleton className='h-10 w-32' />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { ReportFilterSkeleton }
