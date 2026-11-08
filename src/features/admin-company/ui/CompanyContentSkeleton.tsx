import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/shared/ui/shadcn/resizable';
import { Skeleton } from '@/shared/ui/shadcn/skeleton';
import { DepartmentChartPanelSkeleton } from '@/features/admin-company/ui/DepartmentChartPanelSkeleton';
import { DepartmentTreePanelSkeleton } from '@/features/admin-company/ui/DepartmentTreePanelSkeleton';
import { useIsMobile } from '@/shared/hooks/useIsMobile'

const CompanyContentSkeleton = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className='p-4 min-[40rem]:p-6 md:p-8 flex flex-col gap-6 h-full'>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-8 w-8' />
          <Skeleton className='h-8 w-48' />
        </div>
        <div className='flex-1 border rounded-lg overflow-hidden'>
          <DepartmentTreePanelSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className='p-4 min-[40rem]:p-6 md:p-8 flex flex-col gap-6 h-full'>
      <div className='flex items-center gap-2'>
        <Skeleton className='h-8 w-8' />
        <Skeleton className='h-8 w-48' />
      </div>
      <ResizablePanelGroup direction='horizontal' className='grow rounded-lg border'>
        <ResizablePanel defaultSize={25} minSize={25}>
          <DepartmentTreePanelSkeleton />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={75}>
          <DepartmentChartPanelSkeleton />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export { CompanyContentSkeleton };
