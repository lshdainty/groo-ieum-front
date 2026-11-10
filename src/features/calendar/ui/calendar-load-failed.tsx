import { useTranslation } from 'react-i18next'

import { ResultSection } from '@/shared/ds/result-section'

/** 일정 질의 실패 — 격자 자리 Result Section(medium · failure) + [다시 시도](일정 질의만 다시 받는다). 빈 달력으로 그리지 않는다 */
export function CalendarLoadFailed({ onRetry, retrying }: { onRetry: () => void; retrying?: boolean }) {
  const { t } = useTranslation('calendar')
  const { t: tc } = useTranslation('common')
  return (
    <div data-slot='calendar-load-failed'>
      <ResultSection kind='failure' size='medium' title={t('loadFailed.title')} description={t('loadFailed.description')} primaryAction={{ label: tc('retry'), onClick: onRetry, loading: retrying }} />
    </div>
  )
}
