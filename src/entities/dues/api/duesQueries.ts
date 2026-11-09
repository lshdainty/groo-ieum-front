'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createQueryKeys } from '@/shared/api/queryKeys'
import { duesApi } from '@/entities/dues/api/duesApi'
import type {
  GetMonthBirthDuesResp,
  GetUsersMonthBirthDuesResp,
  GetYearDuesResp,
  GetYearOperationDuesResp,
  PostDuesReq,
  PutDuesReq,
} from '@/entities/dues/model/types'

const duesKeys = createQueryKeys('dues')

/** quiet — 그 화면이 자기 자리에서 실패를 말한다(읽기 실패 임시 그물 Snackbar 를 건너뛴다 — QueryProvider) */
export interface DuesQueryOptions {
  quiet?: boolean
}

const quietMeta = (options?: DuesQueryOptions) => (options?.quiet ? { quiet: true } : undefined)

// 연도별 회비 조회 훅
export const useYearDuesQuery = (year: number, options?: DuesQueryOptions) => {
  return useQuery<GetYearDuesResp[]>({
    queryKey: duesKeys.list({ type: 'year', year }),
    queryFn: () => duesApi.getYearDues(year),
    enabled: !!year,
    meta: quietMeta(options)
  })
}

// 연도별 운영비 조회 훅
export const useYearOperationDuesQuery = (year: number, options?: DuesQueryOptions) => {
  return useQuery<GetYearOperationDuesResp>({
    queryKey: duesKeys.list({ type: 'yearOperation', year }),
    queryFn: () => duesApi.getYearOperationDues(year),
    enabled: !!year,
    meta: quietMeta(options)
  })
}

// 월별 생일 회비 조회 훅
export const useMonthBirthDuesQuery = (year: number, month: number, options?: DuesQueryOptions) => {
  return useQuery<GetMonthBirthDuesResp>({
    queryKey: duesKeys.list({ type: 'monthBirth', year, month }),
    queryFn: () => duesApi.getMonthBirthDues(year, month),
    enabled: !!year && !!month,
    meta: quietMeta(options)
  })
}

// 사용자별 월별 생일 회비 조회 훅
export const useUsersMonthBirthDuesQuery = (year: number, options?: DuesQueryOptions) => {
  return useQuery<GetUsersMonthBirthDuesResp[]>({
    queryKey: duesKeys.list({ type: 'usersMonthBirth', year }),
    queryFn: () => duesApi.getUsersMonthBirthDues(year),
    enabled: !!year,
    meta: quietMeta(options)
  })
}

// 회비 생성 Mutation 훅
export const usePostDuesMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<any, Error, PostDuesReq>({
    mutationFn: (data: PostDuesReq) => duesApi.createDues(data),
    // 목록을 다시 받은 뒤에 끝난다 — 폼이 닫힐 때 표 · 지표가 이미 새 값이다
    onSuccess: () => queryClient.invalidateQueries({ queryKey: duesKeys.lists() })
  })
}

// 회비 수정 Mutation 훅
export const usePutDuesMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<any, Error, PutDuesReq>({
    mutationFn: (data: PutDuesReq) => duesApi.updateDues(data),
    // 목록을 다시 받은 뒤에 끝난다 — 폼이 닫힐 때 표 · 지표가 이미 새 값이다
    onSuccess: () => queryClient.invalidateQueries({ queryKey: duesKeys.lists() })
  })
}

// 회비 삭제 Mutation 훅
export const useDeleteDuesMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<any, Error, number>({
    mutationFn: (duesId: number) => duesApi.deleteDues(duesId),
    // 목록을 다시 받은 뒤에 끝난다 — 확인창이 닫힐 때 지운 줄이 이미 없어야 초점을 다음 줄로 옮길 수 있다
    onSuccess: () => queryClient.invalidateQueries({ queryKey: duesKeys.lists() })
  })
}
