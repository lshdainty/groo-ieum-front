import { useTranslation } from 'react-i18next'

import { config } from '@/shared/config'
import { Avatar } from '@/shared/ds/avatar'
import { List, ListHeader, ListItem } from '@/shared/ds/list'
import { formatWorkTime } from '@/shared/lib/work-time'
import { cn } from '@/shared/lib/cn'
import type { GetUsersResp } from '@/entities/user'
import { groupByWorkTime } from '../lib/schedule-format'

const WORD = '[overflow-wrap:break-word] [word-break:keep-all]'
const photoOf = (u: GetUsersResp): string | undefined => (u.profile_url ? `${config.baseUrl}${u.profile_url}` : undefined)

/**
 * 근무 일정 폰 본문(768 미만 — I-25 J 56, HC14 A) — 시간대 묶음. 묶음 머리 "{시작}~{끝} · {n}명"(같은 `user_work_time`, 시작이 이른 차례),
 * 줄 = Avatar 42 + 이름 + 부서(누름 없음 · ⋮ 없음), 묶음 안은 이름 차례. 막대 · 시간축은 그리지 않는다.
 */
export function ScheduleByTime({ users }: { users: GetUsersResp[] }) {
  const { t } = useTranslation('work')
  return (
    <div>
      {groupByWorkTime(users).map((g) => (
        <section key={g.key || 'none'} data-time-group={g.key || 'none'}>
          <ListHeader as='h2'>
            {g.span ? t('sch.groupTitle', { range: formatWorkTime(g.key), count: g.users.length }) : t('sch.noTime', { count: g.users.length })}
          </ListHeader>
          <List>
            {g.users.map((u) => (
              <ListItem
                key={u.user_id}
                data-schedule-row={u.user_id}
                prefix={<Avatar name={u.user_name} src={photoOf(u)} size={42} />}
                title={<span className={cn(WORD)}>{u.user_name}</span>}
                detail={u.main_department_name_kr ? <span className={WORD}>{u.main_department_name_kr}</span> : undefined}
                align='top'
              />
            ))}
          </List>
        </section>
      ))}
    </div>
  )
}
