import { config } from '@/shared/config'
import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { ApiErrorResponse } from '@/shared/types/api'
import { beginAttempt, endChain } from '@/shared/api/request-budget'
import { isPasswordChangeRequiredResponse } from '@/shared/api/failure-codes'
import { loginPathFor } from '@/shared/lib/return-path'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** 401 이어도 /login 으로 보내지 않는다 — 세션 확인(/login/check)은 호출처가 복귀 경로를 붙여 보낸다 */
    skipAuthRedirect?: boolean
  }
}

const baseURL = config.apiBaseUrl

export const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // i18n 언어 설정을 Accept-Language 헤더로 전달 (서버 다국어 지원)
    const language = localStorage.getItem('i18nextLng')
    if (language) {
      config.headers['Accept-Language'] = language
    }

    // 불러오기는 처음 요청부터 다시 시도까지 합쳐 10초 안에 끝낸다(request-budget.ts)
    beginAttempt(config)

    return config
  },
  (err: AxiosError) => {
    return Promise.reject(err)
  }
)

/*
 * 응답 인터셉터 — 알림을 띄우지 않는다(전역 서버 원문 토스트 없음, DESIGN.hr.md 전역 오류 토스트 걷기).
 *  - 401 은 /login 으로 보낸다(세션 만료).
 *  - 그 밖의 실패는 그대로 호출처에 던진다. 읽기(GET)는 그 화면이 자리에서 말하고, 쓰기(POST · PUT · PATCH · DELETE)는
 *    호출처가 자기 고정 글로 알리거나, 아무도 안 알렸으면 QueryProvider 의 쓰기 실패 안내(고정 글 Snackbar)가 맡는다.
 *  - 서버 글 · axios 영어 글은 화면에 그리지 않는다.
 */
apiClient.interceptors.response.use(
  (resp: AxiosResponse) => {
    endChain(resp.config)
    // 성공 응답은 그대로 data 부분만 반환
    return resp.data
  },
  async (err: AxiosError<ApiErrorResponse>) => {
    // 401 Unauthorized(세션 만료) 에러 발생 시 로그인 페이지로 리다이렉트 — 열려 있던 화면을 복귀 경로로 싣는다
    if (err.response?.status === 401 && !err.config?.skipAuthRedirect) {
      // 현재 페이지가 로그인/콜백 페이지가 아닐 때만 리다이렉트
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/auth/callback')) {
        window.location.href = loginPathFor(`${window.location.pathname}${window.location.search}${window.location.hash}`)
      }
    }
    // 403 PASSWORD_CHANGE_REQUIRED — 임시 비밀번호를 먼저 바꿔야 한다. 로그인 화면이 아니라 강제 변경 화면으로 보낸다
    // (그 화면의 서버 판정이 Y 이므로 새로 불러도 /password-change 에 머문다). 이미 그 화면이거나 로그인 · 콜백이면 그대로 둔다.
    if (isPasswordChangeRequiredResponse(err.response?.status, err.response?.data)) {
      const path = window.location.pathname
      if (!path.includes('/password-change') && !path.includes('/login') && !path.includes('/auth/callback')) {
        window.location.href = '/password-change'
      }
    }
    return Promise.reject(err)
  }
)
