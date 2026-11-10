import { Skeleton } from '@/shared/ds/skeleton';

const UserListSkeleton = () => {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-x3 px-x4 pb-x2 pt-x3">
        <div className="flex items-center gap-x2">
          <Skeleton className="size-4" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="flex flex-col gap-x1 p-x2">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-x1 p-x3">
              <Skeleton className="block h-4 w-24" />
              <Skeleton className="block h-3 w-36" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { UserListSkeleton };
