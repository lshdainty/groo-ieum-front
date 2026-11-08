import QueryAsyncBoundary from "@/shared/ui/async-boundary/QueryAsyncBoundary";
import { ScheduleHeader } from "@/features/work-schedule/ui/ScheduleHeader";
import { ScheduleSkeleton } from "@/features/work-schedule/ui/ScheduleSkeleton";
import { ScheduleTable } from "@/features/work-schedule/ui/ScheduleTable";
import { useUsersQuery } from '@/entities/user';

const ScheduleContent = () => {
  const { data: users, isLoading, error } = useUsersQuery();

  return (
    <div className='p-4 min-[40rem]:p-6 min-[48rem]:p-8'>
      <ScheduleHeader />
      <QueryAsyncBoundary
        queryState={{ isLoading, error, data: users }}
        loadingComponent={<ScheduleSkeleton />}
        errorComponent={
          <div className='p-4 min-[40rem]:p-6 min-[48rem]:p-8'>
            <div className='p-8 text-center text-red-600'>
              데이터를 불러오는데 실패했습니다.
            </div>
          </div>
        }
      >
        <ScheduleTable users={users || []} />
      </QueryAsyncBoundary>
    </div>
  );
};

export { ScheduleContent }
