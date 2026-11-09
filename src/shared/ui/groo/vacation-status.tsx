import { useTranslation } from 'react-i18next'

import { Badge } from '@/shared/ds/badge'

type StatusTone = 'neutral' | 'informative' | 'positive' | 'critical'

/**
 * 결재 상태 글 · 톤 한 벌(I-25 D 21 · 공통 결론) — 서버 `grant_status` 를 화면 키(vacation, status.*)로 푼다.
 * 승인을 거친 상태(ACTIVE · EXHAUSTED · EXPIRED)는 모두 "승인", 서버 이름("활성")은 그리지 않는다.
 */
const STATUS: Record<string, { key: string; tone: StatusTone }> = {
  PENDING: { key: 'status.pending', tone: 'neutral' },
  PROGRESS: { key: 'status.progress', tone: 'informative' },
  ACTIVE: { key: 'status.approved', tone: 'positive' },
  EXHAUSTED: { key: 'status.approved', tone: 'positive' },
  EXPIRED: { key: 'status.approved', tone: 'positive' },
  REJECTED: { key: 'status.rejected', tone: 'critical' },
  CANCELED: { key: 'status.canceled', tone: 'neutral' },
  REVOKED: { key: 'status.revoked', tone: 'neutral' },
}


export function VacationStatusBadge({ status, className }: { status: string; className?: string }) {
  const { t } = useTranslation('vacation')
  const entry = STATUS[status]
  if (!entry) return null
  return (
    <Badge tone={entry.tone} className={className} data-status={status}>
      {t(entry.key)}
    </Badge>
  )
}
