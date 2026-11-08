import { Skeleton } from '@/shared/ui/shadcn/skeleton';

const ScheduleTableSkeleton = () => {
  return (
    <div className="bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row */}
          <div className="flex border-b bg-white sticky top-0 z-30">
            <div className="w-[120px] min-[40rem]:w-64 shrink-0 p-4 border-r bg-white sticky left-0 z-40" />
            <div className="flex-1 relative h-10 border-b flex items-center">
              {/* Time grid header skeleton */}
              <div className="w-full h-full flex items-center justify-between px-2">
                {Array(15).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-3 w-4" />
                ))}
              </div>
            </div>
          </div>

          {/* User Rows */}
          <div className="divide-y">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex h-24">
                {/* Left: User Info */}
                <div className="w-[120px] min-[40rem]:w-64 shrink-0 p-2 min-[40rem]:p-4 flex flex-col min-[40rem]:flex-row items-center gap-2 min-[40rem]:gap-3 border-r bg-white sticky left-0 z-20">
                  <Skeleton className="h-8 w-8 min-[40rem]:h-10 min-[40rem]:w-10 rounded-full" />
                  <div className="flex flex-col gap-2 items-center min-[40rem]:items-start w-full">
                    <Skeleton className="h-4 w-16 min-[40rem]:w-20" />
                    <Skeleton className="h-3 w-12 min-[40rem]:w-16 hidden min-[40rem]:block" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                </div>

                {/* Right: Timeline Track */}
                <div className="flex-1 relative min-w-[600px] p-4">
                  <Skeleton className="h-full w-full opacity-20" />
                  <div className="absolute top-1/2 -translate-y-1/2 left-10 right-10 h-12">
                     <Skeleton className="h-full w-1/3 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export { ScheduleTableSkeleton }
