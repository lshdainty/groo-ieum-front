import { useTranslation } from 'react-i18next'

import { config } from '@/shared/config'
import { Avatar } from '@/shared/ds/avatar'
import { cn } from '@/shared/lib/cn'
import type { GetUsersResp } from '@/entities/user'
import { END_HOUR, START_HOUR, TOTAL_HOURS, barText, parseWorkSpan, positionPercent, BREAK_TIMES } from '../lib/schedule-format'

const WORD = '[overflow-wrap:break-word] [word-break:keep-all]'
const photoOf = (u: GetUsersResp): string | undefined => (u.profile_url ? `${config.baseUrl}${u.profile_url}` : undefined)

/** 쉬는 시간 빗금 — 1px stroke-neutral-subtle 135°(그림 `.tlbk`) */
const HATCH = 'repeating-linear-gradient(135deg, var(--color-stroke-neutral-subtle) 0, var(--color-stroke-neutral-subtle) 1px, transparent 1px, transparent 6px)'

const TimeAxis = () => (
  <div aria-hidden className='relative h-[32px] border-b border-stroke-neutral-subtle text-t2 text-fg-neutral-subtle'>
    {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i).map((hour) => (
      <span
        key={hour}
        className='absolute top-1/2 -translate-y-1/2 tabular-nums'
        style={{ left: `${positionPercent(hour)}%`, transform: `translate(${hour === START_HOUR ? '0' : hour === END_HOUR ? '-100%' : '-50%'}, -50%)` }}
      >
        {hour}
      </span>
    ))}
  </div>
)

const Breaks = () => (
  <div aria-hidden className='pointer-events-none absolute inset-0'>
    {BREAK_TIMES.map((b) => (
      <div key={b.start} className='absolute inset-y-0' style={{ left: `${positionPercent(b.start)}%`, width: `${positionPercent(b.end) - positionPercent(b.start)}%`, background: HATCH }} />
    ))}
  </div>
)

/**
 * 근무 일정 시간표(768 이상 — I-25 J 55) — 사람 줄(Avatar 36 · 이름 · 부서 줄바꿈) + 시간축 7 ~ 22시.
 * 막대는 한 색(`bg-brand-weak` + 안쪽 1px `stroke-neutral-weak`) · 높이 32 · 모서리 8 · 글 "{시작}~{끝} · {근무 시간}"(12시간 · 구간 기호 붙여 씀).
 * 시작 시각마다 색을 달리하던 것은 걷었다(뜻 없는 분류는 색이 아니라 글). 쉬는 시간(12 ~ 13 · 18 ~ 19)은 빗금.
 * 줄 높이 64 · 이름이 길면 줄이 높아진다. 폭이 모자라면 시간표 전체가 카드 안에서 가로로 스크롤하고 이름 칸은 붙어 있다.
 */
export function ScheduleTable({ users }: { users: GetUsersResp[] }) {
  const { t } = useTranslation('work')
  return (
    <div role='table' aria-label={t('sch.boardAria')} className='min-w-[700px] min-[80rem]:min-w-[740px]'>
      <div role='row' className='flex'>
        <div role='columnheader' className='sticky left-0 z-10 w-[180px] shrink-0 border-b border-stroke-neutral-subtle bg-bg-layer-default min-[80rem]:w-[220px]'>
          <span className='sr-only'>{t('sch.listCaption')}</span>
        </div>
        <div role='columnheader' className='min-w-0 flex-1 px-x4'>
          <TimeAxis />
        </div>
      </div>
      {users.map((user) => {
        const span = parseWorkSpan(user.user_work_time)
        return (
          <div role='row' key={user.user_id} data-schedule-row={user.user_id} className='flex min-h-[64px] border-b border-stroke-neutral-subtle last:border-b-0'>
            <div role='rowheader' className='sticky left-0 z-10 flex w-[180px] shrink-0 items-center gap-x3 bg-bg-layer-default py-x3 pl-x6 pr-x3 min-[80rem]:w-[220px]'>
              <Avatar name={user.user_name} src={photoOf(user)} size={36} />
              <div className='min-w-0'>
                <div className={cn('text-t4 font-bold text-fg-neutral', WORD)}>{user.user_name}</div>
                {user.main_department_name_kr && <div className={cn('text-t3 text-fg-neutral-subtle', WORD)}>{user.main_department_name_kr}</div>}
              </div>
            </div>
            <div role='cell' className='relative min-w-0 flex-1 px-x4'>
              <div className='relative h-full'>
                <Breaks />
                {span && (
                  <div
                    data-schedule-bar
                    className='absolute top-1/2 flex h-[32px] -translate-y-1/2 items-center overflow-hidden rounded-[8px] bg-bg-brand-weak px-x3 text-t3 text-fg-neutral shadow-[inset_0_0_0_1px_var(--color-stroke-neutral-weak)]'
                    style={{ left: `${positionPercent(span.startHour)}%`, width: `${positionPercent(span.endHour) - positionPercent(span.startHour)}%` }}
                  >
                    <span className='whitespace-nowrap'>{barText(user.user_work_time, span, t)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
