import { useTranslation } from 'react-i18next'

import {
  SideNavigation,
  SideNavigationContent,
  SideNavigationFooter,
  SideNavigationHeader,
} from '@/shared/ds/side-navigation'
import { GrooTree } from '@/shared/ui/groo-tree'
import type { NavGroup } from '../model/nav'
import { AccountRow } from './AccountRow'
import { NavGroups } from './NavGroups'

/**
 * 데스크톱(768 이상) 주 메뉴 — Side Navigation. 768 ~ 1279 는 아이콘만(56), 1280 이상은 펼침(240) — 폭 규칙 · 손으로 접은 기억은 ds 가 맡는다.
 * 머리 = 나무 24 + "그루 이음", 바닥 = 계정 줄(HR 만 — side-navigation.md "HR 적용 때 정한다").
 */
export function HrSidebar({ groups }: { groups: NavGroup[] }) {
  const { t } = useTranslation('common')
  return (
    // 접힌 사이드바의 펼침 메뉴가 본문 카드 아래로 들어가지 않는 층(z-sticky)은 ds 루트가 가진다(side-navigation.yaml root.zIndex)
    <SideNavigation>
      <SideNavigationHeader
        logo={
          <>
            {/* 나무 24(폭 22.3) — span 으로 감싸 로고 슬롯의 직계 svg 24×24 고정 규칙은 걸리지 않는다. 사이 8 · 이름은 슬롯의 t5 · 700 */}
            <span className='flex shrink-0'>
              <GrooTree size={24} />
            </span>
            {t('app.title')}
          </>
        }
      />
      <SideNavigationContent>
        <NavGroups groups={groups} />
      </SideNavigationContent>
      <SideNavigationFooter>
        <AccountRow surface='menu' />
      </SideNavigationFooter>
    </SideNavigation>
  )
}
