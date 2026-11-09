'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createQueryKeys } from '@/shared/api/queryKeys'
import { companyApi } from '@/entities/company/api/companyApi'
import type {
  GetCompanyResp,
  GetCompanyWithDepartmentResp,
  PostCompanyReq,
  PostCompanyResp,
  PutCompanyReq,
} from '@/entities/company/model/types'

const companyKeys = createQueryKeys('companies')

/** quiet — 그 화면이 자기 자리에서 실패를 말한다(읽기 실패 임시 그물 Snackbar 를 건너뛴다 — QueryProvider) */
interface QuietOptions {
  quiet?: boolean
}

const quietMeta = (options?: QuietOptions) => (options?.quiet ? { quiet: true } : undefined)

// 회사 정보 조회 훅
export const useCompanyQuery = (options?: QuietOptions) => {
  return useQuery<GetCompanyResp>({
    queryKey: companyKeys.details(),
    queryFn: () => companyApi.getCompany(),
    meta: quietMeta(options)
  })
}

// 부서 포함 회사 정보 조회 훅
export const useCompanyWithDepartmentsQuery = (companyId: string, options?: QuietOptions) => {
  return useQuery<GetCompanyWithDepartmentResp>({
    queryKey: companyKeys.detail(companyId),
    queryFn: () => companyApi.getCompanyWithDepartments(companyId),
    enabled: !!companyId, // companyId가 있을 때만 실행
    meta: quietMeta(options)
  })
}

// 회사 생성 Mutation 훅
export const usePostCompanyMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<PostCompanyResp, Error, PostCompanyReq>({
    mutationFn: (data: PostCompanyReq) => companyApi.postCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.details() })
    }
  })
}

// 회사 수정 Mutation 훅
export const usePutCompanyMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { companyId: string; data: PutCompanyReq }>({
    mutationFn: ({ companyId, data }) => companyApi.putCompany(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.all() })
    }
  })
}

// 회사 삭제 Mutation 훅
export const useDeleteCompanyMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (companyId: string) => companyApi.deleteCompany(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.all() })
    }
  })
}
