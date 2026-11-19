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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/shared/ds/alert-dialog'
import { BottomSheet, BottomSheetBody, BottomSheetContent, BottomSheetFooter } from '@/shared/ds/bottom-sheet'
import { Button, ResponsivePair } from '@/shared/ds/button'
import { Dialog, DialogBody, DialogContent, DialogFooter } from '@/shared/ds/dialog'
import { HelpBubble, HelpBubbleContent, HelpBubbleTrigger } from '@/shared/ds/help-bubble'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ds/popover'
import { MenuSheet, MenuSheetContent, MenuSheetGroup, MenuSheetItem } from '@/shared/ds/menu-sheet'
import { SidePanel, SidePanelBody, SidePanelContent } from '@/shared/ds/side-panel'
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

const params = new URLSearchParams(window.location.search)
const scene = params.get('scene') ?? 'sheet'
// ?font= — 글자 크기 배율(html font-size, 처음부터)
if (params.get('font')) document.documentElement.style.fontSize = `${Number(params.get('font')) * 100}%`
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

// 키보드가 뜬 채 닫기(담다 #631 — overlay/close-after-keyboard.ts · release-press.ts). 처음부터 연 표면 하나 — 폼 시트, ?dialog 면
// 대화상자(폼 대화상자는 [×] 가 없어 폼이 아닌 것) — 와 입력 칸 · 뒤 화면 경로. ?dirty 면 바뀐 값이 있다. 실제로 닫힌 횟수는
// window.__check.closes, 표면을 내리는 손잡이는 window.__check.unmount(기다리는 동안 내려가면 늦게 닫지 않는지 본다)
function KeyboardScene() {
  const params = new URLSearchParams(window.location.search)
  const dialog = params.has('dialog')
  const dirty = params.has('dirty')
  const [open, setOpen] = useState(true)
  const [mounted, setMounted] = useState(true)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  useEffect(() => {
    window.__check.closes = 0
    window.__check.unmount = () => setMounted(false)
  }, [])
  useEffect(() => {
    window.__check.navigate = navigate
  }, [navigate])
  const onOpenChange = (next: boolean) => {
    if (!next) window.__check.closes = Number(window.__check.closes) + 1
    setOpen(next)
  }
  const field = <input data-check='input' aria-label='내용' />
  return (
    <div className='flex min-h-dvh flex-col gap-x4 p-x4'>
      <p data-check='path'>{pathname}</p>
      {mounted &&
        (dialog ? (
          <Dialog dirty={dirty} open={open} onOpenChange={onOpenChange}>
            <DialogContent title='메모' aria-describedby={undefined}>
              <DialogBody>{field}</DialogBody>
            </DialogContent>
          </Dialog>
        ) : (
          <BottomSheet form dirty={dirty} open={open} onOpenChange={onOpenChange}>
            <BottomSheetContent title='업무 추가' aria-describedby={undefined}>
              <BottomSheetBody>{field}</BottomSheetBody>
            </BottomSheetContent>
          </BottomSheet>
        ))}
    </div>
  )
}

// 딤이 열린 동안 body 바탕(src/index.css) — 앱 틀(Layout 의 h-svh 틀과 같은 불투명 본문)을 깔고 표면을 window.__check.dim 으로 연다.
// short 면 틀을 화면보다 짧게 둔다(body 상자 밖 — html 바탕이 보이는 곳 — 도 모습이 그대로인지 본다).
// panel 은 폰 주 메뉴 서랍(왼쪽 Side Panel) — [×] 로 닫을 수 있고, 뒤 화면 바닥 단추로 닫은 직후 첫 탭을 본다
type DimState = { sheet: boolean; inner: boolean; menu: boolean; dialog: boolean; ask: boolean; stage: boolean; panel: boolean }
const DIM_CLOSED: DimState = { sheet: false, inner: false, menu: false, dialog: false, ask: false, stage: false, panel: false }

