import { Skeleton } from "@/shared/ds/skeleton";

const UserRoleAssignmentSkeleton = () => {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-stroke-neutral-subtle bg-bg-layer-default p-x6">
        <div className="mb-x1">
          <Skeleton className="mb-x2 block h-[32px] w-[128px]" />
          <Skeleton className="mb-x4 block h-[16px] w-[192px]" />
        </div>
        <div className="flex gap-x4">
          <Skeleton className="h-[16px] w-[128px]" />
          <Skeleton className="h-[16px] w-[112px]" />
        </div>
      </div>

      <div className="p-x6">
        <Skeleton className="mb-x2 block h-[20px] w-[48px]" />
        <Skeleton className="mb-x3 block h-[16px] w-[256px]" />
        <div className="flex flex-col gap-x3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-x1_5 rounded-r4 border border-stroke-neutral-subtle py-x4 pl-x5 pr-x4">
              <div className="flex flex-1 flex-col gap-x1_5">
                <Skeleton className="block h-[16px] w-[96px]" />
                <Skeleton className="block h-[12px] w-3/4" />
              </div>
              <Skeleton className="size-[20px] shrink-0" />
            </div>
          ))}
        </div>
        <div className="mt-x3 flex justify-end">
          <Skeleton className="h-[40px] w-[64px]" />
        </div>
      </div>
    </div>
  );
};

export { UserRoleAssignmentSkeleton };
