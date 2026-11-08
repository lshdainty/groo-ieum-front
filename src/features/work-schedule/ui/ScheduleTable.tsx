import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/shadcn/avatar";
import { Badge } from "@/shared/ui/shadcn/badge";
import { ScheduleEmpty } from "@/features/work-schedule/ui/ScheduleEmpty";
import { GetUsersResp } from '@/entities/user';
import { cn } from "@/shared/lib";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";

// --- Types ---

interface ScheduleItem {
  id: string;
  startTime: string; // "HH:MM" format (24h)
  endTime: string;   // "HH:MM" format (24h)
}

interface ScheduleTableProps {
  users: GetUsersResp[];
}

// --- Helper Functions ---

const START_HOUR = 7;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;

/**
 * Converts "HH:MM" time string to a percentage position on the timeline (0% - 100%)
 */
const getPositionPercentage = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const totalMinutesFromStart = (hours - START_HOUR) * 60 + minutes;
  const totalTimelineMinutes = TOTAL_HOURS * 60;
  return (totalMinutesFromStart / totalTimelineMinutes) * 100;
};

/**
 * Parses work_time string like "9~6" to start and end time in "HH:MM" format
 */
/**
 * Work time color mapping based on start hour
 */
const workTimeColors: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  '8 ~ 17': {
    bg: 'bg-rose-500/10',
    text: 'text-rose-500 dark:text-rose-400',
    border: 'border-rose-500/20',
    badge: 'bg-rose-500/10 text-rose-500 dark:text-rose-400 hover:bg-rose-500/20 border-rose-500/20'
  },
  '9 ~ 18': {
    bg: 'bg-sky-500/10',
    text: 'text-sky-500 dark:text-sky-400',
    border: 'border-sky-500/20',
    badge: 'bg-sky-500/10 text-sky-500 dark:text-sky-400 hover:bg-sky-500/20 border-sky-500/20'
  },
  '10 ~ 19': {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    badge: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20'
  },
  '13 ~ 21': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-500 dark:text-amber-400',
    border: 'border-amber-500/20',
    badge: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/20'
  }
};

const getWorkTimeColor = (workTime: string) => {
  return workTimeColors[workTime] || {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
    badge: 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20'
  };
};

const parseWorkTime = (workTime: string): { startTime: string; endTime: string } | null => {
  if (!workTime || workTime === '-') return null;

  const match = workTime.match(/(\d+) ~ (\d+)/);
  if (!match) return null;

  const startHour = parseInt(match[1], 10);
  const endHour = parseInt(match[2], 10);

  return {
    startTime: `${startHour.toString().padStart(2, '0')}:00`,
    endTime: `${endHour.toString().padStart(2, '0')}:00`
  };
};

const formatTimeRange = (start: string, end: string, t: TFunction<'work', undefined>) => {
  const format = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const ampm = h < 12 ? t('schedule.am') : t('schedule.pm');
    const formattedH = h > 12 ? h - 12 : h;
    return `${ampm} ${formattedH}:${m.toString().padStart(2, '0')}`;
  }
  return `${format(start)} - ${format(end)}`;
};

/**
 * Break times configuration (in hours)
 * 점심: 12~13시, 저녁: 18~19시
 */
const BREAK_TIMES = [
  { start: 12, end: 13 }, // 점심
  { start: 18, end: 19 }, // 저녁
];

/**
 * Calculate total work hours from start and end time
 * 근무시간과 겹치는 첫 번째 휴식시간만 제외
 */
const calculateWorkHours = (startTime: string, endTime: string, t: TFunction<'work', undefined>): string => {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);

  const workStart = startH * 60 + startM;
  const workEnd = endH * 60 + endM;

  // 근무시간과 겹치는 첫 번째 휴식시간만 제외
  for (const breakTime of BREAK_TIMES) {
    const breakStart = breakTime.start * 60;
    const breakEnd = breakTime.end * 60;

    if (workStart < breakEnd && workEnd > breakStart) {
      const overlapStart = Math.max(workStart, breakStart);
      const overlapEnd = Math.min(workEnd, breakEnd);
      totalMinutes -= (overlapEnd - overlapStart);
      break; // 첫 번째 겹치는 휴식시간만 제외
    }
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? t('schedule.hoursMinutes', { hours, minutes }) : t('schedule.hoursOnly', { hours });
};

// --- Components ---

const TimeGridHeader = () => {
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

  return (
    <div className="relative flex h-10 border-b border-border items-center text-xs text-muted-foreground select-none">
      {hours.map((hour, index) => (
        <div key={hour} style={{ width: `${100 / TOTAL_HOURS}%` }} className="relative h-full flex items-center">
          <span className={cn("absolute", index === 0 ? "left-0" : "-translate-x-1/2")}>{hour}</span>
        </div>
      ))}
      {/* 마지막 시간 (20) */}
      <span className="absolute right-0">{END_HOUR}</span>
    </div>
  );
};

