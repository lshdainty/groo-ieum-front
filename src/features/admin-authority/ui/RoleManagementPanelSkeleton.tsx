import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/shared/ui/shadcn/resizable";
import { Skeleton } from "@/shared/ui/shadcn/skeleton";
import { useIsMobile } from '@/shared/hooks/useIsMobile'

const RoleListSkeletonContent = () => (
  <div className="flex flex-col h-full border-r">
    <div className="p-4 border-b flex items-center justify-between bg-muted/30">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-8 w-8" />
    </div>
    <div className="flex-1 overflow-hidden">
      <div className="p-2 space-y-1">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-md"
          >
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const RoleDetailSkeletonContent = () => (
  <div className="flex flex-col h-full">
    <div className="p-6 border-b bg-background">
      <div className="flex justify-between items-start mb-6">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 max-w-[42rem]">
        <div className="grid gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
      <Skeleton className="h-6 w-20 mb-4" />
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, groupIndex) => (
          <div key={groupIndex} className="border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-24" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="grid grid-cols-1 min-[48rem]:grid-cols-2 min-[64rem]:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, itemIndex) => (
                <div key={itemIndex} className="flex items-start space-x-3 p-4 rounded-lg border">
                  <Skeleton className="h-4 w-4 mt-1" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const RoleManagementPanelSkeleton = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="h-full bg-background">
        <RoleListSkeletonContent />
      </div>
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border bg-background">
      <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
        <RoleListSkeletonContent />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75}>
        <RoleDetailSkeletonContent />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export { RoleManagementPanelSkeleton };
