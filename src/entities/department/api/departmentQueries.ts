'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createQueryKeys } from '@/shared/api/queryKeys'
import { departmentApi } from '@/entities/department/api/departmentApi'
import type {
  GetDepartmentResp,
  GetDepartmentWithChildrenResp,
  GetDepartmentUsersResp,
  CheckUserMainDepartmentResp,
  PostDepartmentReq,
  PostDepartmentResp,
  PutDepartmentReq,
  PostDepartmentUsersReq,
  PostDepartmentUsersResp,
  DeleteDepartmentUsersReq,
} from '@/entities/department/model/types'

const departmentKeys = createQueryKeys('departments')
const companyKeys = createQueryKeys('companies')
const userKeys = createQueryKeys('users')

// 끝날 때까지 기다린다 — 줄 로딩이 목록을 다시 받은 뒤에 풀리게(mutateAsync 가 무효화 refetch 를 기다린다)
const refreshMembers = (queryClient: ReturnType<typeof useQueryClient>) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: departmentKeys.all() }),
    queryClient.invalidateQueries({ queryKey: userKeys.all() }),
  ])

// 부서 상세 조회 훅
export const useDepartmentQuery = (departmentId: number) => {
  return useQuery<GetDepartmentResp>({
    queryKey: departmentKeys.detail(departmentId),
    queryFn: () => departmentApi.getDepartment(departmentId),
    enabled: !!departmentId
  })
}

// 하위 부서 포함 부서 조회 훅
export const useDepartmentWithChildrenQuery = (departmentId: number) => {
  return useQuery<GetDepartmentWithChildrenResp>({
    queryKey: departmentKeys.list({ type: 'withChildren', departmentId }),
    queryFn: () => departmentApi.getDepartmentWithChildren(departmentId),
    enabled: !!departmentId
  })
}

// 부서 사용자 조회 훅
export const useDepartmentUsersQuery = (departmentId: number, options?: { quiet?: boolean }) => {
  return useQuery<GetDepartmentUsersResp>({
    queryKey: departmentKeys.list({ type: 'users', departmentId }),
    queryFn: () => departmentApi.getDepartmentUsers(departmentId),
    enabled: !!departmentId,
    // quiet — 그 화면이 자기 자리에서 실패를 말한다(읽기 실패 임시 그물 Snackbar 를 건너뛴다)
    meta: options?.quiet ? { quiet: true } : undefined
  })
}

// 사용자 주부서 존재 여부 확인 훅
export const useCheckUserMainDepartmentQuery = (userId: string) => {
  return useQuery<CheckUserMainDepartmentResp>({
    queryKey: departmentKeys.list({ type: 'checkMainDept', userId }),
    queryFn: () => departmentApi.getCheckUserMainDepartment(userId),
    enabled: !!userId
  })
}

// 부서 생성 Mutation 훅
export const usePostDepartmentMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<PostDepartmentResp, Error, PostDepartmentReq>({
    mutationFn: (data: PostDepartmentReq) => departmentApi.postDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all() })
      queryClient.invalidateQueries({ queryKey: companyKeys.all() })
    }
  })
}

// 부서 수정 Mutation 훅
export const usePutDepartmentMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { departmentId: number; data: PutDepartmentReq }>({
    mutationFn: ({ departmentId, data }) => departmentApi.putDepartment(departmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all() })
      queryClient.invalidateQueries({ queryKey: companyKeys.all() })
    }
  })
}

// 부서 삭제 Mutation 훅
export const useDeleteDepartmentMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: (departmentId: number) => departmentApi.deleteDepartment(departmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all() })
      queryClient.invalidateQueries({ queryKey: companyKeys.all() })
    }
  })
}

// 부서 사용자 추가 Mutation 훅
export const usePostDepartmentUsersMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<PostDepartmentUsersResp, Error, { departmentId: number; data: PostDepartmentUsersReq }>({
    mutationFn: ({ departmentId, data }) => departmentApi.postDepartmentUsers(departmentId, data),
    onSuccess: () => refreshMembers(queryClient)
  })
}

// 부서 사용자 삭제 Mutation 훅
export const useDeleteDepartmentUsersMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { departmentId: number; data: DeleteDepartmentUsersReq }>({
    mutationFn: ({ departmentId, data }) => departmentApi.deleteDepartmentUsers(departmentId, data),
    onSuccess: () => refreshMembers(queryClient)
  })
}

// 주 부서로 정하기 Mutation 훅 — 부서 사람 목록 · 사용자 목록 질의를 다시 받는다
export const usePutMainDepartmentMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { departmentId: number; userId: string }>({
    mutationFn: ({ departmentId, userId }) => departmentApi.putMainDepartment(departmentId, userId),
    onSuccess: () => refreshMembers(queryClient)
  })
}
