import { Skeleton } from '@/shared/ds/skeleton';

// 글 자리는 올 글의 줄 높이(text — 글자 크기를 따라 커진다), 아이콘 · 검색 칸은 모양 자리라 px(skeleton.md "크기 — 글은 글줄 높이")
const UserListSkeleton = () => {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-x3 px-x4 pb-x2 pt-x3">
        <div className="flex items-center gap-x2">
          <Skeleton className="size-[16px]" />
          <Skeleton text="t5" className="w-[64px]" />
        </div>
        <Skeleton className="h-[40px] w-full" />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="flex flex-col gap-x1 p-x2">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-x1 p-x3">
              <Skeleton text="t5" className="block w-[96px]" />
              <Skeleton text="t3" className="block w-[144px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { UserListSkeleton };
