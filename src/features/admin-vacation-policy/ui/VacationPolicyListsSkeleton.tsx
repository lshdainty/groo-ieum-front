import { Card, CardContent } from '@/shared/ui/shadcn/card';
import { Skeleton } from '@/shared/ui/shadcn/skeleton';

const VacationPolicyListsSkeleton = () => {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="transition-all">
          <CardContent className="p-4 min-[40rem]:px-6">
            <div className="flex flex-col min-[40rem]:flex-row min-[40rem]:items-start min-[40rem]:justify-between gap-4">
              <div className="flex flex-col gap-3 flex-1">
                <div className="flex flex-col min-[40rem]:flex-row min-[40rem]:items-center gap-2 min-[40rem]:gap-3">
                  <Skeleton className="h-6 w-48" />
                  <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-4 w-3/4" />
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-8 w-8 self-end min-[40rem]:self-auto" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export { VacationPolicyListsSkeleton };
