'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createQueryKeys } from '@/shared/api/queryKeys'
import { typeApi, type TypeResp } from '@/entities/type'
import { workApi } from '@/entities/work/api/workApi'
import type {
  BulkCreateWorkHistoryReq,
  BulkCreateWorkHistoryResp,
  CheckSystemStatusBatchResp,
  CreateWorkCodeReq,
  CreateWorkCodeResp,
  CreateWorkHistoryReq,
  CreateWorkHistoryResp,
  SystemType,
  TodayWorkStatusResp,
  ToggleSystemCheckReq,
  ToggleSystemCheckResp,
  UnregisteredWorkDatesResp,
  UnregisteredWorkHistoryDownloadReq,
  UpdateWorkCodeReq,
  UpdateWorkHistoryReq,
  WorkCodeResp,
  WorkGroupWithParts,
  WorkHistoryResp,
  WorkHistorySearchCondition,
} from '@/entities/work/model/types'

const workKeys = createQueryKeys('works')

/** quiet — 그 화면이 자기 자리에서 실패를 말한다(읽기 실패 임시 그물 Snackbar 를 건너뛴다 — QueryProvider) */
interface QuietOptions {
  quiet?: boolean
}

const quietMeta = (options?: QuietOptions) => (options?.quiet ? { quiet: true } : undefined)

// 시스템 체크 상태 조회 훅
export const useSystemCheckStatusQuery = (systemCodes: SystemType[], options?: QuietOptions) => {
  return useQuery<CheckSystemStatusBatchResp>({
    queryKey: workKeys.list({ type: 'systemCheck', systemCodes }),
    queryFn: () => workApi.getSystemCheckStatus(systemCodes),
    enabled: systemCodes.length > 0,
    meta: quietMeta(options)
  })
}

// 오늘 업무 시간 상태 조회 훅
export const useTodayWorkStatusQuery = (options?: QuietOptions) => {
  return useQuery<TodayWorkStatusResp>({
    queryKey: workKeys.list({ type: 'todayStatus' }),
    queryFn: () => workApi.getTodayWorkStatus(),
    meta: quietMeta(options)
  })
}

// 미작성 업무 날짜 조회 훅
export const useUnregisteredWorkDatesQuery = (year: number, month: number, options?: QuietOptions) => {
  return useQuery<UnregisteredWorkDatesResp>({
    queryKey: workKeys.list({ type: 'unregisteredDates', year, month }),
    queryFn: () => workApi.getUnregisteredWorkDates(year, month),
    meta: quietMeta(options)
  })
}

// 업무 그룹 조회 훅
export const useWorkGroupsQuery = () => {
  return useQuery<WorkCodeResp[]>({
    queryKey: workKeys.list({ type: 'groups' }),
    queryFn: () => workApi.getWorkGroups()
  })
}

// 업무 그룹 + Labels + Parts 포함 조회 훅 (모든 Label과 Part를 한번에 조회하여 병합)
export const useWorkGroupsWithPartsQuery = (options?: QuietOptions) => {
  return useQuery<WorkGroupWithParts[]>({
    meta: quietMeta(options),
    queryKey: workKeys.list({ type: 'groupsWithParts' }),
    queryFn: async () => {
      // 1. 모든 업무 분류(Groups) 조회
      const workGroups = await workApi.getWorkGroups()

      if (!workGroups || workGroups.length === 0) return []

      // 2. 모든 업무 분류에 대한 Label 조회
      const labelsPromises = workGroups.map(group => workApi.getWorkPartLabel(group.work_code_id))
      const labelsResults = await Promise.all(labelsPromises)

      // 3. 모든 Label에 대한 Part 조회
      const allLabels = labelsResults.flat()
      const partsPromises = allLabels.map(label => workApi.getWorkParts(label.work_code_id))
      const partsResults = await Promise.all(partsPromises)
      const allParts = partsResults.flat()

      // 4. 데이터 병합 (Group -> Label -> Part)
      const mergedData: WorkGroupWithParts[] = workGroups.map(group => {
        // 해당 그룹의 라벨들 찾기
        const groupLabels = allLabels.filter(label => label.parent_work_code_id === group.work_code_id)

        // 각 라벨에 해당하는 파트들 매핑
        const labelsWithParts = groupLabels.map(label => ({
          ...label,
          parts: allParts.filter(part => part.parent_work_code_id === label.work_code_id)
        }))

        return {
          ...group,
          labels: labelsWithParts
        }
      })

      return mergedData
    }
  })
}

// 업무 파트 라벨 조회 훅
export const useWorkPartLabelQuery = (parentWorkCodeId: number) => {
  return useQuery<WorkCodeResp[]>({
    queryKey: workKeys.list({ type: 'partLabel', parentWorkCodeId }),
    queryFn: () => workApi.getWorkPartLabel(parentWorkCodeId),
    enabled: !!parentWorkCodeId
  })
}

