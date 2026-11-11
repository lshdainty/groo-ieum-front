import { isAxiosError } from 'axios'

import { FAILURE_CODE_KEYS, isPasswordChangeRequiredResponse } from '@/shared/api/failure-codes'

/*
 * 쓰기(POST · PUT · PATCH · DELETE) 실패 안내 — 서버 글 · axios 영어 글은 화면에 그리지 않고 고정 글로만 말한다.
 *
 * 호출처가 자기 실패 안내를 갖고 있으면 그 자리에서 claimFailure(error) 로 가져간다 — 가져가지 않은 쓰기 실패만
 * QueryProvider 의 MutationCache 가 이 고정 글 Snackbar 로 알린다(조용히 실패하는 쓰기가 없게 하는 마지막 그물).
 * 읽기(GET) 실패는 늘 조용하다 — 그 화면이 자리에서 그린다.
 */

const claimed = new WeakSet<object>()

/** 호출처가 이 실패를 자기 글로 알렸다 — 그물이 같은 실패를 다시 알리지 않는다 */
export const claimFailure = (error: unknown): void => {
  if (typeof error === 'object' && error !== null) claimed.add(error)
}

export const isClaimed = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && claimed.has(error)

/** 브라우저가 오프라인이라고 안다 — 이때 응답 없는 쓰기는 서버에 닿지 않은 것이다 */
const isOffline = (): boolean => typeof navigator !== 'undefined' && navigator.onLine === false

/**
 * 쓰기 실패의 안내 글 키(common 이름공간) — 없으면 알리지 않는다(401 은 로그인으로 넘어가는 길이 따로 있다).
 *  - 403 → 권한 글 · 응답을 못 받음 → "저장됐는지 확인하지 못했어요"(서버에 닿았는지 모른다) · 오프라인 → 일반 실패(닿지 않았다)
 *  - 응답 code 가 사유 표(failure-codes.ts)에 있으면 그 글(사유를 코드로 고른다 — 서버 글은 쓰지 않는다)
 *  - 4xx → "입력한 내용을 확인해주세요"(다시 해도 같은 결과라 다시 시도 문구를 쓰지 않는다) · 5xx 그 밖 → "잠시 뒤 다시 시도해주세요"
 */
export const writeFailureKey = (error: unknown): string | null => {
  if (!isAxiosError(error)) return 'failure.write'
  const status = error.response?.status
  if (status === 401) return null
  // 비밀번호 변경 필요 — 강제 변경 화면으로 보내는 길(base.ts)이 있어 권한 글을 띄우지 않는다
  if (isPasswordChangeRequiredResponse(status, error.response?.data)) return null
  if (status === undefined) {
    // 오프라인이면 요청이 서버에 닿지 않았다 — 됐는지 모르는 게 아니라 안 된 것이라 "잠시 뒤 다시 시도"(확인창은 [다시 시도]) 글이다
    // (alert-dialog.md "요청이 실패하면" — 네트워크(요청이 닿지 않음)는 다시 시도, 응답을 받지 못함은 확인하지 못했어요)
    if (isOffline()) return 'failure.write'
    return 'failure.unconfirmed'
  }
  if (status === 403) return 'failure.forbidden'
  const code = (error.response?.data as { code?: unknown } | undefined)?.code
  if (typeof code === 'string' && FAILURE_CODE_KEYS[code]) return FAILURE_CODE_KEYS[code]
  return status >= 400 && status < 500 ? 'failure.writeInput' : 'failure.write'
}

export const isReadRequest = (method: string | undefined): boolean =>
  ['get', 'head', 'options'].includes((method ?? 'get').toLowerCase())

type Handler = (key: string) => void
let handler: Handler | null = null

/** 앱 맨 위 WriteFailureBridge 가 Snackbar 로 잇는다 — 글 키(common 이름공간)를 받는다 */
export const setWriteFailureHandler = (next: Handler | null): (() => void) => {
  handler = next
  return () => {
    if (handler === next) handler = null
  }
}

// 호출처의 onError(mutate 옵션)는 캐시의 onError 보다 한 박자 늦게 불린다 — 가져갔는지 보려고 잠깐 기다린다
const CLAIM_WAIT_MS = 120

export const notifyWriteFailure = (error: unknown): void => {
  if (isClaimed(error)) return
  window.setTimeout(() => {
    if (isClaimed(error)) return
    const key = writeFailureKey(error)
    if (key) handler?.(key)
  }, CLAIM_WAIT_MS)
}

/*
 * 읽기(GET) 실패 임시 그물 — 정식 자리는 그 화면의 Result Section(실패 + 다시 시도)이다(DESIGN.hr.md). 화면이 아직 자기 실패 글을 갖지 않은
 * 이음 화면(I-23 ~ I-25 가 옮기기 전)이 조용히 빈 화면이 되지 않게, 마지막 시도까지 실패한 읽기를 고정 글 Snackbar 로 한 번 알린다
 * (재시도마다 띄우지 않는다 — QueryCache 는 마지막 실패만 알리고, 같은 때 여러 쿼리가 실패해도 8초에 한 번).
 * 화면마다 Result Section 으로 옮기면서 QueryProvider 의 queryCache 줄과 함께 걷는다.
 */
const READ_QUIET_MS = 8000
let lastReadNoticeAt = 0

export const notifyReadFailure = (error: unknown): void => {
  // 401 은 로그인으로 보내는 길이 따로 있다
  if (isAxiosError(error) && error.response?.status === 401) return
  if (isAxiosError(error) && isPasswordChangeRequiredResponse(error.response?.status, error.response?.data)) return
  const now = Date.now()
  if (now - lastReadNoticeAt < READ_QUIET_MS) return
  lastReadNoticeAt = now
  handler?.('failure.read')
}
