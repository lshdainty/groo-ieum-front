import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { FloatingActionButton } from '@/shared/ds/floating-action-button'
import { ResultSection } from '@/shared/ds/result-section'
import { Select, SelectItem } from '@/shared/ds/select'
import { LoadingRegion } from '@/shared/ds/skeleton'
import { useUser } from '@/entities/session'
import { useUserRequestedVacationsQuery, useUserRequestedVacationStatsQuery } from '@/entities/vacation'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { useWide } from '@/widgets/layout/lib/use-wide'
import { ScreenBody, ScreenTitleRow } from '@/widgets/layout/ui/ScreenBody'
import { useApplicationContext } from '../model/ApplicationContext'
import { ApplicationFormDialog } from './ApplicationFormDialog'
import { ApplicationTable } from './ApplicationTable'
import { RequestSummary, RequestSummarySkeleton } from './RequestSummary'

/** 고른 해 선택지 — 5년 전 ~ 1년 뒤(지금 그대로) */
const yearOptions = (): number[] => {
  const current = new Date().getFullYear()
  return Array.from({ length: 7 }, (_, i) => current - 5 + i)
}

/**
 * 휴가 신청(I-25 D) — 제목 줄 "휴가 신청" + 연도 Select + [휴가 신청](데스크톱 brandSolid small), 폰은 상단 바가 제목 · 연도는 첫 띠 맨 위 · 오른쪽 아래 떠 있는 +.
 * 요약(큰 숫자 넷 + 상태 Tag Group)과 신청 내역은 질의가 따로라 구역마다 기다리고 구역마다 실패를 말한다(읽기 quiet · [다시 시도]는 그 질의만).
 * 트리는 폭과 상관없이 하나 — 신청 폼은 이 컴포넌트에 한 번만 마운트되고 폭이 바뀌어도 열린 채 남는다.
 */
const ApplicationContent = () => {
  const { t } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  const desktop = useDesktop()
  const wide = useWide()
  const { isDialogOpen, setIsDialogOpen, selectedYear, setSelectedYear } = useApplicationContext()
  const { loginUser } = useUser()
  const userId = loginUser?.user_id || ''
  const year = parseInt(selectedYear)

  const requests = useUserRequestedVacationsQuery(userId, year, { quiet: true })
  const stats = useUserRequestedVacationStatsQuery(userId, year, { quiet: true })

  const create = () => setIsDialogOpen(true)

  const yearSelect = (
    <Select size='responsive' aria-label={t('req.yearAria')} value={selectedYear} onValueChange={setSelectedYear} className='w-[9rem]'>
      {yearOptions().map((y) => (
        <SelectItem key={y} value={String(y)} label={t('req.yearLabel', { year: y })} />
      ))}
    </Select>
  )

  const summaryFailure = (
    <ResultSection
      kind='failure'
      size='medium'
      title={t('req.sumFailureTitle')}
      description={t('memberVacation.failureDescription')}
      primaryAction={{ label: tc('retry'), onClick: () => void stats.refetch(), loading: stats.isFetching }}
    />
  )
  const summary = (layout: 'card' | 'band') => (
    <LoadingRegion
      pending={stats.isPending}
      failed={stats.isLoadingError}
      fallback={<RequestSummarySkeleton layout={layout} />}
      failure={summaryFailure}
    >
      {stats.data && <RequestSummary stats={stats.data} year={year} layout={layout} cols={wide ? 4 : 2} leading={layout === 'band' ? yearSelect : undefined} />}
    </LoadingRegion>
  )

  const list = (
    <ApplicationTable
      requests={requests.data ?? []}
      year={year}
      cancelUserId={userId}
      onCreate={create}
      status={{ pending: requests.isPending, failed: requests.isLoadingError, fetching: requests.isFetching, onRetry: () => void requests.refetch() }}
    />
  )

  return (
    <ScreenBody density='high'>
      <ScreenTitleRow
        title={t('req.title')}
        action={
          desktop ? (
            <div className='flex items-center gap-x2'>
              {yearSelect}
              <Button variant='brandSolid' size='small' onClick={create} data-create-request>
                <Plus aria-hidden />
                {t('req.create')}
              </Button>
            </div>
          ) : undefined
        }
      />
      {desktop ? (
        <div className='flex min-w-0 flex-col gap-x2'>
          <div data-section='summary'>{summary('card')}</div>
          {list}
        </div>
      ) : (
        <div className='flex min-w-0 flex-col gap-x2 pb-[96px]'>
          <section aria-label={t('req.sumAria')} className='bg-bg-layer-default pb-x3' data-section='summary'>
            {summary('band')}
          </section>
          {list}
        </div>
      )}
      {!desktop && <FloatingActionButton icon={<Plus />} aria-label={t('req.create')} onClick={create} data-create-request />}
      <ApplicationFormDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmitSuccess={() => setIsDialogOpen(false)}
      />
    </ScreenBody>
  )
}

export { ApplicationContent }
