import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type {
  CreateNoticeReq,
  CreateNoticeResp,
  NoticePageResp,
  NoticeResp,
  NoticeType,
  UpdateNoticeReq,
} from '@/entities/notice/model/types'

export const noticeApi = {
  createNotice: async (data: CreateNoticeReq): Promise<CreateNoticeResp> => {
    const resp: ApiResponse<CreateNoticeResp> = await apiClient.request({
      method: 'post',
      url: '/notice',
      data
    })

    if (!resp.success) throw new Error(resp.message)
    return resp.data
  },

  getNotice: async (noticeId: number): Promise<NoticeResp> => {
    const resp: ApiResponse<NoticeResp> = await apiClient.request({
      method: 'get',
      url: `/notice/${noticeId}`
    })

    if (!resp.success) throw new Error(resp.message)
    return resp.data
  },

  /** 관리용 상세 — 본문까지 주고 조회수는 올리지 않는다(NOTICE:MANAGE). 공지 수정 폼이 본문을 채울 때 쓴다 */
  getNoticeForManage: async (noticeId: number): Promise<NoticeResp> => {
    const resp: ApiResponse<NoticeResp> = await apiClient.request({
      method: 'get',
      url: `/notice/${noticeId}/manage`
    })

    if (!resp.success) throw new Error(resp.message)
    return resp.data
  },

  getNotices: async (page: number = 0, size: number = 10): Promise<NoticePageResp> => {
    const resp: ApiResponse<NoticePageResp> = await apiClient.request({
      method: 'get',
      url: `/notices?page=${page}&size=${size}`
    })

    if (!resp.success) throw new Error(resp.message)
    return resp.data
  },

  getNoticesByType: async (type: NoticeType, page: number = 0, size: number = 10): Promise<NoticePageResp> => {
    const resp: ApiResponse<NoticePageResp> = await apiClient.request({
      method: 'get',
      url: `/notices/type/${type}?page=${page}&size=${size}`
    })

    if (!resp.success) throw new Error(resp.message)
    return resp.data
  },

  searchNotices: async (keyword: string, page: number = 0, size: number = 10): Promise<NoticePageResp> => {
    const resp: ApiResponse<NoticePageResp> = await apiClient.request({
      method: 'get',
      url: `/notices/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`
    })

    if (!resp.success) throw new Error(resp.message)
    return resp.data
  },

  getActiveNotices: async (page: number = 0, size: number = 10): Promise<NoticePageResp> => {
    const resp: ApiResponse<NoticePageResp> = await apiClient.request({
      method: 'get',
      url: `/notices/active?page=${page}&size=${size}`
    })

    if (!resp.success) throw new Error(resp.message)
    return resp.data
  },

  getPinnedNotices: async (page: number = 0, size: number = 10): Promise<NoticePageResp> => {
    const resp: ApiResponse<NoticePageResp> = await apiClient.request({
      method: 'get',
      url: `/notices/pinned?page=${page}&size=${size}`
    })

    if (!resp.success) throw new Error(resp.message)
    return resp.data
  },

  updateNotice: async (noticeId: number, data: UpdateNoticeReq): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.request({
      method: 'put',
      url: `/notice/${noticeId}`,
      data
    })

    if (!resp.success) throw new Error(resp.message)
  },

  deleteNotice: async (noticeId: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.request({
      method: 'delete',
      url: `/notice/${noticeId}`
    })

    if (!resp.success) throw new Error(resp.message)
  },
}
