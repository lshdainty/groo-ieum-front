import type { TFunction, i18n as I18n } from 'i18next'

import type { PermissionResp } from '@/entities/permission'

/** 서버 permission code("VACATION:APPROVE") → [자원, 동작]. resource · action 칸이 아니라 코드로 본다(DB 의 action 칸은 코드 끝과 다른 줄이 있다 — VACATION:USE = WRITE) */
const split = (code: string): [string, string] => {
  const i = code.indexOf(':')
  return i < 0 ? [code, ''] : [code.slice(0, i), code.slice(i + 1)]
}

/**
 * 권한 줄 이름 — 한국어는 지금 쓰는 서버 name 그대로(이관에서 이름을 바꾸지 않는다), 영어는 웹이 코드 끝으로 만든다("View vacation").
 * 서버 name 이 비었으면(ko) 코드로 만든 이름으로, 자원 · 동작 글 키가 없는 새 코드는 서버 name(없으면 코드)으로 폴백한다.
 */
export function permissionTitle(p: PermissionResp, t: TFunction, i18n: I18n): string {
  const en = i18n.language?.startsWith('en')
  const server = p.name?.trim()
  if (!en && server) return server
  const [resource, action] = split(p.code)
  const rKey = `authority.resource.${resource}`
  const aKey = `authority.action.${action}`
  if (!i18n.exists(rKey, { ns: 'admin' }) || !i18n.exists(aKey, { ns: 'admin' })) return server || p.code
  const r = t(rKey)
  return t('authority.permName', { resource: en ? r.toLowerCase() : r, action: t(aKey) })
}

/** 설명 — 웹 키가 있는 코드만 해요체로 쓴다. 없으면 설명 줄을 그리지 않는다(서버 desc 의 "…권한입니다" 는 쓰지 않는다) */
export function permissionDesc(p: PermissionResp, t: TFunction, i18n: I18n): string | undefined {
  const key = `authority.permDesc.${p.code.replace(':', '_')}`
  return i18n.exists(key, { ns: 'admin' }) ? t(key) : undefined
}