const BackgroundGrid = () => {
  // 점심시간: 12~13시, 저녁시간: 18~19시
  const LUNCH_START = 12;
  const LUNCH_END = 13;
  const DINNER_START = 18;
  const DINNER_END = 19;

  return (
    <div className="absolute inset-0 flex pointer-events-none">
      {Array.from({ length: TOTAL_HOURS }).map((_, i) => {
        const hour = START_HOUR + i;
        const isBreakTime = (hour >= LUNCH_START && hour < LUNCH_END) || (hour >= DINNER_START && hour < DINNER_END);

        return (
          <div
            key={i}
            className="h-full border-r border-border/50 relative"
            style={{ width: `${100 / TOTAL_HOURS}%` }}
          >
            {isBreakTime && (
              <div
                className="absolute inset-0 opacity-10 dark:opacity-20"
                style={{
                  background: `repeating-linear-gradient(
                                        45deg,
                                        currentColor,
                                        currentColor 2px,
                                        transparent 2px,
                                        transparent 8px
                                    )`
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  )
}

const ScheduleBar = ({ item, workTimeStr, t }: { item: ScheduleItem; workTimeStr: string; t: TFunction<'work', undefined> }) => {
  const left = getPositionPercentage(item.startTime);
  const width = getPositionPercentage(item.endTime) - left;
  const colors = getWorkTimeColor(workTimeStr);

  return (
    <div
      className={cn(
        "absolute top-1/2 -translate-y-1/2 h-12 rounded-lg border flex overflow-hidden text-xs shadow-sm group transition-all hover:z-10 hover:shadow-md cursor-pointer",
        colors.bg,
        colors.text,
        colors.border
      )}
      style={{ left: `${left}%`, width: `${width}%` }}
    >
      {/* Content Area */}
      <div className="flex flex-col justify-center px-3 z-10 font-medium whitespace-nowrap">
        <div className="opacity-80 text-[10px]">
          {formatTimeRange(item.startTime, item.endTime, t)}
        </div>
      </div>
    </div>
  );
};

const ScheduleTable = ({ users }: ScheduleTableProps) => {
  const { t } = useTranslation('work');

  if (!users || users.length === 0) {
    return <ScheduleEmpty />
  }

  return (
    <div className="bg-background overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row */}
          <div className="flex border-b border-border bg-background sticky top-0 z-30">
            <div className="w-[120px] min-[40rem]:w-64 shrink-0 p-4 border-r border-border bg-background sticky left-0 z-40" /> {/* User Info Header Placeholder */}
            <div className="flex-1 relative min-w-[600px]">
              <TimeGridHeader />
            </div>
          </div>

          {/* User Rows */}
          <div className="divide-y divide-border">
            {users.map((user) => {
              const workTime = parseWorkTime(user.user_work_time);
              const totalWorkTime = workTime
                ? calculateWorkHours(workTime.startTime, workTime.endTime, t)
                : '-';
              const colors = getWorkTimeColor(user.user_work_time);

              return (
                <div key={user.user_id} className="flex group hover:bg-muted/50 transition-colors h-24">
                  {/* Left: User Info - Sticky */}
                  <div className="w-[120px] min-[40rem]:w-64 shrink-0 p-2 min-[40rem]:p-4 flex flex-col min-[40rem]:flex-row items-center min-[40rem]:items-center gap-2 min-[40rem]:gap-3 border-r border-border bg-background sticky left-0 z-20">
                    <Avatar className="h-8 w-8 min-[40rem]:h-10 min-[40rem]:w-10 border border-border">
                      <AvatarImage src={user.profile_url} />
                      <AvatarFallback>{user.user_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-center min-[40rem]:items-start text-center min-[40rem]:text-left overflow-hidden w-full">
                      <span className="font-bold text-foreground text-xs min-[40rem]:text-sm truncate w-full">{user.user_name}</span>
                      <span className="text-[10px] min-[40rem]:text-xs text-muted-foreground truncate w-full hidden min-[40rem]:block">{user.main_department_name_kr || user.user_role_name}</span>
                      <Badge variant="secondary" className={cn("mt-1 w-fit text-[10px] px-1.5 py-0 h-5 font-normal", colors.badge)}>
                        {totalWorkTime}
                      </Badge>
                    </div>
                  </div>

                  {/* Right: Timeline Track */}
                  <div className="flex-1 relative min-w-[600px]">
                    {/* Vertical Grid Lines */}
                    <BackgroundGrid />

                    {/* Schedule Bars */}
                    <div className="absolute inset-0 w-full h-full">
                      {workTime && (
                        <ScheduleBar
                          item={{
                            id: user.user_id,
                            startTime: workTime.startTime,
                            endTime: workTime.endTime
                          }}
                          workTimeStr={user.user_work_time}
                          t={t}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export { ScheduleTable }
