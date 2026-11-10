// Vacation entity types - Usage, history, approval, stats, grants, requests

// === Legacy types from @/types/vacation (merged) ===

export type VacationGrantMethod =
  | 'on_request'
  | 'after_annual'
  | 'on_joining'
  | 'admin_manual'
  | 'recurring'
  | 'by_tenure'

export type VacationUnit = 'day' | 'hour' | 'minute'
export type UsageUnit = 'all_at_once' | 'divisible'
export type SalaryType = 'paid' | 'unpaid' | 'partial'
export type Gender = 'all' | 'male' | 'female'
export type DocumentSubmission = 'before' | 'after' | 'none'
export type RecurringType = 'yearly' | 'monthly'

export interface VacationPolicy {
  id: string
  name: string
  description: string
  grantMethod: VacationGrantMethod
  grantUnit: VacationUnit
  grantAmount: number
  usageUnit: UsageUnit
  salaryType: SalaryType
  partialPaidDays?: number
  partialPaidPercentage?: number
  requireApproval: boolean
  approvers?: string[]
  references?: string[]
  availableGender: Gender
  expirationDate?: string
  includeHolidays: boolean
  excludedWorkTypes?: string[]
  excludedOrganizations?: string[]
  documentSubmission: DocumentSubmission
  documentDescription?: string
  recurringType?: RecurringType
  recurringStartDate?: string
  tenureMonths?: number
  applyToExisting: boolean
  isRequired: boolean
  createdAt: string
  updatedAt: string
}

export interface VacationConfig extends Omit<VacationPolicy, 'id' | 'createdAt' | 'updatedAt'> {}

// === API Request/Response types ===

export interface PostUseVacationReq {
  user_id: string
  vacation_type: string
  vacation_desc: string
  vacation_time_type: string
  start_date: string
  end_date: string
}

export interface PostUseVacationResp {
  vacation_usage_id: number
}

export interface GetUserVacationHistoryReq {
  user_id: string
  year: number
}

export interface VacationGrantInfo {
  vacation_grant_id: number
  vacation_type: string
  vacation_type_name: string
  vacation_grant_desc: string
  grant_time: number
  grant_time_str: string
  remain_time: number
  remain_time_str: string
  grant_date: string
  expiry_date: string
}

export interface VacationUsageInfo {
  vacation_usage_id: number
  vacation_usage_desc: string
  vacation_time_type: string
  vacation_time_type_name: string
  /** 쓴 휴가 종류(연차 · 보상휴가 …) — 서버 25-0 이 싣는다. 아직 없으면 undefined(옛 서버) */
  vacation_type?: string | null
  vacation_type_name?: string | null
  used_time: number
  used_time_str: string
  start_date: string
  end_date: string
}

export interface GetUserVacationHistoryResp {
  grants: VacationGrantInfo[]
  usages: VacationUsageInfo[]
}

export interface GetAllUsersVacationHistoryResp {
  user_id: string
  user_name: string
  grants: VacationGrantInfo[]
  usages: VacationUsageInfo[]
}

export interface GetAvailableVacationsReq {
  user_id: string
  start_date: string
}

export interface AvailableVacationByType {
  vacation_type: string
  vacation_type_name: string
  remain_time: number
  remain_time_str: string
}

export interface GetAvailableVacationsResp {
  total_remain_time: number
  total_remain_time_str: string
  vacations: AvailableVacationByType[]
}

export interface PutUpdateVacationUsageReq {
  vacation_usage_id: number
  user_id: string
  vacation_type: string
  vacation_desc: string
  vacation_time_type: string
  start_date: string
  end_date: string
}

export interface PutUpdateVacationUsageResp {
  vacation_usage_id: number
}

export interface GetVacationUsagesByPeriodReq {
  start_date: string
  end_date: string
}

export interface GetVacationUsagesByPeriodResp {
  user_id: string
  user_name: string
  vacation_usage_id: number
  vacation_usage_desc: string
  vacation_time_type: string
  vacation_time_type_name: string
  used_time: number
  start_date: string
  end_date: string
}

export interface GetUserVacationUsagesByPeriodReq {
  user_id: string
  start_date: string
  end_date: string
}

