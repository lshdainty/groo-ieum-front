'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createQueryKeys } from '@/shared/api'
import { vacationPolicyApi } from '@/entities/vacation-policy/api/vacationPolicyApi'
import { vacationKeys } from '@/entities/vacation/api/vacationQueries'
import type {
  GetVacationPolicyResp,
  GetVacationPoliciesResp,
  PostVacationPolicyReq,
  PostVacationPolicyResp,
  DeleteVacationPolicyResp,
  PostAssignVacationPoliciesToUserResp,
  GetUserVacationPoliciesResp,
  GetUserAssignedVacationPoliciesResp,
  GetUserVacationPolicyAssignmentStatusResp,
  DeleteRevokeVacationPolicyFromUserResp,
  DeleteRevokeVacationPoliciesFromUserResp,
} from '@/entities/vacation-policy/model/types'

export const vacationPolicyKeys = createQueryKeys('vacationPolicies')

// === Query Hooks ===

export const useVacationPolicyQuery = (vacationPolicyId: number) => {
  return useQuery<GetVacationPolicyResp>({
    queryKey: vacationPolicyKeys.detail(vacationPolicyId),
    queryFn: () => vacationPolicyApi.getVacationPolicy(vacationPolicyId),
    enabled: !!vacationPolicyId
  })
}

export const useVacationPoliciesQuery = () => {
  return useQuery<GetVacationPoliciesResp[]>({
    queryKey: vacationPolicyKeys.list({ type: 'policies' }),
    queryFn: () => vacationPolicyApi.getVacationPolicies()
  })
}

export const useUserVacationPoliciesQuery = (userId: string, grantMethod?: string) => {
  return useQuery<GetUserVacationPoliciesResp[]>({
    queryKey: vacationPolicyKeys.list({ type: 'userPolicies', userId, grantMethod }),
    queryFn: () => vacationPolicyApi.getUserVacationPolicies(userId, grantMethod),
    enabled: !!userId
  })
}

export const useUserAssignedVacationPoliciesQuery = (userId: string, vacationType?: string, grantMethod?: string, options?: { quiet?: boolean }) => {
  return useQuery<GetUserAssignedVacationPoliciesResp[]>({
    queryKey: vacationPolicyKeys.list({ type: 'assignedPolicies', userId, vacationType, grantMethod }),
    queryFn: () => vacationPolicyApi.getUserAssignedVacationPolicies(userId, vacationType, grantMethod),
    enabled: !!userId,
    // quiet — 그 화면이 자기 자리에서 실패를 말한다(읽기 실패 임시 그물 Snackbar 를 건너뛴다)
    meta: options?.quiet ? { quiet: true } : undefined
  })
}

export const useUserVacationPolicyAssignmentStatusQuery = (userId: string) => {
  return useQuery<GetUserVacationPolicyAssignmentStatusResp>({
    queryKey: vacationPolicyKeys.list({ type: 'assignmentStatus', userId }),
    queryFn: () => vacationPolicyApi.getUserVacationPolicyAssignmentStatus(userId),
    enabled: !!userId
  })
}

// === Mutation Hooks ===

export const usePostVacationPolicyMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<PostVacationPolicyResp, Error, PostVacationPolicyReq>({
    mutationFn: (data: PostVacationPolicyReq) => vacationPolicyApi.postVacationPolicy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vacationPolicyKeys.all() })
      queryClient.invalidateQueries({ queryKey: vacationKeys.all() })
    }
  })
}

export const useDeleteVacationPolicyMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<DeleteVacationPolicyResp, Error, number>({
    mutationFn: (vacationPolicyId: number) => vacationPolicyApi.deleteVacationPolicy(vacationPolicyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vacationPolicyKeys.all() })
      queryClient.invalidateQueries({ queryKey: vacationKeys.all() })
    }
  })
}

export const usePostAssignVacationPoliciesToUserMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<PostAssignVacationPoliciesToUserResp, Error, { userId: string; vacationPolicyIds: number[] }>({
    mutationFn: ({ userId, vacationPolicyIds }) => vacationPolicyApi.postAssignVacationPoliciesToUser(userId, vacationPolicyIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vacationPolicyKeys.all() })
      queryClient.invalidateQueries({ queryKey: vacationKeys.all() })
    }
  })
}

export const useDeleteRevokeVacationPolicyFromUserMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<DeleteRevokeVacationPolicyFromUserResp, Error, { userId: string; vacationPolicyId: number }>({
    mutationFn: ({ userId, vacationPolicyId }) => vacationPolicyApi.deleteRevokeVacationPolicyFromUser(userId, vacationPolicyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vacationPolicyKeys.all() })
      queryClient.invalidateQueries({ queryKey: vacationKeys.all() })
    }
  })
}

export const useDeleteRevokeVacationPoliciesFromUserMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<DeleteRevokeVacationPoliciesFromUserResp, Error, { userId: string; vacationPolicyIds: number[] }>({
    mutationFn: ({ userId, vacationPolicyIds }) => vacationPolicyApi.deleteRevokeVacationPoliciesFromUser(userId, vacationPolicyIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vacationPolicyKeys.all() })
      queryClient.invalidateQueries({ queryKey: vacationKeys.all() })
    }
  })
}
