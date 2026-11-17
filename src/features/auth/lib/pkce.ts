/**
 * OAuth 2.0 PKCE (Proof Key for Code Exchange) 유틸.
 * - code_verifier: 43~128자 base64url 랜덤 (crypto.getRandomValues)
 * - code_challenge: base64url(SHA-256(code_verifier)) — S256
 * - state: CSRF 방어용 랜덤
 *
 * SSO 로그인 시작 시 verifier/state 를 만들어 sessionStorage 에 잠깐 보관하고,
 * 콜백(?code=)에서 token 교환에 사용한 뒤 즉시 삭제한다(영구 저장 금지).
 * 이번 시도를 prompt=login(비밀번호 다시 받기)으로 보냈는지도 같이 적어 두고 같이 지운다 —
 * 콜백이 같은 거절(AUTH_010)에 맴돌지 않게 하는 표시다(보안 점검 CLI-6).
 */

const VERIFIER_KEY = 'pkce_code_verifier'
const STATE_KEY = 'pkce_state'
const REAUTH_KEY = 'pkce_reauth'

/** Uint8Array → base64url (padding 제거). */
function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** code_verifier 생성 (32바이트 → base64url ≈ 43자). */
export function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return toBase64Url(bytes)
}

/** code_challenge = base64url(SHA-256(verifier)). */
export async function codeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return toBase64Url(new Uint8Array(digest))
}

/** state 생성 (16바이트 → base64url). */
export function generateState(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return toBase64Url(bytes)
}

/** reauth — 이번 시도를 prompt=login 으로 보낸다(지난 시도의 표시는 덮어쓴다). */
export function savePkce(verifier: string, state: string, reauth: boolean = false): void {
  sessionStorage.setItem(VERIFIER_KEY, verifier)
  sessionStorage.setItem(STATE_KEY, state)
  if (reauth) sessionStorage.setItem(REAUTH_KEY, '1')
  else sessionStorage.removeItem(REAUTH_KEY)
}

/** 이번 시도를 prompt=login 으로 보냈는가 — clearPkce 앞에서 읽는다. */
export function wasReauthRequested(): boolean {
  return sessionStorage.getItem(REAUTH_KEY) !== null
}

export function getCodeVerifier(): string | null {
  return sessionStorage.getItem(VERIFIER_KEY)
}

export function getSavedState(): string | null {
  return sessionStorage.getItem(STATE_KEY)
}

export function clearPkce(): void {
  sessionStorage.removeItem(VERIFIER_KEY)
  sessionStorage.removeItem(STATE_KEY)
  sessionStorage.removeItem(REAUTH_KEY)
}
