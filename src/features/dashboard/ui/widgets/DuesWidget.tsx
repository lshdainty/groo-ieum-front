import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

import { useYearDuesQuery } from '@/entities/dues'
import { recentDues } from '@/features/culture-dues/lib/dues-recent'
import { DuesRecent, DuesRecentSkeleton } from '@/features/culture-dues/ui/DuesRecent'
import { DuesHistoryEmpty } from '@/features/culture-dues/ui/DuesResults'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { WidgetBoundary } from '@/features/dashboard/ui/WidgetResults'
import { WidgetFrame } from '@/features/dashboard/ui/WidgetFrame'

/** 회비 내역(D 26) — 올해 최근 5줄. 보기만 한다(⋮ · 추가 없음 — 고치기는 회비 화면에서). 나머지는 "전체 보기" */
export const DuesWidget = () => {
  useTranslation('culture')
  const desktop = useDesktop()
  const year = dayjs().year()
  const query = useYearDuesQuery(year, { quiet: true })
  const rows = recentDues(query.data)

  return (
    <WidgetFrame id='dues' body='list'>
      <WidgetBoundary id='dues' queries={[query]} fallback={<DuesRecentSkeleton desktop={desktop} />}>
        {query.data && query.data.length === 0 ? <DuesHistoryEmpty year={year} /> : <DuesRecent rows={rows} desktop={desktop} />}
      </WidgetBoundary>
    </WidgetFrame>
  )
}
