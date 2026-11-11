import type { RoleResp } from '@/entities/role'

/** 역할 상세에서 고치는 값 — 이름 · 설명 · 권한을 한 면에서 고치고 [저장] 하나로 보낸다 */
export interface RoleDraft {
  code: string
  name: string
  desc: string
  perms: string[]
}

export const draftOf = (role: RoleResp): RoleDraft => ({ code: role.role_code, name: role.role_name, desc: role.desc ?? '', perms: [...role.permissions] })

export const EMPTY_DRAFT: RoleDraft = { code: '', name: '', desc: '', perms: [] }

const same = (a: string[], b: string[]): boolean => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|')

/** 역할 이름 상한 — 서버 roles.role_name 길이 20(넘으면 400) */
export const ROLE_NAME_MAX = 20

/**
 * 어느 요청이 필요한가 — 이름 · 설명이 바뀌었으면 역할 수정(바뀐 칸만), 권한이 바뀌었으면 권한 수정.
 * 이름은 서버가 앞뒤 공백을 걷으므로 걷은 값으로 견준다. 설명은 비워도 된다(빈 글을 보내면 서버가 설명을 지운다).
 */
export const changesOf = (base: RoleDraft, now: RoleDraft): { name: boolean; desc: boolean; perms: boolean } => ({
  name: base.name !== now.name.trim(),
  desc: base.desc !== now.desc,
  perms: !same(base.perms, now.perms),
})

/** 서버 resource 코드 → 화면 글 키(admin). 모르는 코드는 호출처가 코드 그대로 둔다 */
export const RESOURCE_KEYS = ['USER', 'VACATION', 'WORK', 'SCHEDULE', 'COMPANY', 'DEPARTMENT', 'HOLIDAY', 'DUES', 'REGULATION', 'NOTICE', 'ROLE', 'PERMISSION']
