import { useTranslation } from 'react-i18next'

import { ResultSection } from '@/shared/ds/result-section'
import { eulReul } from '@/features/dashboard/lib/josa'

/**
 * 위젯 하나가 읽기에 실패했을 때(U) — 서버 글을 그리지 않고 "{위젯}을/를 불러오지 못했어요" + "잠시 뒤 다시 시도해주세요." + [다시 시도].
 * 그 위젯의 질의만 다시 받는다. name 은 위젯 이름(편집 목록 · 카드 머리와 같은 글).
 */
export const WidgetFailure = ({ name, onRetry, retrying }: { name: string; onRetry: () => void; retrying?: boolean }) => {
  const { t, i18n } = useTranslation('dashboard')
  const { t: tc } = useTranslation('common')
  return (
    <ResultSection
      kind='failure'
      size='medium'
      title={t('widget.failureTitle', { name, eulReul: eulReul(name, i18n.language) })}
      description={t('widget.failureDescription')}
      primaryAction={{ label: tc('retry'), onClick: onRetry, loading: retrying }}
    />
  )
}
