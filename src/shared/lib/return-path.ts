/*
 * 로그인 뒤 돌아갈 자리(복귀 경로) — 주소를 직접 열었을 때(새로고침 · 북마크) 원래 열려던 화면으로 돌아오게 한다.
 * 오픈 리다이렉트를 막는다: 같은 출처의 경로만 받는다 — "/" 로 시작하고, "//" · "/\" · 스킴 · 제어 문자가 없어야 한다.
 * 로그인 화면(/login) · 콜백(/auth/callback) · 비밀번호 변경(/password-change)은 돌아갈 곳이 아니다(되돌아 도는 길).
 */

const RETURN_KEY = 'ieum_return_path'
const NEVER_RETURN = ['/login', '/auth/callback', '/password-change']

/** 안전한 같은 출처 경로면 그대로(경로 + 검색 + 해시), 아니면 null */
export const safeReturnPath = (raw: string | null | undefined): string | null => {
  if (typeof raw !== 'string' || raw === '' || raw.length > 2048) return null
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return null
  // 제어 문자 · 역슬래시(브라우저가 "/" 로 읽는다) · 스킴이 들어 있으면 거절
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\\]/.test(raw)) return null
  let url: URL
  try {
    url = new URL(raw, window.location.origin)
  } catch {
    return null
  }
  if (url.origin !== window.location.origin) return null
  if (NEVER_RETURN.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))) return null
  return `${url.pathname}${url.search}${url.hash}`
}

/** `/login` 주소 — 돌아갈 자리가 있으면 `?next=` 로 싣는다 */
export const loginPathFor = (returnTo: string | null | undefined): string => {
  const safe = safeReturnPath(returnTo)
  return safe && safe !== '/' && safe !== '/dashboard' ? `/login?next=${encodeURIComponent(safe)}` : '/login'
}

/** 로그인 화면이 SSO 로 떠나기 전에 보관한다(없으면 이전 값을 지운다) */
export const saveReturnPath = (path: string | null): void => {
  try {
    if (path) sessionStorage.setItem(RETURN_KEY, path)
    else sessionStorage.removeItem(RETURN_KEY)
  } catch {
    /* 저장소를 못 쓰면 기본 화면(/dashboard)으로 */
  }
}

/** 콜백이 한 번 꺼내 쓴다 — 꺼내면 지운다. 안전하지 않은 값이면 null */
export const takeReturnPath = (): string | null => {
  try {
    const value = sessionStorage.getItem(RETURN_KEY)
    sessionStorage.removeItem(RETURN_KEY)
    return safeReturnPath(value)
  } catch {
    return null
  }
}