export interface GetUserVacationUsagesByPeriodResp {
  vacation_usage_id: number
  vacation_usage_desc: string
  vacation_time_type: string
  vacation_time_type_name: string
  used_time: number
  start_date: string
  end_date: string
}

export interface GetUserMonthlyVacationStatsReq {
  user_id: string
  year: string
}

export interface GetUserMonthlyVacationStatsResp {
  month: number
  used_time: number
  used_time_str: string
}

export interface GetUserVacationStatsReq {
  user_id: string
  base_date: string
}

export interface GetUserVacationStatsResp {
  remain_time: number
  remain_time_str: string
  used_time: number
  used_time_str: string
  expect_used_time: number
  expect_used_time_str: string
  prev_remain_time: number
  prev_remain_time_str: string
  prev_used_time: number
  prev_used_time_str: string
  prev_expect_used_time: number
  prev_expect_used_time_str: string
  remain_time_gap: number
  remain_time_gap_str: string
  used_time_gap: number
  used_time_gap_str: string
}

export interface PostManualGrantVacationReq {
  user_id: string
  vacation_policy_id: number
  grant_time: number
  grant_date: string | null
  expiry_date: string | null
  grant_desc: string
}

export interface PostManualGrantVacationResp {
  vacation_grant_id: number
  user_id: string
  vacation_policy_id: number
  grant_time: number
  grant_date: string
  expiry_date: string
}

export interface DeleteRevokeVacationGrantResp {
  vacation_grant_id: number
  user_id: string
}

export interface PostRequestVacationReq {
  user_id: string
  policy_id: number
  desc: string
  approver_ids: string[]
  request_start_time: string
  request_end_time: string | null
  request_desc: string
  grant_time?: number
}

export interface PostRequestVacationResp {
  vacation_grant_id: number
}

export interface PostApproveVacationReq {
  approval_id: number
  approver_id: string
}

export interface PostApproveVacationResp {
  approval_id: number
}

export interface PostRejectVacationReq {
  approval_id: number
  approver_id: string
  rejection_reason: string
}

export interface PostRejectVacationResp {
  approval_id: number
}

export interface GetAllVacationsByApproverReq {
  approver_id: string
  status?: string
}

export interface GetUserRequestedVacationsReq {
  user_id: string
}

export interface ApproverInfo {
  approval_id: number
  approver_id: string
  approver_name: string
  approval_order: number
  approval_status: string
  approval_status_name: string
  approval_date: string | null
  rejection_reason?: string
}

export interface GetUserRequestedVacationsResp {
  vacation_grant_id: number
  policy_id: number
  policy_name: string
  vacation_type: string
  vacation_type_name: string
  desc: string
  grant_time: number
  grant_time_str: string
  policy_grant_time: number
  policy_grant_time_str: string
  remain_time: number
  remain_time_str: string
  grant_date: string | null
  expiry_date: string | null
  request_start_time: string
  request_end_time: string | null
  request_desc: string
  grant_status: string
  grant_status_name: string
  create_date: string
  current_approver_id: string | null
  current_approver_name: string | null
  approvers: ApproverInfo[] | null
  applicant_id: string
  applicant_name: string
}

export interface GetUserRequestedVacationStatsReq {
  user_id: string
}

export interface GetUserRequestedVacationStatsResp {
  total_request_count: number
  current_month_request_count: number
  change_rate: number
  pending_count: number
  average_processing_days: number
  progress_count: number
  approved_count: number
  approval_rate: number
  rejected_count: number
  canceled_count: number
  acquired_vacation_time_str: string
  acquired_vacation_time: number
}

export interface PostCancelVacationRequestReq {
  vacation_grant_id: number
  user_id: string
}

export interface PostCancelVacationRequestResp {
  vacation_grant_id: number
}

export interface GetAllUsersVacationSummaryResp {
  user_id: string
  user_name: string
  department_name: string
  total_vacation_days: number
  total_vacation_days_str: string
  used_vacation_days: number
  used_vacation_days_str: string
  scheduled_vacation_days: number
  scheduled_vacation_days_str: string
  remaining_vacation_days: number
  remaining_vacation_days_str: string
}
