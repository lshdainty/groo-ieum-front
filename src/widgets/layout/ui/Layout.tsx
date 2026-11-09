import { useEffect, useLayoutEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { focusScreenTitle, TopNavigationProvider, useScreenTitle } from '@/shared/ds/top-navigation'
import { usePermission } from '@/entities/session'
import { useOAuthLinkResult } from '@/shared/hooks/useOAuthLinkResult'
import { NoticePopupContainer } from '@/widgets/notice-popup'
import { useDesktop } from '../lib/use-desktop'
import { enterScreen, restoreScreen, watchScreen } from '../lib/screen-memory'
import { buildNav, screenTitleKeyOf } from '../model/nav'
import { AccountDialogsProvider } from './AccountDialogs'
import { HrSidebar } from './HrSidebar'
import { PhoneFrame } from './PhoneFrame'

/**
 * 화면을 옮길 때의 틀 몫 — 문서 제목 "{화면 제목} - 그루 이음" 과, 옮긴 뒤 본문 맨 위 + 제목에 초점(뒤로 오면 떠날 때 스크롤 + 누른 요소로 — screen-memory, 그루 담다 `AppLayout.tsx` ScreenEffects 와 같다).
 * TopNavigationProvider 안에 둔다(제품 이름을 거기서 읽는다). 처음 열 때는 초점을 훔치지 않는다.
 */
function ScreenEffects() {
  const { t } = useTranslation('sidebar')
  const { t: tc } = useTranslation('common')
  const { pathname, key } = useLocation()
  const navType = useNavigationType()
  const titleKey = screenTitleKeyOf(pathname)
  // 메뉴에 없는 주소(404)는 "페이지를 찾을 수 없어요 - 그루 이음"
  useScreenTitle(titleKey ? t(titleKey) : tc('notFound.title'))
  const last = useRef(pathname)
  // 스크롤 · 누른 요소를 화면(location.key)마다 적어 둔다 — 뒤로 오면 돌려주려고(top-navigation.md:230)
  useEffect(() => watchScreen(), [])
  useLayoutEffect(() => {
    enterScreen(key)
  }, [key])
  useEffect(() => {
    if (last.current === pathname) return
    last.current = pathname
    // 뒤로(POP) 왔다 — 떠날 때의 스크롤(맨 위였으면 0)로 돌리고 누른 요소에 초점. 적어 둔 게 없으면(새로 고침 뒤 등) 앞으로 갈 때와 같다
    if (navType === 'POP') {
      const stop = restoreScreen(key)
      if (stop) return stop
    }
    // 새 화면이 그려진 다음 프레임에 — 제목(data-screen-title)이 DOM 에 있어야 초점이 간다
    const frame = requestAnimationFrame(() => focusScreenTitle())
    return () => cancelAnimationFrame(frame)
  }, [pathname, key, navType])
  return null
}

/** 화면 맨 앞 "본문 바로가기" — 키보드 초점이 오면 보이고, 누르면 main 으로 간다(랜드마크) */
function SkipLink() {
  const { t } = useTranslation('sidebar')
  return (
    <a
      href='#main'
      onClick={(e) => {
        e.preventDefault()
        document.getElementById('main')?.focus()
      }}
      className='sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-x4 focus-visible:top-x4 focus-visible:z-(--z-modal-content) focus-visible:rounded-r3 focus-visible:bg-bg-layer-floating focus-visible:px-x4 focus-visible:py-x3 focus-visible:text-t4 focus-visible:font-bold focus-visible:text-fg-neutral focus-visible:shadow-(--shadow-s3) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus-ring'
    >
      {t('skipToMain')}
    </a>
  )
}

/**
 * 앱 틀(I-22 D 22 · 23) — 768 이상: 사이드바(240 / 56) + 오른쪽 본문(회색 바닥, 본문만 스크롤). 미만: 상단 바 + ☰ 옆 패널, 하단 탭 없음.
 * 머리 · 빵부스러기 · 머리 테마 단추는 없다(HR 은 데스크톱 머리를 두지 않는다). 본문 여백 · 제목 줄은 화면이 ScreenBody · ScreenTitleRow 로 둔다.
 */
function Shell() {
  const desktop = useDesktop()
  const { hasAnyPermission } = usePermission()
  const groups = buildNav(hasAnyPermission)

  // OAuth 연동 결과 처리 (URL 파라미터 감지)
  useOAuthLinkResult()

  return (
    <div className='flex h-svh'>
      <SkipLink />
      {desktop && <HrSidebar groups={groups} />}
      <div className='flex min-w-0 flex-1 flex-col overflow-hidden bg-bg-layer-basement'>
        {!desktop && <PhoneFrame groups={groups} />}
        {/* 머리는 main 밖이다(banner) — 본문만 스크롤한다 */}
        <main
          id='main'
          tabIndex={-1}
          className='relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-[env(safe-area-inset-bottom)] outline-none'
        >
          <Outlet />
        </main>
      </div>
      <NoticePopupContainer />
    </div>
  )
}

export function Layout() {
  return (
    <TopNavigationProvider product='그루 이음'>
      <ScreenEffects />
      <AccountDialogsProvider>
        <Shell />
      </AccountDialogsProvider>
    </TopNavigationProvider>
  )
}
