import { useTranslation } from 'react-i18next'

import { Card } from '@/shared/ds/card'
import { ResultSection } from '@/shared/ds/result-section'
import { LoadingRegion } from '@/shared/ds/skeleton'
import { ScrollFog } from '@/shared/ds/scroll-fog'
import { formatHourRange } from '@/shared/lib/date-text'
import { useUsersQuery } from '@/entities/user'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { SCREEN_TITLE_BOX, ScreenBody } from '@/widgets/layout/ui/ScreenBody'
import { ScreenTitle } from '@/shared/ds/top-navigation'
import { ScheduleEmpty } from './ScheduleEmpty'
import { ScheduleByTime } from './ScheduleByTime'
import { ScheduleSkeleton } from './ScheduleSkeleton'
import { ScheduleTable } from './ScheduleTable'

/**
 * 근무 일정(I-25 J) — 데스크톱: 제목 줄 + 카드 하나(시간표 + 아래 안내 "빗금은 쉬는 시간이에요"), 폰: 상단 바가 제목 · 흰 면 하나(쉬는 시간 안내 + 시간대 묶음).
 * 읽기는 `quiet` — 실패는 이 자리의 Result Section + [다시 시도], 사람이 없으면 비었음. 기다리는 동안은 사람 줄 틀(Skeleton).
 */
export function ScheduleContent() {
  const { t } = useTranslation('work')
  const { t: tc } = useTranslation('common')
  const desktop = useDesktop()
  const users = useUsersQuery({ quiet: true })
  const list = users.data ?? []

  const failure = (
    <ResultSection
      kind='failure'
      size='medium'
      title={t('sch.failureTitle')}
      description={t('sch.failureDescription')}
      primaryAction={{ label: tc('retry'), onClick: () => void users.refetch(), loading: users.isFetching }}
    />
  )
  const empty = <ScheduleEmpty />

  // 안내 줄은 기다리는 동안에도 처음부터 둔다(실패 · 비었음에서는 뺀다)
  const showNote = !users.isLoadingError && (users.isPending || list.length > 0)
  const note = (className: string, text: string) => (
    <p className={className} data-break-note>
      {text}
    </p>
  )

  const body = (
    <>
      {!desktop && showNote && note('m-0 px-x6 pb-x2 pt-x4 text-t3 text-fg-neutral-subtle', t('sch.breakNotePhone', { lunch: formatHourRange(12, 13), dinner: formatHourRange(18, 19) }))}
      <LoadingRegion pending={users.isPending} failed={users.isLoadingError} fallback={<ScheduleSkeleton desktop={desktop} />} failure={failure}>
        {list.length === 0 ? (
          empty
        ) : desktop ? (
          <ScrollFog aria-label={t('sch.title')} tabIndex={0} className='overflow-x-auto overflow-y-hidden' data-schedule-scroll>
            <ScheduleTable users={list} />
          </ScrollFog>
        ) : (
          <ScheduleByTime users={list} />
        )}
      </LoadingRegion>
      {desktop && showNote && note('m-0 px-x6 pb-x4 pt-x3 text-t3 text-fg-neutral-subtle', t('sch.breakNote'))}
    </>
  )

  return (
    <ScreenBody density='high'>
      <div className={SCREEN_TITLE_BOX}>
        <ScreenTitle>{t('sch.title')}</ScreenTitle>
      </div>
      {desktop ? (
        <Card body='list' data-schedule-board>
          {body}
        </Card>
      ) : (
        <section className='bg-bg-layer-default pb-x4' data-schedule-board>
          {body}
        </section>
      )}
    </ScreenBody>
  )
}
