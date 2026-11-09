// Vacation Policy entity types - Policy CRUD, assignment, user policies

export interface GetVacationPolicyReq {
  vacation_policy_id: number
}

export interface GetVacationPolicyResp {
  vacation_policy_id: number
  vacation_policy_name: string
  vacation_policy_desc: string
  vacation_type: string
  grant_method: string
  grant_time: number
  grant_time_str: string
  is_flexible_grant: string
  minute_grant_yn: string
  repeat_unit: string
  repeat_interval: number
  specific_months: number
  specific_days: number
  effective_type: string
  expiration_type: string
  repeat_grant_desc: string
  /** 지울 수 있는 정책인가("Y" · "N") — 서버 24-0 이후에만 온다. 칸이 없으면(옛 서버) Y 로 본다 */
  can_deleted?: 'Y' | 'N'
}

export interface GetVacationPoliciesResp {
  vacation_policy_id: number
  vacation_policy_name: string
  vacation_policy_desc: string
  vacation_type: string
  grant_method: string
  grant_time: number
  grant_time_str: string
  is_flexible_grant: string
  minute_grant_yn: string
  repeat_unit: string
  repeat_interval: number
  specific_months: number
  specific_days: number
  effective_type: string
  expiration_type: string
  repeat_grant_desc: string
  can_deleted?: 'Y' | 'N'
}

export interface UpdateVacationPolicyReq {
  vacation_policy_name: string
  vacation_policy_desc: string
}

export interface UpdateVacationPolicyResp {
  vacation_policy_id: number
}

export interface PostVacationPolicyReq {
  vacation_policy_name: string
  vacation_policy_desc: string
  vacation_type: string
  grant_method: string
  grant_time: number
  is_flexible_grant: string
  minute_grant_yn: string
  repeat_unit: string | null
  repeat_interval: number | null
  specific_months: number | null
  specific_days: number | null
  first_grant_date: string | null
  is_recurring: string
  max_grant_count: number | null
  effective_type: string
  expiration_type: string
  approval_required_count: number
}

export interface PostVacationPolicyResp {
  vacation_policy_id: number
}

export interface DeleteVacationPolicyResp {
  vacation_policy_id: number
}

export interface PostAssignVacationPoliciesToUserReq {
  user_id: string
  vacation_policy_ids: number[]
}

export interface PostAssignVacationPoliciesToUserResp {
  user_id: string
  assigned_vacation_policy_ids: number[]
}

export interface GetUserVacationPoliciesReq {
  user_id: string
  grant_method?: 'ON_REQUEST' | 'MANUAL_GRANT' | 'REPEAT_GRANT'
}

export interface GetUserVacationPoliciesResp {
  user_vacation_policy_id: number
  vacation_policy_id: number
  vacation_policy_name: string
  vacation_policy_desc: string
  vacation_type: string
  grant_method: string
  grant_time: number
  grant_time_str: string
  is_flexible_grant: string
  minute_grant_yn: string
  repeat_unit: string
  repeat_interval: number
  specific_months: number
  specific_days: number
  first_grant_date: string
  is_recurring: string
  approval_required_count: number
  max_grant_count: number
  effective_type: string
  expiration_type: string
  repeat_grant_desc: string
}

export interface GetUserAssignedVacationPoliciesReq {
  user_id: string
  vacation_type?: string
  grant_method?: string
}

export interface GetUserAssignedVacationPoliciesResp {
  vacation_policy_id: number
  vacation_policy_name: string
  vacation_policy_desc: string
  vacation_type: string
  grant_method: string
  grant_time: number
  grant_time_str: string
  is_flexible_grant: string
  minute_grant_yn: string
  repeat_unit: string | null
  repeat_interval: number | null
  specific_months: number | null
  specific_days: number | null
  effective_type: string
  expiration_type: string
  repeat_grant_desc: string | null
}

export interface VacationPolicyAssignmentInfo {
  vacation_policy_id: number
  vacation_policy_name: string
  vacation_policy_desc: string
  vacation_type: string
  grant_method: string
  grant_time: number
  grant_time_str: string
  is_flexible_grant: string
  minute_grant_yn: string
  repeat_unit: string
  repeat_interval: number
  specific_months: number
  specific_days: number
  effective_type: string
  expiration_type: string
  repeat_grant_desc: string
}

export interface GetUserVacationPolicyAssignmentStatusReq {
  user_id: string
}

export interface GetUserVacationPolicyAssignmentStatusResp {
  assigned_policies: VacationPolicyAssignmentInfo[]
  unassigned_policies: VacationPolicyAssignmentInfo[]
}

export interface DeleteRevokeVacationPolicyFromUserReq {
  user_id: string
  vacation_policy_id: number
}

export interface DeleteRevokeVacationPolicyFromUserResp {
  user_id: string
  vacation_policy_id: number
  user_vacation_policy_id: number
}

export interface DeleteRevokeVacationPoliciesFromUserReq {
  user_id: string
  vacation_policy_ids: number[]
}

export interface DeleteRevokeVacationPoliciesFromUserResp {
  user_id: string
  revoked_vacation_policy_ids: number[]
}
