// User Types

export interface RoleDetailResp {
  role_code: string
  role_name: string
  permissions: PermissionDetailResp[]
}

export interface PermissionDetailResp {
  permission_code: string
  permission_name: string
}

export interface GetUserReq {
  user_id: string
}

export interface GetUserResp {
  user_id: string
  user_name: string
  user_email: string
  user_birth: string
  user_work_time: string
  join_date: string
  roles: RoleDetailResp[]
  user_roles: string[]
  user_role_name: string
  permissions: string[]
  user_company_type: string
  user_origin_company_name: string
  main_department_name_kr: string | null
  lunar_yn: string
  profile_url: string
  country_code: string
  invitation_token?: string
  invitation_sent_at?: string
  invitation_expires_at?: string
  invitation_status?: string
  registered_at?: string
  dashboard?: string
}

export interface GetUsersResp {
  user_id: string
  user_name: string
  user_email: string
  user_birth: string
  user_work_time: string
  join_date: string
  roles: RoleDetailResp[]
  user_roles: string[]
  user_role_name: string
  permissions: string[]
  user_company_type: string
  user_origin_company_name: string
  main_department_name_kr: string | null
  lunar_yn: string
  profile_url: string
  country_code: string
  invitation_token?: string
  invitation_sent_at?: string
  invitation_expires_at?: string
  invitation_status?: string
  registered_at?: string
  dashboard?: string
}

export interface GetUserApproversReq {
  user_id: string
}

export interface ApproverDetailResp {
  user_id: string
  user_name: string
  user_email: string
  roles: RoleDetailResp[]
  user_roles: string[]
  user_role_name: string
  permissions: string[]
  department_id: number
  department_name: string
  department_name_kr: string
  department_level: number
}

export interface GetUserApproversResp {
  approvers: ApproverDetailResp[]
  max_available_count: number
  is_auto_approval: boolean
}

export interface GetUserIdDuplicateReq {
  user_id: string
}

export interface GetUserIdDuplicateResp {
  duplicate: boolean
}

export interface PostUserReq {
  user_id: string
  user_name: string
  user_email: string
  user_birth: string
  user_company_type: string
  user_work_time: string
  lunar_yn: string
  profile_url: string
  profile_uuid: string
}

export interface PutUserReq {
  user_id: string // Path variable
  user_name: string
  user_email: string
  user_birth: string
  user_roles?: string[]
  user_company_type: string
  user_work_time: string
  lunar_yn: string
  profile_url: string
  profile_uuid?: string
  /** Y 면 지금 사진을 지운다 — 함께 온 새 사진은 무시(서버). 없으면 그대로 */
  profile_delete_yn?: 'Y' | 'N'
  country_code: string
  dashboard?: string
}

export interface PutInvitedUserReq {
  user_id: string
  user_name: string
  user_email: string
  user_company_type: string
  user_work_time: string
  join_date: string
  country_code: string
}

export interface PutInvitedUserResp {
  user_id: string
  user_name: string
  user_email: string
  user_company_type: string
  user_work_time: string
  join_date: string
  country_code: string
  user_roles: string[]
  invitation_sent_at: string
  invitation_expires_at: string
  invitation_status: string
}

export interface PostUserInviteReq {
  user_id: string
  user_name: string
  user_email: string
  user_company_type: string
  user_work_time: string
  join_date: string
  country_code: string
}

export interface PostUserInviteResp {
  user_id: string
  user_name: string
  user_email: string
  user_company_type: string
  user_work_time: string
  join_date: string
  country_code: string
  user_roles: string[]
  invitation_sent_at: string
  invitation_expires_at: string
  invitation_status: string
}

export interface UpdateDashboardReq {
  dashboard: string
}

export interface UpdateDashboardResp {
  user_id: string
  dashboard: string
}

export interface ResetPasswordReq {
  user_id: string
}

// 비밀번호 초기화 요청 (비로그인)
export interface RequestPasswordResetReq {
  user_id: string
  email: string
}

// 비밀번호 변경 (로그인 사용자)
export interface ChangePasswordReq {
  current_password: string
  new_password: string
  new_password_confirm: string
}
