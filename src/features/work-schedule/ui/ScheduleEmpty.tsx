import { CalendarX } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ResultSection } from '@/shared/ds/result-section'

/** 근무 일정 비었음 — 화면과 홈 위젯이 같은 부품을 쓴다 */
export const ScheduleEmpty = () => {
  const { t } = useTranslation('work')
  return <ResultSection size='medium' icon={<CalendarX />} title={t('sch.emptyTitle')} description={t('sch.emptyDescription')} />
}
