/*
 * 직접 누른 로그아웃의 표시(보안 점검 CLI-6) — 이음에서 로그아웃해도 그루 계정(SSO) 로그인은 이 브라우저에 남는다.
 * 표시가 있는 동안 로그인은 SSO 에 prompt=login 을 붙여 비밀번호를 다시 받는다 — 안 붙이면 살아 있는 SSO 로그인으로
 * 비밀번호 없이 다시 들어온다. 탭을 닫았다 열어도 남아야 해서 localStorage 다(복귀 경로 · PKCE 는 탭 안에서만 — sessionStorage).
 *  - 남긴다: 사용자가 직접 로그아웃했을 때 · 서버가 로그아웃한 SSO 로그인의 교환을 거절했을 때(AUTH_010)
 *            · 그 밖의 이유로 교환이 거절됐을 때(이음 회원이 아닌 그루 계정 등 — 같은 계정으로 맴돌지 않고 계정을 바꿀 수 있게)
 *  - 지운다: 인가코드 교환이 성공했을 때
 * 세션 만료로 로그인 화면에 온 것에는 남기지 않는다. 있고 없음만 본다 — 계정 정보를 담지 않는다.
 */

const LOGOUT_MARK_KEY = 'ieum_logged_out'

export const setLogoutMark = (): void => {
  try {
    localStorage.setItem(LOGOUT_MARK_KEY, '1')
  } catch {
    /* 저장소를 못 쓰면 표시 없이 간다 — 서버가 교환을 거절하면(AUTH_010) 콜백이 비밀번호를 다시 받게 한다 */
  }
}

export const clearLogoutMark = (): void => {
  try {
    localStorage.removeItem(LOGOUT_MARK_KEY)
  } catch {
    /* 저장소를 못 쓰면 지울 것도 없다 */
  }
}

export const hasLogoutMark = (): boolean => {
  try {
    return localStorage.getItem(LOGOUT_MARK_KEY) !== null
  } catch {
    return false
  }
}
