'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createQueryKeys } from '@/shared/api'
import { vacationApi } from '@/entities/vacation/api/vacationApi'
import { calendarEventKeys } from '@/entities/calendar-event/api/calendarEventQueries'
import type {
  PostUseVacationReq,
  PostUseVacationResp,
  GetUserVacationHistoryResp,
  GetAllUsersVacationHistoryResp,
  GetAvailableVacationsResp,
  PutUpdateVacationUsageReq,
  PutUpdateVacationUsageResp,
  GetVacationUsagesByPeriodResp,
  GetUserVacationUsagesByPeriodResp,
  GetUserMonthlyVacationStatsResp,
  GetUserVacationStatsResp,
  PostManualGrantVacationReq,
  PostManualGrantVacationResp,
  DeleteRevokeVacationGrantResp,
  PostRequestVacationReq,
  PostRequestVacationResp,
  PostApproveVacationResp,
  PostRejectVacationResp,
  GetUserRequestedVacationsResp,
  GetUserRequestedVacationStatsResp,
  PostCancelVacationRequestResp,
  GetAllUsersVacationSummaryResp,
} from '@/entities/vacation/model/types'

export const vacationKeys = createQueryKeys('vacations')

/** quiet — 그 화면이 자기 자리에서 실패를 말한다(읽기 실패 임시 그물 Snackbar 를 건너뛴다 — QueryProvider) */
interface QuietOptions {
  quiet?: boolean
}

const quietMeta = (options?: QuietOptions) => (options?.quiet ? { quiet: true } : undefined)

// === Query Hooks ===

export const useUserVacationHistoryQuery = (userId: string, year?: number, options?: QuietOptions) => {
  const queryYear = year ?? new Date().getFullYear()
  return useQuery<GetUserVacationHistoryResp>({
    queryKey: vacationKeys.list({ type: 'history', userId, year: queryYear }),
    queryFn: () => vacationApi.getUserVacationHistory(userId, queryYear),
    enabled: !!userId,
    meta: quietMeta(options)
  })
}

export const useAllUsersVacationHistoryQuery = () => {
  return useQuery<GetAllUsersVacationHistoryResp[]>({
    queryKey: vacationKeys.lists(),
    queryFn: () => vacationApi.getAllUsersVacationHistory()
  })
}

export const useAllUsersVacationSummaryQuery = (year: number, options?: QuietOptions) => {
  return useQuery<GetAllUsersVacationSummaryResp[]>({
    queryKey: vacationKeys.list({ type: 'summary', year }),
    queryFn: () => vacationApi.getAllUsersVacationSummary(year),
    enabled: !!year,
    meta: quietMeta(options)
  })
}

export const useAvailableVacationsQuery = (userId: string, startDate: string, options?: QuietOptions & { enabled?: boolean }) => {
  return useQuery<GetAvailableVacationsResp>({
    queryKey: vacationKeys.list({ type: 'available', userId, startDate }),
    queryFn: () => vacationApi.getAvailableVacations(userId, startDate),
    enabled: (options?.enabled ?? true) && !!userId && !!startDate,
    meta: quietMeta(options)
  })
}

export const useVacationUsagesByPeriodQuery = (startDate: string, endDate: string) => {
  return useQuery<GetVacationUsagesByPeriodResp[]>({
    queryKey: vacationKeys.list({ type: 'usages', startDate, endDate }),
    queryFn: () => vacationApi.getVacationUsagesByPeriod(startDate, endDate),
    enabled: !!startDate && !!endDate
  })
}

export const useUserVacationUsagesByPeriodQuery = (userId: string, startDate: string, endDate: string) => {
  return useQuery<GetUserVacationUsagesByPeriodResp[]>({
    queryKey: vacationKeys.list({ type: 'userUsages', userId, startDate, endDate }),
    queryFn: () => vacationApi.getUserVacationUsagesByPeriod(userId, startDate, endDate),
    enabled: !!userId && !!startDate && !!endDate
  })
}

export const useUserMonthlyVacationStatsQuery = (userId: string, year: string, options?: QuietOptions) => {
  return useQuery<GetUserMonthlyVacationStatsResp[]>({
    queryKey: vacationKeys.list({ type: 'monthlyStats', userId, year }),
    queryFn: () => vacationApi.getUserMonthlyVacationStats(userId, year),
    enabled: !!userId && !!year,
    meta: quietMeta(options)
  })
}

