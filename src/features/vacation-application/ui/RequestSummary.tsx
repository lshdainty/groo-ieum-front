import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useGrantTimeText } from '@/shared/lib/groo/use-grant-time-text'

import { Card, CardStat, Delta } from '@/shared/ds/card'
import { List, ListItem } from '@/shared/ds/list'
import { Skeleton } from '@/shared/ds/skeleton'
import { TagGroup, TagGroupItem } from '@/shared/ds/tag-group'
import { formatChangeRate, formatShare } from '@/shared/lib/groo/share'
import type { GetUserRequestedVacationStatsResp } from '@/entities/vacation'

type Layout = 'card' | 'band' | 'inline'

/** 숫자 · 보조 줄 — 값은 ds CardStat 이 그리고, 아래 보조 글(t3 subtle)은 이 칸이 둔다 */
const Stat = ({ id, label, value, sub, delta, size = 'small' }: { id: string; label: string; value: ReactNode; sub?: ReactNode; delta?: ReactNode; size?: 'large' | 'small' }) => (
  <div data-stat={id} className='flex min-w-0 flex-col items-start'>
    <CardStat label={label} value={value} size={size} />
    {(sub || delta) && (
      <span className='mt-x1 flex flex-wrap items-center gap-x2 text-t3 text-fg-neutral-subtle'>
        {sub}
        {delta}
      </span>
    )}
  </div>
)

/**
 * 신청 요약(I-25 D 19) — 큰 숫자 넷(올해 신청 · 받은 휴가 · 승인율 · 결재까지 평균) + 상태 다섯 Tag Group.
 * 데스크톱 카드(`cols` 4 · 2) · 폰 띠(올해 신청 큰 숫자 + Tag Group + 키-값 셋, 연도 칸 `leading` 이 맨 위) · 홈 위젯(`inline`, 카드 없이 격자).
 * 증감은 ds Delta(▲ 빨강 · ▼ 파랑 — 좋고 나쁨이 아니라 방향), 승인율은 비중 규칙(소수 첫째 자리 · 분모 0 이면 "—").
 */
export function RequestSummary({
  stats,
  year,
  layout,
  cols = 4,
  leading,
}: {
  stats: GetUserRequestedVacationStatsResp
  year: number
  layout: Layout
  cols?: 2 | 4
  leading?: ReactNode
}) {
  const { t } = useTranslation('vacation')
  const gt = useGrantTimeText()
  const total = stats.total_request_count
  const growth = stats.change_rate
  const thisYear = year === new Date().getFullYear()

  const totalLabel = thisYear ? t('req.sumTotalThisYear') : t('req.sumTotalYear', { year })
  const delta =
    growth === 0 ? undefined : (
      <Delta direction={growth > 0 ? 'up' : 'down'} value={formatChangeRate(growth, { sign: 'none' })} text={t('request.sinceLastMonth')} data-request-growth={growth > 0 ? 'up' : 'down'} />
    )
  const monthSub = t('req.sumThisMonth', { count: stats.current_month_request_count })
  const rate = total > 0 ? formatShare(stats.approval_rate) : '—'
  const avg = total > 0 ? t('req.sumAvgValue', { days: stats.average_processing_days.toFixed(1) }) : '—'

  const tags = (
    <TagGroup size='t3' aria-label={t('req.tagsAria')} data-status-tags>
      {[
        ['pending', stats.pending_count],
        ['progress', stats.progress_count],
        ['approved', stats.approved_count],
        ['rejected', stats.rejected_count],
        ['canceled', stats.canceled_count],
      ].map(([key, n]) => (
        <TagGroupItem key={key} data-status-tag={key}>
          {t(`status.${key}`)} <b className='font-bold text-fg-neutral tabular-nums'>{n}</b>
        </TagGroupItem>
      ))}
    </TagGroup>
  )

  const four = [
    <Stat key='total' id='total' label={totalLabel} value={t('req.sumCount', { count: total })} sub={monthSub} delta={delta} />,
    <Stat key='acquired' id='acquired' label={t('req.sumAcquired')} value={gt(stats.acquired_vacation_time, stats.acquired_vacation_time_str || '0')} sub={t('req.sumAcquiredSub')} />,
    <Stat key='rate' id='rate' label={t('req.sumRate')} value={rate} sub={t('req.sumRateSub', { total, approved: stats.approved_count })} />,
    <Stat key='avg' id='avg' label={t('req.sumAvg')} value={avg} />,
  ]

  if (layout === 'band') {
    return (
      <div data-request-summary className='flex flex-col'>
        {leading != null && <div className='px-x6 pt-x4'>{leading}</div>}
        <div className={leading != null ? 'px-x6 pt-x2' : 'px-x6 pt-x4'}>
          <Stat id='total' label={totalLabel} value={t('req.sumCount', { count: total })} sub={monthSub} delta={delta} size='large' />
        </div>
        <div className='px-x6 pt-x3'>{tags}</div>
        <List className='mt-x1'>
          <ListItem data-stat='acquired' title={t('req.sumAcquired')} suffix={<span className='text-t5 font-bold tabular-nums text-fg-neutral'>{gt(stats.acquired_vacation_time, stats.acquired_vacation_time_str || '0')}</span>} />
          <ListItem data-stat='rate' title={t('req.sumRate')} detail={t('req.sumRateSub', { total, approved: stats.approved_count })} suffix={<span className='text-t5 font-bold tabular-nums text-fg-neutral'>{rate}</span>} align='top' />
          <ListItem data-stat='avg' title={t('req.sumAvg')} suffix={<span className='text-t5 font-bold tabular-nums text-fg-neutral'>{avg}</span>} />
        </List>
      </div>
    )
  }
  const grid = (
    <div className={layout === 'inline' ? 'grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-x6' : cols === 4 ? 'grid grid-cols-4 gap-x6' : 'grid grid-cols-2 gap-x6'}>{four}</div>
  )
  const body = (
    <div data-request-summary className='flex flex-col gap-x5'>
      {grid}
      {tags}
    </div>
  )
  return layout === 'card' ? <Card>{body}</Card> : body
}

export const RequestSummarySkeleton = ({ layout }: { layout: Layout }) => {
  const one = (i: number) => (
    <div key={i} className='flex flex-col items-start gap-x1'>
      <Skeleton text='t3' className='block w-1/2' />
      <Skeleton text='t7' className='block w-3/4' />
    </div>
  )
  if (layout === 'band') return <div className='flex flex-col gap-x4 px-x6 pt-x4 pb-x3'>{[0, 1, 2].map(one)}</div>
  const grid = <div className='grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-x6'>{[0, 1, 2, 3].map(one)}</div>
  return layout === 'card' ? <Card>{grid}</Card> : grid
}
