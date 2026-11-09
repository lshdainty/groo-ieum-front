'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createQueryKeys } from '@/shared/api/queryKeys'
import { permissionApi } from '@/entities/permission/api/permissionApi'
import type {
  CreatePermissionReq,
  PermissionResp,
  UpdatePermissionReq,
} from '@/entities/permission/model/types'

const permissionKeys = createQueryKeys('permissions')

// 현재 사용자의 권한 목록 조회 훅
export const useMyPermissionsQuery = () => {
  return useQuery<string[]>({
    queryKey: permissionKeys.list({ type: 'my' }),
    queryFn: () => permissionApi.getMyPermissions()
  })
}

// 전체 권한 목록 조회 훅
export const usePermissionsQuery = (options?: { quiet?: boolean }) => {
  return useQuery<PermissionResp[]>({
    queryKey: permissionKeys.lists(),
    queryFn: () => permissionApi.getPermissions(),
    // quiet — 그 화면이 자기 자리에서 실패를 말한다(읽기 실패 임시 그물 Snackbar 를 건너뛴다)
    meta: options?.quiet ? { quiet: true } : undefined
  })
}

// 특정 권한 조회 훅
export const usePermissionQuery = (permissionCode: string) => {
  return useQuery<PermissionResp>({
    queryKey: permissionKeys.detail(permissionCode),
    queryFn: () => permissionApi.getPermission(permissionCode),
    enabled: !!permissionCode
  })
}

// 리소스별 권한 목록 조회 훅
export const usePermissionsByResourceQuery = (resource: string) => {
  return useQuery<PermissionResp[]>({
    queryKey: permissionKeys.list({ type: 'resource', resource }),
    queryFn: () => permissionApi.getPermissionsByResource(resource),
    enabled: !!resource
  })
}

// 권한 생성 Mutation 훅
export const usePostPermissionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<string, Error, CreatePermissionReq>({
    mutationFn: (data: CreatePermissionReq) => permissionApi.createPermission(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.lists() })
    }
  })
}

// 권한 수정 Mutation 훅
export const usePutPermissionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { permissionCode: string, data: UpdatePermissionReq }>({
    mutationFn: ({ permissionCode, data }) => permissionApi.updatePermission(permissionCode, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: permissionKeys.detail(variables.permissionCode) })
    }
  })
}

// 권한 삭제 Mutation 훅
export const useDeletePermissionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (permissionCode: string) => permissionApi.deletePermission(permissionCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.lists() })
    }
  })
}