function DimScene() {
  const [s, setS] = useState(DIM_CLOSED)
  const [stage, setStage] = useState<HTMLDivElement | null>(null)
  const short = new URLSearchParams(window.location.search).has('short')
  useEffect(() => {
    window.__check.dim = (next: Partial<DimState>) => setS((prev) => ({ ...prev, ...next }))
  }, [])
  const none = () => {}
  return (
    <div className={short ? 'flex h-[300px]' : 'flex h-svh'}>
      <div className='flex min-w-0 flex-1 flex-col gap-x4 overflow-hidden bg-bg-layer-basement p-x4'>
        <p>뒤 화면</p>
        {/* 카탈로그 무대처럼 body 바로 아래가 아닌 자리 */}
        <div ref={setStage} data-check='stage' className='relative h-[120px] overflow-hidden' />
      </div>
      <BottomSheet open={s.sheet} onOpenChange={none}>
        <BottomSheetContent title='시험 시트' aria-describedby={undefined}>
          <BottomSheetBody>
            <input aria-label='내용' />
          </BottomSheetBody>
          <BottomSheet open={s.inner} onOpenChange={none}>
            <BottomSheetContent title='위 시트' aria-describedby={undefined}>
              <BottomSheetBody>위</BottomSheetBody>
            </BottomSheetContent>
          </BottomSheet>
        </BottomSheetContent>
      </BottomSheet>
      <MenuSheet open={s.menu} onOpenChange={none}>
        <MenuSheetContent title='메뉴'>
          <MenuSheetGroup>
            <MenuSheetItem label='고치기' />
          </MenuSheetGroup>
        </MenuSheetContent>
      </MenuSheet>
      <Dialog open={s.dialog} onOpenChange={none}>
        <DialogContent title='메모' size='medium'>
          <DialogBody>본문</DialogBody>
        </DialogContent>
      </Dialog>
      <AlertDialog open={s.ask} onOpenChange={none}>
        <AlertDialogContent>
          <AlertDialogTitle>그만 쓸까요?</AlertDialogTitle>
          <AlertDialogDescription>쓰던 내용은 사라져요.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>계속 쓰기</AlertDialogCancel>
            <AlertDialogAction>그만 쓰기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <SidePanel open={s.panel} onOpenChange={(panel) => setS((prev) => ({ ...prev, panel }))}>
        <SidePanelContent side='left' title='그루 이음'>
          <SidePanelBody scrollFog>
            <p>주 메뉴</p>
          </SidePanelBody>
        </SidePanelContent>
      </SidePanel>
      {/* 서랍 뒤 화면의 단추 — 닫자마자 누른 첫 탭이 닿는지 본다 */}
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
      {stage && (
        <BottomSheet open={s.stage} onOpenChange={none} modal={false} container={stage}>
          <BottomSheetContent title='견본' aria-describedby={undefined}>
            <BottomSheetBody>본문</BottomSheetBody>
          </BottomSheetContent>
        </BottomSheet>
      )}
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

// 머리 단추 자리(담다 #652 · groo-design #263) — ?surface= 하나를 처음부터 열어 둔다. 제목은 큰 글자에서 두 줄이 되게 길게
const LONG_TITLE = '연차 사용 규정과 결재 순서를 함께 보는 안내'
function HeaderScene() {
  const surface = params.get('surface') ?? 'dialog'
  const noop = () => {}
  if (surface === 'dialog')
    return (
      <Dialog open onOpenChange={noop}>
        <DialogContent title={LONG_TITLE} aria-describedby={undefined}>
          <DialogBody>본문</DialogBody>
        </DialogContent>
      </Dialog>
    )
  if (surface === 'dialog-back')
    return (
      <Dialog open onOpenChange={noop}>
        <DialogContent title={LONG_TITLE} onBack={noop} headerAction={<Button variant='ghost' size='small' layout='iconOnly' aria-label='더 보기' data-check='action'><svg /></Button>} aria-describedby={undefined}>
          <DialogBody>본문</DialogBody>
        </DialogContent>
      </Dialog>
    )
  if (surface === 'sheet')
    return (
      <BottomSheet open onOpenChange={noop}>
        <BottomSheetContent title={LONG_TITLE} onBack={noop} aria-describedby={undefined}>
          <BottomSheetBody>본문</BottomSheetBody>
        </BottomSheetContent>
      </BottomSheet>
    )
  if (surface === 'popover')
    return (
      <Popover open>
        <PopoverTrigger asChild>
          <Button>열기</Button>
        </PopoverTrigger>
        <PopoverContent title={LONG_TITLE}>본문</PopoverContent>
      </Popover>
    )
  if (surface === 'bubble')
    return (
      <div className='p-x16'>
        <HelpBubble defaultOpen>
          <HelpBubbleTrigger asChild>
            <Button>도움말</Button>
          </HelpBubbleTrigger>
          <HelpBubbleContent title={LONG_TITLE} description='설명' showCloseButton />
        </HelpBubble>
      </div>
    )
  return (
    <SidePanel open onOpenChange={noop}>
      <SidePanelContent title={LONG_TITLE} aria-describedby={undefined}>
        <SidePanelBody>본문</SidePanelBody>
      </SidePanelContent>
    </SidePanel>
  )
}

// 긴 라벨(담다 #652 · button.md "글자 크기 설정") — 버튼은 놓인 자리보다 넓어지지 않고 라벨은 한 줄 "…", 짝 버튼은 넘치면 쌓고
// 쌓인 뒤에도 길면 "…", 대화상자 바닥은 넘치면 주 버튼이 위로 쌓인다
const LONG_LABEL = '엑셀 파일로 모든 휴가 내역을 내보내고 메일로 받기'
function LabelScene() {
  return (
    <div className='flex flex-col gap-x6 p-x4'>
      <div data-check='slot' style={{ width: 200 }}>
        <Button data-check='long'>{LONG_LABEL}</Button>
      </div>
      <div data-check='pair' style={{ width: 300 }}>
        <ResponsivePair>
          <Button variant='neutralWeak'>취소</Button>
          <Button data-check='pair-main'>{LONG_LABEL}</Button>
        </ResponsivePair>
      </div>
      <Dialog open onOpenChange={() => {}}>
        <DialogContent title='내보내기' aria-describedby={undefined}>
          <DialogBody>본문</DialogBody>
          <DialogFooter>
            <Button variant='neutralWeak' size='small' data-check='foot-cancel'>
              취소
            </Button>
            <Button size='small' data-check='foot-main'>
              휴가 내역을 모두 내보내기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Scene() {
  if (scene === 'header') return <HeaderScene />
  if (scene === 'label') return <LabelScene />
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
  if (scene === 'dim') {
    return (
      <AppHistoryRouter>
        <DimScene />
      </AppHistoryRouter>
    )
  }
  if (scene === 'keyboard') {
    return (
      <AppHistoryRouter>
        <Routes>
          <Route path='*' element={<KeyboardScene />} />
        </Routes>
      </AppHistoryRouter>
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
