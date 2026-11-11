export interface RoleResp {
  role_code: string
  role_name: string
  desc: string
  permissions: string[]
}

export interface CreateRoleReq {
  role_code: string
  role_name: string
  desc?: string
  permission_codes?: string[]
}

export interface UpdateRoleReq {
  /** 바꿀 때만 — 서버가 앞뒤 공백을 걷고, 빈 글 · 20자 초과는 400 */
  role_name?: string
  /** 바꿀 때만 — 빈 글이면 설명을 지운다 */
  desc?: string
  permission_codes?: string[]
}

export interface UpdateRolePermissionsReq {
  permission_codes: string[]
}

export interface RolePermissionReq {
  permission_code: string
}
