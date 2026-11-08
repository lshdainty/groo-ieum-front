'use client'

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode, useRef } from 'react'

import { notifyReadFailure, notifyWriteFailure } from '@/shared/api/failure'
import { retryDelay, retryOnlyServerErrors } from '@/shared/api/retry'

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const queryClientRef = useRef<QueryClient>(undefined)

  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      // 쓰기 실패 — 호출처가 자기 글로 알리지 않은 것만 고정 글 Snackbar 로 알린다(shared/api/failure.ts)
      // 읽기 실패 — 화면이 자기 실패 글을 갖기 전의 임시 그물(shared/api/failure.ts)
      queryCache: new QueryCache({
        onError: (error) => notifyReadFailure(error),
      }),
      mutationCache: new MutationCache({
        onError: (error) => notifyWriteFailure(error),
      }),
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          // 불러오기 요청 제한 10초 · 다시 시도는 읽기만 2번까지 1초 · 2초 뒤(shared/api/request-budget.ts)
          retry: retryOnlyServerErrors,
          retryDelay,
        },
      },
    })
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}
