import type { ReactNode } from 'react'
import dayjs from 'dayjs'
import { BarChart3, PieChart } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card, CardHeader, CardTitle } from '@/shared/ds/card'
import { ResultSection } from '@/shared/ds/result-section'
import { LoadingRegion, Skeleton } from '@/shared/ds/skeleton'
import {
  VacationMetrics,
  useAvailableVacationsQuery,
  useUserMonthlyVacationStatsQuery,
  useUserVacationHistoryQuery,
  useUserVacationStatsQuery,
} from '@/entities/vacation'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { Band } from '@/widgets/layout/ui/ScreenBands'
import { hasMonthUsage, typeSlices } from '@/features/vacation-history/lib/vacation-chart'
import { MonthVacationStatsContent } from './MonthVacationStatsContent'
import { VacationTypeStatsContent } from './VacationTypeStatsContent'
import { VacationHistoryTable, type RecordOwner } from './VacationHistoryTable'

/** 구역 하나의 읽기 실패 — "{구역}을/를 불러오지 못했어요" + "잠시 뒤 다시 시도해주세요." + [다시 시도](그 질의만) */
const SectionFailure = ({ title, onRetry, retrying }: { title: string; onRetry: () => void; retrying: boolean }) => {
  const { t } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  return (
    <ResultSection
      kind='failure'
      size='medium'
      title={title}
      description={t('memberVacation.failureDescription')}
      primaryAction={{ label: tc('retry'), onClick: onRetry, loading: retrying }}
    />
  )
}

type Q = { isPending: boolean; isLoadingError: boolean; isFetching: boolean; refetch: () => unknown }

/** 데스크톱 카드 · 폰 띠 — 머리는 늘 그리고 내용 자리만 기다린다. 폰 띠 본문은 좌우 24 */
const Section = ({ title, children, body = 'content', name }: { title: string; children: ReactNode; body?: 'content' | 'list'; name: string }) => {
  const desktop = useDesktop()
  return desktop ? (
    <Card body={body} data-section={name}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      {children}
    </Card>
  ) : (
    <Band title={title} body={body} data-section={name}>
      {children}
    </Band>
  )
}

const ChartSkeleton = ({ size }: { size: number | 'bar' }) => (
  <div className='flex flex-col gap-x4'>
    {size === 'bar' ? (
      <Skeleton radius='16' className='block h-[200px] w-full' />
    ) : (
      <>
        <div className='flex justify-center'>
          <Skeleton radius='full' style={{ width: size, height: size }} />
        </div>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} text='t4' className='block w-full' />
        ))}
      </>
    )}
  </div>
)

const MetricsSkeleton = ({ cards }: { cards: boolean }) => {
  const one = (i: number) => (
    <div key={i} className='flex flex-col items-start gap-x1'>
      <Skeleton text='t3' className='block w-1/2' />
      <Skeleton text='t7' className='block w-3/4' />
    </div>
  )
  return cards ? <div className='grid grid-cols-3 gap-x6'>{[0, 1, 2].map((i) => <Card key={i}>{one(i)}</Card>)}</div> : <div className='flex flex-col gap-x4 px-x6 pt-x2'>{[0, 1, 2].map(one)}</div>
}

/**
 * 한 사람의 한 해 휴가 현황 구역(I-25 C 11 ~ 16) — 지표 셋 · 유형별 남은 휴가 · 달마다 쓴 휴가 · 휴가 기록.
 * 데스크톱: 지표 카드 셋(나란히 24) → 8 → 유형 | 달마다(나란히 24) → 8 → 기록 카드. 폰: 띠 넷(사이 8 — 첫 띠는 맨 위 `leading`(연도 Select) + 지표).
 * 질의마다 `quiet` — 구역이 실패를 그 자리에서 말하고(다른 구역은 그대로) [다시 시도] 는 그 질의만 다시 받는다.
 * 휴가 현황 화면과 구성원 휴가의 직원 탭이 같이 쓴다. owner 는 기록의 주인(수정 · 삭제 요청의 user_id).
 */
