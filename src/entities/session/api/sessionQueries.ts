'use client'

import { useQuery } from '@tanstack/react-query'

import { createQueryKeys } from '@/shared/api/queryKeys'
import { sessionApi } from '@/entities/session/api/sessionApi'
import type { GetLoginCheck } from '@/entities/session/model/types'

export const authKeys = createQueryKeys('auth')

// 로그인 상태 체크 훅 (JWT 토큰으로 사용자 정보 조회)
export const useLoginCheckQuery = (enabled: boolean = true) => {
  return useQuery<GetLoginCheck>({
    queryKey: authKeys.detail('login-check'),
    queryFn: () => sessionApi.getLoginCheck(),
    retry: false,
    enabled,
    // 실패는 앱 틀 밖 "로그인 상태를 확인하지 못했어요" 화면이 말한다 — 읽기 그물 Snackbar 를 겹치지 않는다
    meta: { quiet: true },
  })
}
