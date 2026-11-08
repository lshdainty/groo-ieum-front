import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/shared/ui/shadcn/resizable'
import { Skeleton } from '@/shared/ui/shadcn/skeleton'
import { DepartmentTreePanelSkeleton } from '@/features/admin-company/ui/DepartmentTreePanelSkeleton'
import { UserDepartmentTransferSkeleton } from '@/features/admin-users-department/ui/UserDepartmentTransferSkeleton'
import { useIsMobile } from '@/shared/hooks/useIsMobile'

const DepartmentContentSkeleton = () => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <div className='h-full w-full flex flex-col p-4 gap-4 overflow-hidden'>
        <div className='flex items-center gap-2 shrink-0'>
          <Skeleton className='h-6 w-6' />
          <Skeleton className='h-8 w-48' />
        </div>
        <div className='flex-1 border rounded-lg overflow-hidden'>
          <DepartmentTreePanelSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className='h-full w-full'>
      <div className='h-full flex flex-col p-4 min-[40rem]:p-6 min-[48rem]:p-8 gap-6 overflow-hidden'>
        <div className='flex items-center gap-2 shrink-0'>
          <Skeleton className='h-6 w-6' />
          <Skeleton className='h-9 w-48' />
        </div>
        <ResizablePanelGroup direction='horizontal' className='flex-1 min-h-0 rounded-lg border'>
          <ResizablePanel defaultSize={25} minSize={25} style={{ overflow: 'hidden' }}>
            <DepartmentTreePanelSkeleton />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={75} style={{ overflow: 'hidden' }}>
            <div className='p-4 h-full'>
              <UserDepartmentTransferSkeleton />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}

export { DepartmentContentSkeleton }
