import { Skeleton } from '@/shared/ui/shadcn/skeleton';
import { VacationPolicyListsSkeleton } from './VacationPolicyListsSkeleton';

const PolicyContentSkeleton = () => {
  return (
    <div className='p-4 min-[40rem]:p-6 min-[48rem]:p-8'>
      <div className="flex flex-col gap-7">
        {/* 헤더 영역 */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>

        {/* 검색 및 리스트 영역 */}
        <div className="flex flex-col gap-4">
          {/* 검색 영역 */}
          <div className="flex flex-col min-[40rem]:flex-row items-start min-[40rem]:items-center justify-between gap-4">
            <div className="flex flex-col min-[40rem]:flex-row items-start min-[40rem]:items-center gap-4 w-full min-[40rem]:w-auto">
              <Skeleton className="h-10 w-full min-[40rem]:w-80" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-10 w-full min-[40rem]:w-32" />
          </div>

          {/* 정책 리스트 */}
          <VacationPolicyListsSkeleton />
        </div>
      </div>
    </div>
  );
};

export { PolicyContentSkeleton };
