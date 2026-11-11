// Types
export type {
  CreateNoticeReq,
  CreateNoticeResp,
  NoticeListResp,
  NoticePageResp,
  NoticeResp,
  NoticeType,
  UpdateNoticeReq,
  YNType,
} from '@/entities/notice/model/types'

// API
export { noticeApi } from '@/entities/notice/api/noticeApi'

// Queries
export {
  useActiveNoticesInfiniteQuery,
  useAdminNoticesInfiniteQuery,
  useActiveNoticesQuery,
  useCreateNoticeMutation,
  useDeleteNoticeMutation,
  useNoticeManageQuery,
  useNoticeQuery,
  useNoticesByTypeQuery,
  useNoticesQuery,
  usePinnedNoticesQuery,
  useSearchNoticesQuery,
  useUpdateNoticeMutation,
} from '@/entities/notice/api/noticeQueries'
export type { NoticeQueryOptions } from '@/entities/notice/api/noticeQueries'

// UI · lib (공용 — 사용자 목록 · 상세 · 관리 폰 목록)
export { NoticeRow } from '@/entities/notice/ui/NoticeRow'
export { NoticeKinds } from '@/entities/notice/ui/NoticeKinds'
export { NoticeContentText } from '@/entities/notice/ui/NoticeContentText'
export { NOTICE_TONE, type NoticeTone } from '@/entities/notice/lib/notice-tone'
export { formatNoticeDay, formatNoticeDateTime } from '@/entities/notice/lib/notice-format'
