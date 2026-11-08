import { Skeleton } from '@/shared/ui/shadcn/skeleton'

const UserDepartmentTransferSkeleton = () => {
  return (
    <div className='w-full h-full flex flex-col gap-4'>
      {/* 상단 저장 버튼 영역 */}
      <div className='flex justify-end gap-2'>
        <Skeleton className='h-9 w-16' />
      </div>

      {/* TransferList 영역 */}
      <div className='flex flex-col min-[48rem]:flex-row min-[48rem]:space-x-4 gap-4 min-[48rem]:gap-0 flex-1'>
        {/* 왼쪽 패널 - 전체 사용자 */}
        <div className='w-full min-[48rem]:w-1/2 bg-background rounded-sm flex flex-col h-[300px] min-[48rem]:h-auto'>
          <div className='flex items-center justify-between shrink-0'>
            <Skeleton className='h-9 w-full' />
          </div>
          <div className='flex items-center justify-between p-2 shrink-0'>
            <Skeleton className='h-5 w-24' />
            <Skeleton className='h-4 w-12' />
          </div>
          <div className='flex-1 overflow-auto border rounded-sm'>
            {[...Array(6)].map((_, i) => (
              <div key={i} className='flex items-center gap-2 p-3 border-b'>
                <Skeleton className='h-4 w-4' />
                <div className='flex flex-col gap-1 flex-1'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-3 w-32' />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 중앙 버튼 영역 */}
        <div className='hidden min-[48rem]:flex flex-col justify-center gap-2'>
          <Skeleton className='h-8 w-8' />
          <Skeleton className='h-8 w-8' />
        </div>

        {/* 오른쪽 패널 - 부서 사용자 */}
        <div className='w-full min-[48rem]:w-1/2 bg-background rounded-sm flex flex-col h-[300px] min-[48rem]:h-auto'>
          <div className='flex items-center justify-between shrink-0'>
            <Skeleton className='h-9 w-full' />
          </div>
          <div className='flex items-center justify-between p-2 shrink-0'>
            <Skeleton className='h-5 w-24' />
            <Skeleton className='h-4 w-12' />
          </div>
          <div className='flex-1 overflow-auto border rounded-sm'>
            {[...Array(4)].map((_, i) => (
              <div key={i} className='flex items-center gap-2 p-3 border-b'>
                <Skeleton className='h-4 w-4' />
                <div className='flex flex-col gap-1 flex-1'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-3 w-32' />
                </div>
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-4 w-4' />
                  <Skeleton className='h-3 w-12' />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export { UserDepartmentTransferSkeleton }
