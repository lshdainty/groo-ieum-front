import { Skeleton } from '@/shared/ui/shadcn/skeleton'
import { useTranslation } from 'react-i18next'

const WEEK_DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEK_DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

export const CalendarWeekViewSkeleton = () => {
  const { i18n } = useTranslation()
  const weekDays = i18n.language === 'ko' ? WEEK_DAYS_KO : WEEK_DAYS_EN

  // 기본 시간대 (8시~18시)
  const hours = Array.from({ length: 11 }, (_, i) => i + 8)

  return (
    <div className='w-full h-full'>
      {/* Mobile message */}
      <div className='flex flex-col items-center justify-center border-b py-4 text-sm text-muted-foreground min-[40rem]:hidden'>
        <Skeleton className='h-4 w-48' />
        <Skeleton className='h-4 w-32 mt-1' />
      </div>

      <div className='hidden h-full flex-col min-[40rem]:flex'>
        {/* Multi-day events row skeleton */}
        <div className='border-b'>
          <div className='flex'>
            <div className='w-18'></div>
            <div className='grid flex-1 grid-cols-7 divide-x border-l'>
              {weekDays.map((_, index) => (
                <div key={index} className='p-1'>
                  {index % 3 === 0 && <Skeleton className='h-5 w-full rounded' />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Week header skeleton */}
        <div className='relative z-20 flex border-b'>
          <div className='w-18'></div>
          <div className='grid flex-1 grid-cols-7 divide-x border-l'>
            {weekDays.map((day, index) => {
              const isSunday = index === 0
              const isSaturday = index === 6

              return (
                <div key={index} className='py-2 text-center text-xs font-medium'>
                  <span style={{ color: isSunday ? '#ff6767' : isSaturday ? '#6767ff' : undefined }}>
                    {day}
                  </span>
                  <Skeleton className='h-4 w-4 mx-auto mt-1 rounded' />
                </div>
              )
            })}
          </div>
        </div>

        {/* Time grid skeleton */}
        <div className='flex-1 overflow-hidden'>
          <div className='flex h-full'>
            {/* Hours column */}
            <div className='relative w-18'>
              {hours.map((hour, index) => (
                <div key={hour} className='relative' style={{ height: '96px' }}>
                  <div className='absolute -top-3 right-2 flex h-6 items-center'>
                    {index !== 0 && <Skeleton className='h-3 w-10' />}
                  </div>
                </div>
              ))}
            </div>

            {/* Week grid */}
            <div className='relative flex-1 border-l'>
              <div className='grid grid-cols-7 divide-x'>
                {weekDays.map((_, dayIndex) => (
                  <div key={dayIndex} className='relative'>
                    {hours.map((hour, index) => (
                      <div key={hour} className='relative' style={{ height: '96px' }}>
                        {index !== 0 && <div className='pointer-events-none absolute inset-x-0 top-0 border-b'></div>}
                        <div className='pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed'></div>
                      </div>
                    ))}

                    {/* Event skeleton placeholders - vary by day */}
                    {dayIndex % 2 === 0 && (
                      <div className='absolute top-[192px] left-1 right-1 h-[96px] p-0.5'>
                        <Skeleton className='h-full w-full rounded' />
                      </div>
                    )}
                    {dayIndex % 3 === 1 && (
                      <div className='absolute top-[384px] left-1 right-1 h-[144px] p-0.5'>
                        <Skeleton className='h-full w-full rounded' />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
