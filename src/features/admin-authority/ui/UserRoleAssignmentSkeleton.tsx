import { Skeleton } from "@/shared/ds/skeleton";

// 글 자리는 올 글의 줄 높이(이름 t8 · 메일 · 부서 t4 · 칸 라벨 t5 · 설명 t4 · 역할 이름 t5 · 설명 t3 — 글자 크기를 따라 커진다),
// 체크 칸 · 저장 단추는 모양 자리라 px(skeleton.md "크기 — 글은 글줄 높이")
const UserRoleAssignmentSkeleton = () => {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-stroke-neutral-subtle bg-bg-layer-default p-x6">
        <div className="mb-x1">
          <Skeleton text="t8" className="mb-x2 block w-[128px]" />
          <Skeleton text="t4" className="mb-x4 block w-[192px]" />
        </div>
        <div className="flex gap-x4">
          <Skeleton text="t4" className="w-[128px]" />
          <Skeleton text="t4" className="w-[112px]" />
        </div>
      </div>

      <div className="p-x6">
        <Skeleton text="t5" className="mb-x2 block w-[48px]" />
        <Skeleton text="t4" className="mb-x3 block w-[256px]" />
        <div className="flex flex-col gap-x3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-x1_5 rounded-r4 border border-stroke-neutral-subtle py-x4 pl-x5 pr-x4">
              <div className="flex flex-1 flex-col gap-x1_5">
                <Skeleton text="t5" className="block w-[96px]" />
                <Skeleton text="t3" className="block w-3/4" />
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