// 업무 파트 조회 훅
export const useWorkPartsQuery = (parentWorkCodeId: number) => {
  return useQuery<WorkCodeResp[]>({
    queryKey: workKeys.list({ type: 'parts', parentWorkCodeId }),
    queryFn: () => workApi.getWorkParts(parentWorkCodeId),
    enabled: !!parentWorkCodeId
  })
}

// 업무 구분 조회 훅
export const useWorkDivisionQuery = (options?: QuietOptions) => {
  return useQuery<WorkCodeResp[]>({
    queryKey: workKeys.list({ type: 'division' }),
    queryFn: () => workApi.getWorkDivision(),
    meta: quietMeta(options)
  })
}

// 업무 구분 라벨 조회 훅 (work_division 코드 정보만 반환)
export const useWorkDivisionLabelsQuery = (options?: QuietOptions) => {
  return useQuery<WorkCodeResp | null>({
    meta: quietMeta(options),
    queryKey: workKeys.list({ type: 'divisionLabel' }),
    queryFn: async () => {
      const rootLabels = await workApi.getRootLabel()
      const workDivision = rootLabels.find(label => label.work_code === 'work_division')
      return workDivision || null
    }
  })
}

// 업무 히스토리 조회 훅
export const useWorkHistoriesQuery = (condition?: WorkHistorySearchCondition) => {
  return useQuery<WorkHistoryResp[]>({
    queryKey: workKeys.list({ type: 'histories', ...condition }),
    queryFn: () => workApi.getWorkHistories(condition)
  })
}

// 업무 히스토리 생성 Mutation 훅
export const usePostCreateWorkHistoryMutation = () => {
  return useMutation<CreateWorkHistoryResp, Error, CreateWorkHistoryReq>({
    mutationFn: (data: CreateWorkHistoryReq) => workApi.createWorkHistory(data)
  })
}

// 업무 히스토리 수정 Mutation 훅
export const usePutUpdateWorkHistoryMutation = () => {
  return useMutation<void, Error, UpdateWorkHistoryReq>({
    mutationFn: (data: UpdateWorkHistoryReq) => workApi.updateWorkHistory(data)
  })
}

// 업무 히스토리 삭제 Mutation 훅
export const useDeleteWorkHistoryMutation = () => {
  return useMutation<void, Error, number>({
    mutationFn: (workHistoryId: number) => workApi.deleteWorkHistory(workHistoryId)
  })
}

// 업무 히스토리 일괄 생성 Mutation 훅
export const useBulkCreateWorkHistoriesMutation = () => {
  return useMutation<BulkCreateWorkHistoryResp, Error, BulkCreateWorkHistoryReq>({
    mutationFn: (data: BulkCreateWorkHistoryReq) => workApi.bulkCreateWorkHistories(data)
  })
}

// 업무 히스토리 엑셀 다운로드 Mutation 훅
export const useWorkHistoryExcelDownloadMutation = () => {
  return useMutation<Blob, Error, WorkHistorySearchCondition | undefined>({
    mutationFn: (condition?: WorkHistorySearchCondition) => workApi.getWorkHistoryExcelDownload(condition)
  })
}

// 미등록 업무 시간 엑셀 다운로드 Mutation 훅
export const useUnregisteredWorkHistoryExcelDownloadMutation = () => {
  return useMutation<Blob, Error, UnregisteredWorkHistoryDownloadReq>({
    mutationFn: (params: UnregisteredWorkHistoryDownloadReq) => workApi.getUnregisteredWorkHistoryExcelDownload(params)
  })
}

// 시스템 체크 토글 Mutation 훅
export const useToggleSystemCheckMutation = () => {
  return useMutation<ToggleSystemCheckResp, Error, ToggleSystemCheckReq>({
    mutationFn: (data: ToggleSystemCheckReq) => workApi.toggleSystemCheck(data)
  })
}

// 시스템 타입 목록 조회 훅
export const useSystemTypesQuery = (options?: QuietOptions) => {
  return useQuery<TypeResp[]>({
    queryKey: ['system-types'],
    queryFn: () => typeApi.getSystemTypes(),
    meta: quietMeta(options)
  })
}

// Work Code Mutations
export const usePostCreateWorkCodeMutation = () => {
  const queryClient = useQueryClient()
  return useMutation<CreateWorkCodeResp, Error, CreateWorkCodeReq>({
    mutationFn: (data: CreateWorkCodeReq) => workApi.createWorkCode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workKeys.all() })
    }
  })
}

export const usePutUpdateWorkCodeMutation = () => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, UpdateWorkCodeReq>({
    mutationFn: (data: UpdateWorkCodeReq) => workApi.updateWorkCode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workKeys.all() })
    }
  })
}

export const useDeleteWorkCodeMutation = () => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: (workCodeId: number) => workApi.deleteWorkCode(workCodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workKeys.all() })
    }
  })
}
