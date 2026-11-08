import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types/api'
import type { GetLoginCheck, TokenExchangeResponse } from '@/entities/session/model/types'

export const sessionApi = {
  /**
   * OAuth2 인가코드(code)를 HR 토큰으로 교환 (PKCE)
   * SSO 로그인 후 받은 일회용 code 와 code_verifier 로 HR JWT(HttpOnly 쿠키)를 발급받습니다.
   */
  exchangeCode: async (params: {
    code: string
    codeVerifier: string
    redirectUri: string
  }): Promise<TokenExchangeResponse> => {
    const resp: ApiResponse<TokenExchangeResponse> = await apiClient.request({
      method: 'post',
      url: `/auth/exchange-code`,
      data: params
    })

    if (!resp.success) throw new Error(resp.message)

    return resp.data
  },

  /**
   * 로그아웃 (HttpOnly 쿠키 삭제)
   */
  logout: async (): Promise<void> => {
    await apiClient.request({
      method: 'post',
      url: `/auth/logout`
    })
  },

  /**
   * 로그인 사용자 정보 조회 (HttpOnly 쿠키 기반)
   * JWT 토큰이 쿠키로 자동 전송되어 사용자 정보를 조회합니다.
   */
  getLoginCheck: async (): Promise<GetLoginCheck> => {
    const resp: ApiResponse<GetLoginCheck> = await apiClient.request({
      method: 'get',
      url: `/login/check`,
      // 세션 확인의 401 은 "로그인 안 됨" 이라는 답이다 — 앱이 복귀 경로를 붙여 /login 으로 보낸다
      skipAuthRedirect: true,
    })

    if (!resp.success) throw new Error(resp.message)

    return resp.data
  },
}
