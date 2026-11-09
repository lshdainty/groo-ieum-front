import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type {
  GetVacationPolicyResp,
  GetVacationPoliciesResp,
  PostVacationPolicyReq,
  PostVacationPolicyResp,
  UpdateVacationPolicyReq,
  UpdateVacationPolicyResp,
  DeleteVacationPolicyResp,
  PostAssignVacationPoliciesToUserResp,
  GetUserVacationPoliciesResp,
  GetUserAssignedVacationPoliciesResp,
  GetUserVacationPolicyAssignmentStatusResp,
  DeleteRevokeVacationPolicyFromUserResp,
  DeleteRevokeVacationPoliciesFromUserResp,
} from '@/entities/vacation-policy/model/types'

export const vacationPolicyApi = {
  // === Policy CRUD ===
  getVacationPolicy: async (vacationPolicyId: number): Promise<GetVacationPolicyResp> => {
    const resp: ApiResponse<GetVacationPolicyResp> = await apiClient.request({
      method: 'get',
      url: `/vacation-policies/${vacationPolicyId}`
    })
    if (!resp.success) throw new Error(resp.message)
    return resp.data
  },

  getVacationPolicies: async (): Promise<GetVacationPoliciesResp[]> => {
    const resp: ApiResponse<GetVacationPoliciesResp[]> = await apiClient.request({
      method: 'get',
      url: `/vacation-policies`
    })
    if (!resp.success) throw new Error(resp.message)
    return resp.data
  },

  postVacationPolicy: async (data: PostVacationPolicyReq): Promise<PostVacationPolicyResp> => {
    const resp: ApiResponse<PostVacationPolicyResp> = await apiClient.request({
      method: 'post',
      url: `/vacation-policies`,
      data
    })
    if (!resp.success) throw new Error(resp.message)
    return resp.data
  },

  putVacationPolicy: async (vacationPolicyId: number, data: UpdateVacationPolicyReq): Promise<UpdateVacationPolicyResp> => {
    const resp: ApiResponse<UpdateVacationPolicyResp> = await apiClient.request({
      method: 'put',
      url: `/vacation-policies/${vacationPolicyId}`,
      data
    })
    if (!resp.success) throw new Error(resp.message)
    return resp.data
  },

  deleteVacationPolicy: async (vacationPolicyId: number): Promise<DeleteVacationPolicyResp> => {
    const resp: ApiResponse<DeleteVacationPolicyResp> = await apiClient.request({
      method: 'delete',
      url: `/vacation-policies/${vacationPolicyId}`
    })
    if (!resp.success) throw new Error(resp.message)
    return resp.data
  },

  // === User-Policy Assignment ===
  postAssignVacationPoliciesToUser: async (userId: string, vacationPolicyIds: number[]): Promise<PostAssignVacationPoliciesToUserResp> => {
    const resp: ApiResponse<PostAssignVacationPoliciesToUserResp> = await apiClient.request({
      method: 'post',
      url: `/users/${userId}/vacation-policies`,
      data: {
        vacation_policy_ids: vacationPolicyIds
      }
    })
    if (!resp.success) throw new Error(resp.message)
    return resp.data
  },

  getUserVacationPolicies: async (userId: string, grantMethod?: string): Promise<GetUserVacationPoliciesResp[]> => {
    const params = new URLSearchParams()
    if (grantMethod) {
      params.append('grantMethod', grantMethod)
    }
    const queryString = params.toString() ? `?${params.toString()}` : ''
    const resp: ApiResponse<GetUserVacationPoliciesResp[]> = await apiClient.request({
      method: 'get',
      url: `/users/${userId}/vacation-policies${queryString}`
    })
    if (!resp.success) throw new Error(resp.message)
    return resp.data
  },

  getUserAssignedVacationPolicies: async (userId: string, vacationType?: string, grantMethod?: string): Promise<GetUserAssignedVacationPoliciesResp[]> => {
    const params = new URLSearchParams()
    if (vacationType) {
      params.append('vacationType', vacationType)
    }
    if (grantMethod) {
      params.append('grantMethod', grantMethod)
    }
    const queryString = params.toString() ? `?${params.toString()}` : ''
    const resp: ApiResponse<GetUserAssignedVacationPoliciesResp[]> = await apiClient.request({
      method: 'get',
      url: `/users/${userId}/vacation-policies/assigned${queryString}`
    })
    if (!resp.success) throw new Error(resp.message)
    return resp.data
  },

  getUserVacationPolicyAssignmentStatus: async (userId: string): Promise<GetUserVacationPolicyAssignmentStatusResp> => {
    const resp: ApiResponse<GetUserVacationPolicyAssignmentStatusResp> = await apiClient.request({
      method: 'get',
      url: `/users/${userId}/vacation-policies/assignment-status`
    })
    if (!resp.success) throw new Error(resp.message)
    return resp.data
  },

  deleteRevokeVacationPolicyFromUser: async (userId: string, vacationPolicyId: number): Promise<DeleteRevokeVacationPolicyFromUserResp> => {
    const resp: ApiResponse<DeleteRevokeVacationPolicyFromUserResp> = await apiClient.request({
      method: 'delete',
      url: `/users/${userId}/vacation-policies/${vacationPolicyId}`
    })
    if (!resp.success) throw new Error(resp.message)
    return resp.data
  },

  deleteRevokeVacationPoliciesFromUser: async (userId: string, vacationPolicyIds: number[]): Promise<DeleteRevokeVacationPoliciesFromUserResp> => {
    const resp: ApiResponse<DeleteRevokeVacationPoliciesFromUserResp> = await apiClient.request({
      method: 'delete',
      url: `/users/${userId}/vacation-policies`,
      data: {
        vacation_policy_ids: vacationPolicyIds
      }
    })
    if (!resp.success) throw new Error(resp.message)
    return resp.data
  },
}
