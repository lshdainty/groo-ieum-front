import { Card, CardContent } from '@/shared/ui/shadcn/card';
import { Skeleton } from '@/shared/ui/shadcn/skeleton';

const PlanContentSkeleton = () => {
  return (
    <div className='p-4 min-[40rem]:p-6 min-[48rem]:p-8'>
      <div className="flex flex-col gap-7">
        {/* Header skeleton */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* Search and list area */}
        <div className="flex flex-col gap-4">
          {/* Search area skeleton */}
          <div className="flex flex-col min-[40rem]:flex-row items-start min-[40rem]:items-center justify-between gap-4">
            <div className="flex flex-col min-[40rem]:flex-row items-start min-[40rem]:items-center gap-4 w-full min-[40rem]:w-auto">
              <Skeleton className="h-10 w-full min-[40rem]:w-80" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-10 w-full min-[40rem]:w-32" />
          </div>

          {/* Plan list skeleton */}
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-4 min-[40rem]:px-6">
                  <div className="flex flex-col min-[40rem]:flex-row min-[40rem]:items-start min-[40rem]:justify-between gap-4">
                    <div className="flex flex-col gap-3 flex-1">
                      <div className="flex flex-col min-[40rem]:flex-row min-[40rem]:items-center gap-2 min-[40rem]:gap-3">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-5 w-24" />
                      </div>
                      <Skeleton className="h-4 w-64" />
                      <Skeleton className="h-4 w-32" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export { PlanContentSkeleton };
