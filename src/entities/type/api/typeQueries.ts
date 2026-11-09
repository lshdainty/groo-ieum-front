'use client'

import { useQuery } from '@tanstack/react-query'

import { createQueryKeys } from '@/shared/api/queryKeys'
import { typeApi } from '@/entities/type/api/typeApi'
import type { TypeResp } from '@/entities/type/model/types'

const typeKeys = createQueryKeys('types')

// Grant Method Types 조회 훅
export const useGrantMethodTypesQuery = () => {
  return useQuery<TypeResp[]>({
    queryKey: typeKeys.list({ type: 'grant-method' }),
    queryFn: () => typeApi.getGrantMethodTypes()
  })
}

// Repeat Unit Types 조회 훅
export const useRepeatUnitTypesQuery = () => {
  return useQuery<TypeResp[]>({
    queryKey: typeKeys.list({ type: 'repeat-unit' }),
    queryFn: () => typeApi.getRepeatUnitTypes()
  })
}

// Vacation Time Types 조회 훅
export const useVacationTimeTypesQuery = () => {
  return useQuery<TypeResp[]>({
    queryKey: typeKeys.list({ type: 'vacation-time' }),
    queryFn: () => typeApi.getVacationTimeTypes()
  })
}

// Vacation Types 조회 훅
export const useVacationTypesQuery = (options?: { quiet?: boolean }) => {
  return useQuery<TypeResp[]>({
    queryKey: typeKeys.list({ type: 'vacation-type' }),
    queryFn: () => typeApi.getVacationTypes(),
    // quiet — 그 화면이 자기 자리에서 실패를 말한다(읽기 실패 임시 그물 Snackbar 를 건너뛴다)
    meta: options?.quiet ? { quiet: true } : undefined
  })
}

// Effective Types 조회 훅
export const useEffectiveTypesQuery = (options?: { quiet?: boolean }) => {
  return useQuery<TypeResp[]>({
    queryKey: typeKeys.list({ type: 'effective-type' }),
    queryFn: () => typeApi.getEffectiveTypes(),
    // quiet — 그 화면이 자기 자리에서 실패를 말한다(읽기 실패 임시 그물 Snackbar 를 건너뛴다)
    meta: options?.quiet ? { quiet: true } : undefined
  })
}

// Expiration Types 조회 훅
export const useExpirationTypesQuery = (options?: { quiet?: boolean }) => {
  return useQuery<TypeResp[]>({
    queryKey: typeKeys.list({ type: 'expiration-type' }),
    queryFn: () => typeApi.getExpirationTypes(),
    // quiet — 그 화면이 자기 자리에서 실패를 말한다(읽기 실패 임시 그물 Snackbar 를 건너뛴다)
    meta: options?.quiet ? { quiet: true } : undefined
  })
}

// Approval Status Types 조회 훅
export const useApprovalStatusTypesQuery = () => {
  return useQuery<TypeResp[]>({
    queryKey: typeKeys.list({ type: 'approval-status' }),
    queryFn: () => typeApi.getApprovalStatusTypes()
  })
}

// Grant Status Types 조회 훅
export const useGrantStatusTypesQuery = (options?: { quiet?: boolean }) => {
  return useQuery<TypeResp[]>({
    queryKey: typeKeys.list({ type: 'grant-status' }),
    queryFn: () => typeApi.getGrantStatusTypes(),
    meta: options?.quiet ? { quiet: true } : undefined
  })
}

// Schedule Types 조회 훅
export const useScheduleTypesQuery = () => {
  return useQuery<TypeResp[]>({
    queryKey: typeKeys.list({ type: 'schedule-type' }),
    queryFn: () => typeApi.getScheduleTypes()
  })
}

// Holiday Types 조회 훅
export const useHolidayTypesQuery = () => {
  return useQuery<TypeResp[]>({
    queryKey: typeKeys.list({ type: 'holiday-type' }),
    queryFn: () => typeApi.getHolidayTypes()
  })
}

// Company Types 조회 훅
export const useCompanyTypesQuery = () => {
  return useQuery<TypeResp[]>({
    queryKey: typeKeys.list({ type: 'company-type' }),
    queryFn: () => typeApi.getCompanyTypes()
  })
}

// Country Code Types 조회 훅
export const useCountryCodeTypesQuery = () => {
  return useQuery<TypeResp[]>({
    queryKey: typeKeys.list({ type: 'country-code' }),
    queryFn: () => typeApi.getCountryCodeTypes()
  })
}
