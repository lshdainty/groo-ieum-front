import { isAxiosError } from 'axios'

import { claimFailure, writeFailureKey } from '@/shared/api/failure'

/**
 * 폼 저장 실패를 읽는다 — 실패를 이 폼이 가져가고(그물 Snackbar 중복 없음), 서버 코드(사유 표)와 맨 위 Callout 글 키(common)를 돌려준다.
 * 서버 글은 쓰지 않는다. 코드로 가를 수 있는 것(아이디 · 이메일 중복)은 호출처가 그 칸 아래에 둔다.
 */
export function readWriteFailure(error: unknown): { code: string | null; key: string | null } {
  claimFailure(error)
  const raw = isAxiosError(error) ? (error.response?.data as { code?: unknown } | undefined)?.code : undefined
  return { code: typeof raw === 'string' ? raw : null, key: writeFailureKey(error) }
}
