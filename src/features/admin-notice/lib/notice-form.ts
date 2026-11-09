import dayjs from 'dayjs'

import type { CreateNoticeReq, NoticeResp, NoticeType, UpdateNoticeReq } from '@/entities/notice'

export const NOTICE_TYPES: NoticeType[] = ['GENERAL', 'URGENT', 'EVENT', 'MAINTENANCE']

/** 종류 → 글 키(admin 이름공간, 지금 키 그대로) */
export const NOTICE_TYPE_KEY: Record<NoticeType, string> = {
  GENERAL: 'notice.typeGeneral',
  URGENT: 'notice.typeUrgent',
  EVENT: 'notice.typeEvent',
  MAINTENANCE: 'notice.typeMaintenance',
}

export interface NoticeFormValues {
  title: string
  content: string
  type: NoticeType
  pinned: boolean
  start: string
  end: string
}

/** 새 공지 — 종류 일반 · 고정 아님 · 오늘부터 30일(지금 폼의 처음 값 그대로) */
export const emptyNoticeForm = (): NoticeFormValues => ({
  title: '',
  content: '',
  type: 'GENERAL',
  pinned: false,
  start: dayjs().format('YYYY-MM-DD'),
  end: dayjs().add(30, 'day').format('YYYY-MM-DD'),
})

export const noticeFormOf = (n: Pick<NoticeResp, 'title' | 'content' | 'notice_type' | 'is_pinned' | 'start_date' | 'end_date'>): NoticeFormValues => ({
  title: n.title,
  content: n.content ?? '',
  type: n.notice_type,
  pinned: n.is_pinned === 'Y',
  start: dayjs(n.start_date).format('YYYY-MM-DD'),
  end: dayjs(n.end_date).format('YYYY-MM-DD'),
})

/** 칸 오류 — 제목 · 본문은 trim 한 값으로 본다 */
export const noticeFormErrors = (v: NoticeFormValues): { title?: true; content?: true; period?: true } => {
  const errors: { title?: true; content?: true; period?: true } = {}
  if (!v.title.trim()) errors.title = true
  if (!v.content.trim()) errors.content = true
  if (!v.start || !v.end) errors.period = true
  return errors
}

export const noticeFormChanged = (a: NoticeFormValues, b: NoticeFormValues): boolean =>
  a.title.trim() !== b.title.trim() || a.content.trim() !== b.content.trim() || a.type !== b.type || a.pinned !== b.pinned || a.start !== b.start || a.end !== b.end

export const noticeCreateOf = (v: NoticeFormValues, writerId: string): CreateNoticeReq => ({
  writer_id: writerId,
  title: v.title.trim(),
  content: v.content.trim(),
  notice_type: v.type,
  is_pinned: v.pinned ? 'Y' : 'N',
  start_date: v.start,
  end_date: v.end,
})

export const noticeUpdateOf = (v: NoticeFormValues): UpdateNoticeReq => ({
  title: v.title.trim(),
  content: v.content.trim(),
  notice_type: v.type,
  is_pinned: v.pinned ? 'Y' : 'N',
  start_date: v.start,
  end_date: v.end,
})

/** 지금 노출 중인가 — 시작일 0시 ~ 끝일 끝(지금 판정 그대로: 시작 ≤ 지금 ≤ 끝 날짜 0시) */
export const isNoticeActive = (start: string, end: string, now: Date = new Date()): boolean => now >= new Date(start) && now <= new Date(end)
