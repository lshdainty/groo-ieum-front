import { Skeleton } from '@/shared/ds/skeleton';

const UserListSkeleton = () => {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-x3 px-x4 pb-x2 pt-x3">
        <div className="flex items-center gap-x2">
          <Skeleton className="size-[16px]" />
          <Skeleton className="h-[20px] w-[64px]" />
        </div>
        <Skeleton className="h-[40px] w-full" />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="flex flex-col gap-x1 p-x2">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-x1 p-x3">
              <Skeleton className="block h-[16px] w-[96px]" />
              <Skeleton className="block h-[12px] w-[144px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { UserListSkeleton };
