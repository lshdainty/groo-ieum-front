import { Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ResultSection } from '@/shared/ds/result-section'

/** 공지 목록이 비었을 때(U 절) */
export const NoticeEmpty = () => {
  const { t } = useTranslation('notice')
  return <ResultSection size='medium' icon={<Bell />} title={t('empty.title')} description={t('empty.description')} />
}

/** 공지(목록 · 상세) 불러오기 실패 — 서버 글을 그리지 않는다. 없는 공지 · 지운 공지도 같다 */
export const NoticeFailure = ({ onRetry, retrying }: { onRetry: () => void; retrying?: boolean }) => {
  const { t } = useTranslation('notice')
  const { t: tc } = useTranslation('common')
  return (
    <ResultSection
      kind='failure'
      size='medium'
      title={t('failure.title')}
      description={t('failure.description')}
      primaryAction={{ label: tc('retry'), onClick: onRetry, loading: retrying }}
    />
  )
}
