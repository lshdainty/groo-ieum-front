import { EnvWatermark } from '@/shared/ui/env-watermark/EnvWatermark'
import { ThemeProvider } from '@/shared/ui/theme/theme-provider'
import { LoadingAnnouncer } from '@/shared/ds/skeleton'
import { SnackbarProvider } from '@/shared/ds/snackbar'
import { TooltipProvider } from '@/shared/ds/tooltip'
import { PermissionProvider } from '@/entities/session'
import { UserProvider } from '@/entities/session'
import { apiClient } from '@/shared/api'
import { QueryProvider, WriteFailureBridge } from '@/app/providers'
import { AppRouter } from '@/app/router'
import { BrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
/*
  react19에서 antd 호환성 해결
  https://ant.design/docs/react/v5-for-19
*/
import '@ant-design/v5-patch-for-react-19'

// interceptor 초기화를 위해 api import 유지
void apiClient

// ds 카탈로그 — 개발 서버 전용(/dev/ds). 로그인 없이 열리고, 운영 빌드에는 import 자체가 지워진다
const DsCatalogPage = import.meta.env.DEV
  ? lazy(() => import('@/shared/ds/catalog/CatalogPage').then((m) => ({ default: m.CatalogPage })))
  : null

export function App() {
  if (DsCatalogPage && window.location.pathname === '/dev/ds') {
    return (
      <Suspense fallback={null}>
        <DsCatalogPage />
      </Suspense>
    )
  }

  return (
    <ThemeProvider defaultTheme='system' storageKey='vite-ui-theme'>
      <EnvWatermark />
      <QueryProvider>
        <SnackbarProvider>
          <TooltipProvider>
            {/* 불러오는 중 상태 글 — 앱 맨 위에 한 번(skeleton.md). 스켈레톤이 마운트하며 여기에 알린다 */}
            <LoadingAnnouncer>
              <WriteFailureBridge />
              <BrowserRouter basename='/'>
                <UserProvider>
                  <PermissionProvider>
                    <AppRouter />
                  </PermissionProvider>
                </UserProvider>
              </BrowserRouter>
            </LoadingAnnouncer>
          </TooltipProvider>
        </SnackbarProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
