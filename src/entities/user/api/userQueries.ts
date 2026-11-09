'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createQueryKeys } from '@/shared/api/queryKeys'
import { userApi } from '@/entities/user/api/userApi'
import type {
  ChangePasswordReq,
  GetUserApproversResp,
  GetUserIdDuplicateResp,
  GetUserResp,
  GetUsersResp,
  PostUserInviteReq,
  PostUserInviteResp,
  PostUserReq,
  PutInvitedUserReq,
  PutInvitedUserResp,
  PutUserReq,
  RequestPasswordResetReq,
  ResetPasswordReq,
  UpdateDashboardReq,
  UpdateDashboardResp,
} from '@/entities/user/model/types'

const userKeys = createQueryKeys('users')

// 사용자 상세 조회 훅
export const useUserQuery = (userId: string, options?: { quiet?: boolean }) => {
  return useQuery<GetUserResp>({
    queryKey: userKeys.detail(userId),
    queryFn: () => userApi.getUser(userId),
    enabled: !!userId, // userId가 있을 때만 실행
    meta: options?.quiet ? { quiet: true } : undefined
  })
}

// 사용자 목록 조회 훅
export const useUsersQuery = (options?: { quiet?: boolean }) => {
  return useQuery<GetUsersResp[]>({
    queryKey: userKeys.lists(),
    queryFn: () => userApi.getUsers(),
    // quiet — 그 화면이 자기 자리에서 실패를 말한다(읽기 실패 임시 그물 Snackbar 를 건너뛴다)
    meta: options?.quiet ? { quiet: true } : undefined
  })
}

// 사용자 결재자 조회 훅
export const useUserApproversQuery = (userId: string) => {
  return useQuery<GetUserApproversResp>({
    queryKey: userKeys.list({ type: 'approvers', userId }),
    queryFn: () => userApi.getUserApprovers(userId),
    enabled: !!userId // userId가 있을 때만 실행
  })
}

// 사용자 ID 중복 체크 훅
export const useUserIdDuplicateQuery = (userId: string) => {
  return useQuery<GetUserIdDuplicateResp>({
    queryKey: userKeys.list({ type: 'duplicate', userId }),
    queryFn: () => userApi.getUserIdDuplicate(userId),
    enabled: !!userId // userId가 있을 때만 실행
  })
}

// 사용자 생성 Mutation 훅
export const usePostUserMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<any, Error, PostUserReq>({
    mutationFn: (data: PostUserReq) => userApi.postUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    }
  })
}

// 사용자 수정 Mutation 훅
export const usePutUserMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<any, Error, PutUserReq>({
    mutationFn: (data: PutUserReq) => userApi.putUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    }
  })
}

// 사용자 삭제 Mutation 훅
export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<any, Error, string>({
    mutationFn: (userId: string) => userApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    }
  })
}

// 초대된 사용자 수정 Mutation 훅
export const usePutInvitedUserMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<PutInvitedUserResp, Error, PutInvitedUserReq>({
    mutationFn: (data: PutInvitedUserReq) => userApi.putInvitedUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    }
  })
}

// 사용자 초대 Mutation 훅
export const usePostUserInviteMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<PostUserInviteResp, Error, PostUserInviteReq>({
    mutationFn: (data: PostUserInviteReq) => userApi.postUserInvite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    }
  })
}

// 프로필 업로드 Mutation 훅 (invalidation 없음 - 기존 API와 동일)
export const usePostUploadProfileMutation = () => {
  return useMutation<any, Error, File>({
    mutationFn: (file: File) => userApi.postUploadProfile(file)
  })
}

// 초대 재발송 Mutation 훅
export const usePostResendInvitationMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<any, Error, string>({
    mutationFn: (userId: string) => userApi.postResendInvitation(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    }
  })
}
// 대시보드 수정 Mutation 훅
export const useUpdateDashboardMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<UpdateDashboardResp, Error, { userId: string, data: UpdateDashboardReq }>({
    mutationFn: ({ userId, data }) => userApi.updateDashboard(userId, data),
    // 사용자 정보를 다시 받은 뒤에 끝난다 — 홈 편집 패널이 닫힐 때 홈이 이미 새 배치다
    onSuccess: (data) => queryClient.invalidateQueries({ queryKey: userKeys.detail(data.user_id) })
  })
}

// 비밀번호 초기화 Mutation 훅
export const useResetPasswordMutation = () => {
  return useMutation<void, Error, ResetPasswordReq>({
    mutationFn: (data: ResetPasswordReq) => userApi.resetPassword(data)
  })
}

// 비밀번호 초기화 요청 Mutation 훅 (비로그인)
export const useRequestPasswordResetMutation = () => {
  return useMutation<void, Error, RequestPasswordResetReq>({
    mutationFn: (data: RequestPasswordResetReq) => userApi.requestPasswordReset(data)
  })
}

// 비밀번호 변경 Mutation 훅 (로그인 사용자)
export const useChangePasswordMutation = () => {
  return useMutation<void, Error, ChangePasswordReq>({
    mutationFn: (data: ChangePasswordReq) => userApi.changePassword(data)
  })
}
