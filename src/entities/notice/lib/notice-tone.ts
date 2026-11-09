import type { NoticeType } from '@/entities/notice/model/types'

/**
 * 공지 분류 배지 색 한 벌(I-23 G 55) — 긴급 critical · 점검 warning · 이벤트 informative · 일반 neutral.
 * 사용자 목록 · 상세 페이지가 쓴다(관리 목록의 날 색 표는 I-24 가 이 표로 대신한다).
 */
export type NoticeTone = 'critical' | 'warning' | 'informative' | 'neutral'

export const NOTICE_TONE: Record<NoticeType, NoticeTone> = {
  URGENT: 'critical',
  MAINTENANCE: 'warning',
  EVENT: 'informative',
  GENERAL: 'neutral',
}
