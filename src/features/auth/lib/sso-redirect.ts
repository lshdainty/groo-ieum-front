import { config } from '@/shared/config'
import { hasLogoutMark } from '@/shared/lib/logout-mark'
import { codeChallenge, generateCodeVerifier, generateState, savePkce } from '@/features/auth/lib/pkce'

/*
 * SSO(그루 계정)로 떠나는 길 둘 — 로그인 시작 · 그루 계정 로그아웃. 둘 다 최상위 이동이다.
 */

/**
 * SSO 로그인을 시작한다(PKCE 인가코드 흐름) — code_verifier/state 를 새로 만들어 보관하고
 * code_challenge(S256) 를 인가 요청에 붙여 떠난다.
 *
 * 직접 로그아웃한 표시가 있거나(logout-mark.ts) reauth 를 주면 prompt=login 을 붙인다 — SSO 가 살아 있는
 * 로그인을 쓰지 않고 비밀번호를 다시 받는다(보안 점검 CLI-6). 붙였는지는 이번 시도에 적어 둔다(pkce.ts).
 * reauth 는 표시를 못 남기는 브라우저(저장소 차단)에서도 콜백의 다시 시작이 꼭 prompt=login 으로 가게 한다.
 */
export const startSsoLogin = async (options: { reauth?: boolean } = {}): Promise<void> => {
  const reauth = options.reauth === true || hasLogoutMark()
  const verifier = generateCodeVerifier()
  const state = generateState()
  savePkce(verifier, state, reauth)
  const challenge = await codeChallenge(verifier)
  const query = new URLSearchParams({
    redirect_uri: `${window.location.origin}/auth/callback`,
    client_id: 'hr',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  })
  if (reauth) query.set('prompt', 'login')
  window.location.href = `${config.ssoUrl}/login?${query.toString()}`
}

/**
 * 그루 계정(SSO)에서도 로그아웃한다 — SSO 의 로그아웃 경유지를 들렀다가 로그인 화면(`/login?out=all`)으로 돌아온다.
 * SSO 쿠키는 최상위 이동에만 실리고, 돌아올 주소는 같은 사이트(hangroo.io · localhost)여야 SSO 가 받아 준다.
 */
export const startSsoLogout = (): void => {
  const returnUrl = `${window.location.origin}/login?out=all`
  window.location.href = `${config.ssoUrl}/logout?redirect_uri=${encodeURIComponent(returnUrl)}`
}
