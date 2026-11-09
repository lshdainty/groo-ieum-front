'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createQueryKeys } from '@/shared/api/queryKeys'
import { roleApi } from '@/entities/role/api/roleApi'
import type { PermissionResp } from '@/entities/permission/model/types'
import type {
  CreateRoleReq,
  RolePermissionReq,
  RoleResp,
  UpdateRolePermissionsReq,
  UpdateRoleReq,
} from '@/entities/role/model/types'

const roleKeys = createQueryKeys('roles')

// 전체 역할 목록 조회 훅
export const useRolesQuery = (options?: { quiet?: boolean }) => {
  return useQuery<RoleResp[]>({
    queryKey: roleKeys.lists(),
    queryFn: () => roleApi.getRoles(),
    // quiet — 그 화면이 자기 자리에서 실패를 말한다(읽기 실패 임시 그물 Snackbar 를 건너뛴다)
    meta: options?.quiet ? { quiet: true } : undefined
  })
}

// 특정 역할 조회 훅
export const useRoleQuery = (roleCode: string) => {
  return useQuery<RoleResp>({
    queryKey: roleKeys.detail(roleCode),
    queryFn: () => roleApi.getRole(roleCode),
    enabled: !!roleCode
  })
}

// 역할 권한 목록 조회 훅
export const useRolePermissionsQuery = (roleCode: string) => {
  return useQuery<PermissionResp[]>({
    queryKey: roleKeys.list({ type: 'permissions', roleCode }),
    queryFn: () => roleApi.getRolePermissions(roleCode),
    enabled: !!roleCode
  })
}

// 역할 생성 Mutation 훅
export const usePostRoleMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<string, Error, CreateRoleReq>({
    mutationFn: (data: CreateRoleReq) => roleApi.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
    }
  })
}

// 역할 수정 Mutation 훅
export const usePutRoleMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { roleCode: string, data: UpdateRoleReq }>({
    mutationFn: ({ roleCode, data }) => roleApi.updateRole(roleCode, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(variables.roleCode) })
    }
  })
}

// 역할 삭제 Mutation 훅
export const useDeleteRoleMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (roleCode: string) => roleApi.deleteRole(roleCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
    }
  })
}

// 역할 권한 설정 (전체 교체) Mutation 훅
export const usePutRolePermissionsMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { roleCode: string, data: UpdateRolePermissionsReq }>({
    mutationFn: ({ roleCode, data }) => roleApi.updateRolePermissions(roleCode, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(variables.roleCode) })
      queryClient.invalidateQueries({ queryKey: roleKeys.list({ type: 'permissions', roleCode: variables.roleCode }) })
    }
  })
}

// 역할에 권한 추가 Mutation 훅
export const usePostRolePermissionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { roleCode: string, data: RolePermissionReq }>({
    mutationFn: ({ roleCode, data }) => roleApi.addRolePermission(roleCode, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(variables.roleCode) })
      queryClient.invalidateQueries({ queryKey: roleKeys.list({ type: 'permissions', roleCode: variables.roleCode }) })
    }
  })
}

// 역할에서 권한 제거 Mutation 훅
export const useDeleteRolePermissionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { roleCode: string, permissionCode: string }>({
    mutationFn: ({ roleCode, permissionCode }) => roleApi.deleteRolePermission(roleCode, permissionCode),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(variables.roleCode) })
      queryClient.invalidateQueries({ queryKey: roleKeys.list({ type: 'permissions', roleCode: variables.roleCode }) })
    }
  })
}
