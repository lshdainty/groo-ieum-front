import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import { SideNavigationContent } from '@/shared/ds/side-navigation'
import { SidePanel, SidePanelBody, SidePanelContent, SidePanelFooter } from '@/shared/ds/side-panel'
import { hasPreviousEntry } from '@/shared/ds/top-navigation/top-navigation-context'
import {
  TopNavigation,
  TopNavigationActions,
  TopNavigationBackButton,
  TopNavigationIconButton,
  TopNavigationMenuButton,
  TopNavigationTextButton,
  TopNavigationTitle,
} from '@/shared/ds/top-navigation'
import { useDesktop } from '../lib/use-desktop'
import { useCurrentScreenAction } from '../lib/screen-action'
import { useCurrentScreenHeader } from '../lib/screen-header'
import { parentPathOf, screenTitleKeyOf, type NavGroup } from '../model/nav'
import { AccountRow } from './AccountRow'
import { NavGroups } from './NavGroups'

/**
 * 폰 틀(768 미만, H-A6 A) — 상단 바 standard 56 · 왼쪽 ☰(이름 "주 메뉴") · 제목 = 화면 제목 · 스크롤해도 선 없음, 그리고 ☰ 로 여는
 * 왼쪽 Side Panel(화면 폭의 80% · 제목 "그루 이음" · 본문 = 주 메뉴 · 바닥 = 계정 줄). 하단 탭 바 · 떠 있는 버튼은 두지 않는다.
 * 항목을 누르면 이동하고 닫힌다. 창이 768 이상이 되면 닫힌다(ds Side Panel). 화면을 옮기면(뒤로 가기 포함) 닫힌 채다.
 * 오른쪽 자리는 화면이 useScreenAction 으로 넘기는 글 버튼 하나(홈 "편집")다 — 없으면 비어 있다.
 */
export function PhoneFrame({ groups }: { groups: NavGroup[] }) {
  const { t } = useTranslation('sidebar')
  const { t: tc } = useTranslation('common')
  const { pathname } = useLocation()
  const desktop = useDesktop()
  // 서랍은 연 화면에서만 열려 있다 — 화면을 옮기면 닫힌다
  const [openAt, setOpenAt] = useState<string | null>(null)
  const open = !desktop && openAt === pathname
  const setOpen = (next: boolean) => setOpenAt(next ? pathname : null)
  const titleKey = screenTitleKeyOf(pathname)
  const parentPath = parentPathOf(pathname)
  const navigate = useNavigate()
  const action = useCurrentScreenAction()
  const header = useCurrentScreenHeader()

  return (
    <>
      <TopNavigation type='standard'>
        {header?.onBack ? (
          // 한 화면 안의 상세(부서 배치의 부서 화면)는 ← 가 그 화면의 동작이다
          <TopNavigationBackButton fallbackHref={pathname} onClick={header.onBack} />
        ) : parentPath ? (
          // 하위 화면(공지 상세 등)은 ☰ 대신 ← — 앞 화면이 있으면 되감고, 없으면 부모로(I-22 D 23)
          <TopNavigationBackButton
            fallbackHref={parentPath}
            onClick={() => (hasPreviousEntry() ? navigate(-1) : navigate(parentPath, { replace: true }))}
          />
        ) : (
          <TopNavigationMenuButton
            aria-expanded={open}
            aria-controls='hr-main-menu-panel'
            onClick={() => setOpen(true)}
          />
        )}
        <TopNavigationTitle>{header?.title ?? (titleKey ? t(titleKey) : tc('notFound.topBar'))}</TopNavigationTitle>
        {header?.action ? (
          <TopNavigationActions>
            <TopNavigationIconButton aria-label={header.action.label} onClick={header.action.onClick}>
              {header.action.icon}
            </TopNavigationIconButton>
          </TopNavigationActions>
        ) : (
          action && (
            <TopNavigationActions>
              <TopNavigationTextButton onClick={action.onClick}>{action.label}</TopNavigationTextButton>
            </TopNavigationActions>
          )
        )}
      </TopNavigation>
      <SidePanel open={open} onOpenChange={setOpen}>
        <SidePanelContent side='left' title={tc('app.title')} id='hr-main-menu-panel'>
          <SidePanelBody scrollFog>
            <SideNavigationContent onNavigate={() => setOpen(false)}>
              <NavGroups groups={groups} />
            </SideNavigationContent>
          </SidePanelBody>
          <SidePanelFooter>
            <div className='min-w-0 flex-1'>
              <AccountRow surface='sheet' onOpenDialog={() => setOpen(false)} />
            </div>
          </SidePanelFooter>
        </SidePanelContent>
      </SidePanel>
    </>
  )
}