export const useUserVacationStatsQuery = (userId: string, baseDate: string, options?: QuietOptions) => {
  return useQuery<GetUserVacationStatsResp>({
    queryKey: vacationKeys.list({ type: 'stats', userId, baseDate }),
    queryFn: () => vacationApi.getUserVacationStats(userId, baseDate),
    enabled: !!userId && !!baseDate,
    meta: quietMeta(options)
  })
}

export const useAllVacationsByApproverQuery = (approverId: string, year?: number, status?: string, options?: QuietOptions) => {
  const queryYear = year ?? new Date().getFullYear()
  return useQuery<GetUserRequestedVacationsResp[]>({
    queryKey: vacationKeys.list({ type: 'approvals', approverId, year: queryYear, status }),
    queryFn: () => vacationApi.getAllVacationsByApprover(approverId, queryYear, status),
    enabled: !!approverId,
    meta: quietMeta(options)
  })
}

export const useUserRequestedVacationsQuery = (userId: string, year?: number, options?: QuietOptions) => {
  const queryYear = year ?? new Date().getFullYear()
  return useQuery<GetUserRequestedVacationsResp[]>({
    queryKey: vacationKeys.list({ type: 'requests', userId, year: queryYear }),
    queryFn: () => vacationApi.getUserRequestedVacations(userId, queryYear),
    enabled: !!userId,
    meta: quietMeta(options)
  })
}

export const useUserRequestedVacationStatsQuery = (userId: string, year?: number, options?: QuietOptions) => {
  const queryYear = year ?? new Date().getFullYear()
  return useQuery<GetUserRequestedVacationStatsResp>({
    queryKey: vacationKeys.list({ type: 'requestStats', userId, year: queryYear }),
    queryFn: () => vacationApi.getUserRequestedVacationStats(userId, queryYear),
    enabled: !!userId,
    meta: quietMeta(options)
  })
}

// === Mutation Hooks ===

export const usePostUseVacationMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<PostUseVacationResp, Error, PostUseVacationReq>({
    mutationFn: (data: PostUseVacationReq) => vacationApi.postUseVacation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.lists() })
      queryClient.invalidateQueries({ queryKey: vacationKeys.all() })
    }
  })
}

export const usePutUpdateVacationUsageMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<PutUpdateVacationUsageResp, Error, PutUpdateVacationUsageReq>({
    mutationFn: (data: PutUpdateVacationUsageReq) => vacationApi.putUpdateVacationUsage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.lists() })
      queryClient.invalidateQueries({ queryKey: vacationKeys.all() })
    }
  })
}

export const useDeleteVacationUsageMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<unknown, Error, number>({
    mutationFn: (vacationUsageId: number) => vacationApi.deleteVacationUsage(vacationUsageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.lists() })
      queryClient.invalidateQueries({ queryKey: vacationKeys.all() })
    }
  })
}

export const usePostManualGrantVacationMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<PostManualGrantVacationResp, Error, PostManualGrantVacationReq>({
    mutationFn: (data: PostManualGrantVacationReq) => vacationApi.postManualGrantVacation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vacationKeys.all() })
    }
  })
}

export const useDeleteRevokeVacationGrantMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<DeleteRevokeVacationGrantResp, Error, number>({
    mutationFn: (vacationGrantId: number) => vacationApi.deleteRevokeVacationGrant(vacationGrantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vacationKeys.all() })
    }
  })
}

export const usePostRequestVacationMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<PostRequestVacationResp, Error, PostRequestVacationReq>({
    mutationFn: (data: PostRequestVacationReq) => vacationApi.postRequestVacation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vacationKeys.all() })
    }
  })
}

export const usePostApproveVacationMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<PostApproveVacationResp, Error, { approvalId: number; approverId: string }>({
    mutationFn: ({ approvalId, approverId }) => vacationApi.postApproveVacation(approvalId, approverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vacationKeys.all() })
    }
  })
}

export const usePostRejectVacationMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<PostRejectVacationResp, Error, { approvalId: number; approverId: string; rejectionReason: string }>({
    mutationFn: ({ approvalId, approverId, rejectionReason }) => vacationApi.postRejectVacation(approvalId, approverId, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vacationKeys.all() })
    }
  })
}

export const usePostCancelVacationRequestMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<PostCancelVacationRequestResp, Error, { vacationGrantId: number; userId: string }>({
    mutationFn: ({ vacationGrantId, userId }) => vacationApi.postCancelVacationRequest(vacationGrantId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vacationKeys.all() })
    }
  })
}
