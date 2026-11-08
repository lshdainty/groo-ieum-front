import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'

import {
  SideNavigationGroup,
  SideNavigationItem,
  SideNavigationSubItem,
} from '@/shared/ds/side-navigation'
import { useLinkClick } from '../lib/use-link-click'
import { isPathActive, type NavGroup } from '../model/nav'

/**
 * 묶음 · 항목 — 데스크톱 사이드바와 폰 옆 패널이 같은 것을 그린다.
 * 항목은 진짜 링크(href = 라우트 경로) + SPA 이동. 지금 항목 = 그 경로로 시작하는 주소, 부모는 하위가 지금이면 저절로 펼친다(ds).
 */
export function NavGroups({ groups }: { groups: NavGroup[] }) {
  const { t } = useTranslation('sidebar')
  const { pathname } = useLocation()
  const link = useLinkClick()

  return (
    <>
      {groups.map((group) => (
        <SideNavigationGroup key={group.id} label={group.labelKey ? t(group.labelKey) : undefined}>
          {group.items.map((item) => {
            const Icon = item.icon
            if (item.kind === 'leaf') {
              return (
                <SideNavigationItem
                  key={item.id}
                  href={item.path}
                  icon={<Icon />}
                  label={t(item.labelKey)}
                  current={isPathActive(pathname, item.path)}
                  onClick={link(item.path)}
                />
              )
            }
            return (
              <SideNavigationItem key={item.id} icon={<Icon />} label={t(item.labelKey)}>
                {item.children.map((child) => (
                  <SideNavigationSubItem
                    key={child.id}
                    href={child.path}
                    label={t(child.labelKey)}
                    current={isPathActive(pathname, child.path)}
                    onClick={link(child.path)}
                  />
                ))}
              </SideNavigationItem>
            )
          })}
        </SideNavigationGroup>
      ))}
    </>
  )
}
