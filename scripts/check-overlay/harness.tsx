/**
 * check-overlay.mjs 가 여는 시험 무대 — 개발 서버가 이 파일을 그대로 옮겨 그린다(운영 빌드에는 들어가지 않는다).
 * 주소의 ?scene= 으로 무대를 고르고, 시험이 부를 손잡이를 window.__check 에 건다.
 */
/* eslint-disable react-refresh/only-export-components -- 내보내지 않는 시험 진입 파일 */
import { useEffect, useState, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import '@/app/config/i18n'
import '@/index.css'
import { AppHistoryRouter } from '@/app/router/AppHistoryRouter'
import { RouteErrorBoundary } from '@/app/router/RouteErrorBoundary'
import { installChunkReload } from '@/app/chunk-reload'
import { BottomSheet, BottomSheetBody, BottomSheetContent, BottomSheetFooter } from '@/shared/ds/bottom-sheet'
import { Button } from '@/shared/ds/button'
import { keyboardToolbarReserve } from '@/shared/ds/overlay'
import { SnackbarProvider, useSnackbar } from '@/shared/ds/snackbar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ds/tooltip'
import { trackInputModality } from '@/shared/lib/input-modality'

declare global {
  interface Window {
    __check: Record<string, unknown>
  }
}

trackInputModality()
installChunkReload()

const scene = new URLSearchParams(window.location.search).get('scene') ?? 'sheet'
window.__check = { keyboardToolbarReserve, behindClicks: 0 }

function SheetScene() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  useEffect(() => {
    window.__check.navigate = navigate
  }, [navigate])
  return (
    <div className='flex min-h-dvh flex-col gap-x4 p-x4'>
      <p data-check='path'>{pathname}</p>
      <Button type='button' data-check='open' onClick={() => setOpen(true)}>
        열기
      </Button>
      <BottomSheet open={open} onOpenChange={setOpen}>
        <BottomSheetContent title='시험 시트' aria-describedby={undefined}>
          <BottomSheetBody>
            <input data-check='input' aria-label='내용' />
          </BottomSheetBody>
          <BottomSheetFooter>
            <Button type='button' className='w-full' onClick={() => setOpen(false)}>
              저장
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
      {/* 시트 뒤 화면의 단추 — 닫자마자 누른 첫 탭이 닿는지 본다 */}
      <button
        type='button'
        data-check='behind'
        className='fixed bottom-0 left-0 h-[56px] w-full'
        onClick={() => {
          window.__check.behindClicks = Number(window.__check.behindClicks) + 1
        }}
      >
        뒤 화면
      </button>
    </div>
  )
}

function Thrower({ chunk }: { chunk: boolean }): ReactNode {
  throw chunk ? new TypeError('Importing a module script failed.') : new Error('render failed')
}

function SnackbarScene() {
  const snackbar = useSnackbar()
  return (
    <Button type='button' onClick={() => snackbar.show({ message: '저장했어요' })}>
      알림
    </Button>
  )
}

function TooltipScene() {
  return (
    <div className='flex gap-x4 p-x10'>
      <Button type='button' data-check='press'>
        누르기
      </Button>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type='button' data-check='trigger'>
            도움말
          </Button>
        </TooltipTrigger>
        <TooltipContent>말풍선</TooltipContent>
      </Tooltip>
    </div>
  )
}

function Scene() {
  if (scene === 'boundary-error' || scene === 'boundary-chunk') {
    return (
      <AppHistoryRouter>
        <RouteErrorBoundary>
          <Thrower chunk={scene === 'boundary-chunk'} />
        </RouteErrorBoundary>
      </AppHistoryRouter>
    )
  }
  if (scene === 'snackbar') {
    return (
      <SnackbarProvider>
        <SnackbarScene />
      </SnackbarProvider>
    )
  }
  if (scene === 'tooltip') {
    return (
      <TooltipProvider>
        <TooltipScene />
      </TooltipProvider>
    )
  }
  return (
    <AppHistoryRouter>
      <Routes>
        <Route path='*' element={<SheetScene />} />
      </Routes>
    </AppHistoryRouter>
  )
}

createRoot(document.getElementById('root')!).render(<Scene />)
