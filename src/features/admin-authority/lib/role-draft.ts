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

/** 어느 요청이 필요한가 — 이름은 서버가 바꾸지 않는다(PUT 은 설명 · 권한만). 설명이 바뀌었으면 역할 수정, 권한이 바뀌었으면 권한 수정 */
export const changesOf = (base: RoleDraft, now: RoleDraft): { desc: boolean; perms: boolean } => ({
  desc: base.desc !== now.desc,
  perms: !same(base.perms, now.perms),
})

/** 서버 resource 코드 → 화면 글 키(admin). 모르는 코드는 호출처가 코드 그대로 둔다 */
export const RESOURCE_KEYS = ['USER', 'VACATION', 'WORK', 'SCHEDULE', 'COMPANY', 'DEPARTMENT', 'HOLIDAY', 'DUES', 'REGULATION', 'NOTICE', 'ROLE', 'PERMISSION']
