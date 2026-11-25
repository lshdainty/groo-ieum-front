import { Receipt, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ResultSection } from '@/shared/ds/result-section'
import { isThisYear } from '../lib/dues-format'

/** 구역 읽기 실패(U) — 서버 글을 그리지 않는다. 제목은 "{구역}을/를 불러오지 못했어요" 의 구역 이름만 받는다 */
export const DuesFailure = ({ title, onRetry, retrying }: { title: string; onRetry: () => void; retrying?: boolean }) => {
  const { t } = useTranslation('culture')
  const { t: tc } = useTranslation('common')
  return (
    <ResultSection
      kind='failure'
      size='medium'
      title={title}
      description={t('dues.failure.description')}
      primaryAction={{ label: tc('retry'), onClick: onRetry, loading: retrying }}
    />
  )
}

/** 입출금 내역이 없을 때 — 관리 권한이면 [추가] */
export const DuesHistoryEmpty = ({ year, onAdd }: { year: number; onAdd?: () => void }) => {
  const { t } = useTranslation('culture')
  const { t: tc } = useTranslation('common')
  return (
    <ResultSection
      size='medium'
      icon={<Receipt />}
      title={t('dues.empty.history', { period: isThisYear(year) ? t('dues.period.this') : t('dues.period.year', { year }) })}
      primaryAction={onAdd ? { label: tc('add'), onClick: onAdd } : undefined}
    />
  )
}

export const DuesMatrixEmpty = () => {
  const { t } = useTranslation('culture')
  return <ResultSection size='medium' icon={<Users />} title={t('birthDues.empty.users')} />
}
