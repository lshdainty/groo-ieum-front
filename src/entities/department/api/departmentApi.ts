import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types/api'
import type {
  PostDepartmentReq,
  PostDepartmentResp,
  PutDepartmentReq,
  GetDepartmentResp,
  GetDepartmentWithChildrenResp,
  GetDepartmentUsersResp,
  PostDepartmentUsersReq,
  PostDepartmentUsersResp,
  DeleteDepartmentUsersReq,
  CheckUserMainDepartmentResp,
} from '@/entities/department/model/types'

export const departmentApi = {
  postDepartment: async (data: PostDepartmentReq): Promise<PostDepartmentResp> => {
    const resp: ApiResponse<PostDepartmentResp> = await apiClient.request({
      method: 'post',
      url: `/departments`,
      data
    })

    if (!resp.success) throw new Error(resp.message)

    return resp.data
  },

  putDepartment: async (departmentId: number, data: PutDepartmentReq): Promise<void> => {
    await apiClient.request({
      method: 'put',
      url: `/departments/${departmentId}`,
      data
    })
  },

  deleteDepartment: async (departmentId: number): Promise<void> => {
    await apiClient.request({
      method: 'delete',
      url: `/departments/${departmentId}`
    })
  },

  getDepartment: async (departmentId: number): Promise<GetDepartmentResp> => {
    const resp: ApiResponse<GetDepartmentResp> = await apiClient.request({
      method: 'get',
      url: `/departments/${departmentId}`
    })

    if (!resp.success) throw new Error(resp.message)

    return resp.data
  },

  getDepartmentWithChildren: async (departmentId: number): Promise<GetDepartmentWithChildrenResp> => {
    const resp: ApiResponse<GetDepartmentWithChildrenResp> = await apiClient.request({
      method: 'get',
      url: `/departments/${departmentId}/children`
    })

    if (!resp.success) throw new Error(resp.message)

    return resp.data
  },

  getDepartmentUsers: async (departmentId: number): Promise<GetDepartmentUsersResp> => {
    const resp: ApiResponse<GetDepartmentUsersResp> = await apiClient.request({
      method: 'get',
      url: `/departments/${departmentId}/users`
    })

    if (!resp.success) throw new Error(resp.message)

    return resp.data
  },

  postDepartmentUsers: async (departmentId: number, data: PostDepartmentUsersReq): Promise<PostDepartmentUsersResp> => {
    const resp: ApiResponse<PostDepartmentUsersResp> = await apiClient.request({
      method: 'post',
      url: `/departments/${departmentId}/users`,
      data
    })

    if (!resp.success) throw new Error(resp.message)

    return resp.data
  },

  deleteDepartmentUsers: async (departmentId: number, data: DeleteDepartmentUsersReq): Promise<void> => {
    await apiClient.request({
      method: 'delete',
      url: `/departments/${departmentId}/users`,
      data
    })
  },

  // 주 부서 옮기기 — 이 부서를 그 사람의 주 부서로 정한다(다른 부서의 주 부서 표시는 서버가 함께 내린다)
  putMainDepartment: async (departmentId: number, userId: string): Promise<void> => {
    await apiClient.request({
      method: 'put',
      url: `/departments/${departmentId}/users/${userId}/main`
    })
  },

  getCheckUserMainDepartment: async (userId: string): Promise<CheckUserMainDepartmentResp> => {
    const resp: ApiResponse<CheckUserMainDepartmentResp> = await apiClient.request({
      method: 'get',
      url: `/users/${userId}/main-department/existence`
    })

    if (!resp.success) throw new Error(resp.message)

    return resp.data
  },
}