export function VacationSections({
  userId,
  year,
  owner,
  leading,
}: {
  userId: string
  year: string
  owner?: RecordOwner
  /** 폰 첫 띠 맨 위(연도 Select) */
  leading?: ReactNode
}) {
  const { t } = useTranslation('vacation')
  const desktop = useDesktop()
  const baseDate = dayjs().year(parseInt(year, 10)).format('YYYY-MM-DDT23:59:59')
  const stats = useUserVacationStatsQuery(userId, baseDate, { quiet: true })
  const types = useAvailableVacationsQuery(userId, baseDate, { quiet: true })
  const months = useUserMonthlyVacationStatsQuery(userId, year, { quiet: true })
  const history = useUserVacationHistoryQuery(userId, parseInt(year, 10), { quiet: true })
  const yearNum = parseInt(year, 10)

  const region = (q: Q, fallback: ReactNode, failureTitle: string, children: ReactNode) => (
    <LoadingRegion
      pending={q.isPending}
      failed={q.isLoadingError}
      fallback={fallback}
      failure={<SectionFailure title={failureTitle} onRetry={() => void q.refetch()} retrying={q.isFetching} />}
    >
      {children}
    </LoadingRegion>
  )

  const metrics = (cards: boolean) =>
    region(stats, <MetricsSkeleton cards={cards} />, t('history.metricsFailureTitle'), stats.data && <VacationMetrics data={stats.data} layout={cards ? 'cards' : 'band'} />)

  const typeBody = region(
    types,
    <ChartSkeleton size={desktop ? 160 : 120} />,
    t('history.typeFailureTitle'),
    types.data && typeSlices(types.data).length > 0 ? (
      <VacationTypeStatsContent data={types.data} />
    ) : (
      <ResultSection size='medium' icon={<PieChart />} title={t('history.emptyType')} />
    )
  )
  const monthBody = region(
    months,
    <ChartSkeleton size='bar' />,
    t('history.monthFailureTitle'),
    months.data && hasMonthUsage(months.data) ? (
      <MonthVacationStatsContent data={months.data} year={yearNum} />
    ) : (
      <ResultSection size='medium' icon={<BarChart3 />} title={t('history.emptyUsage', { year })} />
    )
  )

  const records = (
    <VacationHistoryTable
      value={history.data}
      year={yearNum}
      owner={owner}
      status={{ pending: history.isPending, failed: history.isLoadingError, fetching: history.isFetching, onRetry: () => void history.refetch() }}
    />
  )

  if (desktop) {
    return (
      <div className='flex min-w-0 flex-col gap-x2' data-vacation-sections>
        {metrics(true)}
        <div className='grid grid-cols-2 gap-x6'>
          <Section name='type' title={t('history.typeCardTitle')}>
            {typeBody}
          </Section>
          <Section name='month' title={t('history.monthCardTitle')}>
            {monthBody}
          </Section>
        </div>
        <Section name='records' title={t('history.recordsTitle')} body='list'>
          {records}
        </Section>
      </div>
    )
  }
  return (
    <div className='flex min-w-0 flex-col gap-x2' data-vacation-sections>
      <section aria-label={t('history.metricsAria')} className='bg-bg-layer-default pb-x3' data-section='metrics'>
        {leading != null && <div className='px-x6 pt-x4'>{leading}</div>}
        <div className={leading != null ? 'pt-x2' : 'pt-x4'}>{metrics(false)}</div>
      </section>
      <Section name='type' title={t('history.typeCardTitle')}>
        {typeBody}
      </Section>
      <Section name='month' title={t('history.monthCardTitle')}>
        {monthBody}
      </Section>
      <Section name='records' title={t('history.recordsTitle')} body='list'>
        {records}
      </Section>
    </div>
  )
}
