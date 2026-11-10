import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { CircleUser, EllipsisVertical, KeyRound, LogOut, Monitor } from 'lucide-react'

import { Avatar } from '@/shared/ds/avatar'
import { Menu, MenuContent, MenuGroup, MenuItem, MenuTrigger } from '@/shared/ds/menu'
import { MenuSheet, MenuSheetContent, MenuSheetGroup, MenuSheetItem, MenuSheetTrigger } from '@/shared/ds/menu-sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ds/tooltip'
import { RootContext } from '@/shared/ds/side-navigation/side-navigation-context'
import { config } from '@/shared/config'
import { cn } from '@/shared/lib/cn'
import { authKeys, useUser } from '@/entities/session'
import { useAccountDialogs } from './account-dialogs-context'
import { ThemeChooser } from './ThemeChooser'

/*
 * 계정 줄 + 계정 메뉴(I-22 C 17 ~ 19, H-A3 A) — 사이드바 바닥(펼침 240: 아바타 36 + 이름 + 메일 + ⋮ / 접힘 56: 아바타만) ·
 * 폰 옆 패널 바닥. 줄 전체가 버튼 하나(이름 "{이름} 계정 메뉴").
 * 메뉴: 내 정보 · 비밀번호 바꾸기 · 화면 테마(기기 설정 · 라이트 · 다크) · 로그아웃. 768 이상 Menu(줄 오른쪽 · 아래 끝 맞춤 — 사이드바에서
 * 여는 목록은 옆 펼침이 그림이 고른 예외), 미만 Menu Sheet.
 * 내 정보 · 비밀번호 바꾸기는 지금 대화상자를 그대로 연다(Q4 — 새 모양은 I-24 29b 가 그린다).
 */

type Surface = 'menu' | 'sheet'

// 768 ~ 1279(터치로 쓰는 폭) 메뉴 줄 누르는 영역 44 — ds Menu 줄은 39 라 호출처에서 키운다(1280 이상은 그대로 39)
const MENU_ROW_TOUCH = 'md:max-lg:min-h-[44px]'

export function AccountRow({ surface, onOpenDialog }: { surface: Surface; onOpenDialog?: () => void }) {
  const { t } = useTranslation('sidebar')
  const queryClient = useQueryClient()
  const { loginUser, logout } = useUser()
  const { canEdit, openEdit, openPassword } = useAccountDialogs()
  const [themeOpen, setThemeOpen] = useState(false)
  const collapsed = useContext(RootContext)?.collapsed ?? false

  // 틀은 로그인한 사람에게만 그린다(로그인 전에는 Router 가 틀을 안 그린다)
  if (!loginUser) return null

  const handleLogout = () => {
    // React Query 캐시 제거
    queryClient.setQueryData(authKeys.detail('login-check'), null)
    // JWT 토큰 삭제 및 로그인 페이지로 이동
    logout()
  }

  const photo = loginUser.profile_url ? `${config.baseUrl}${loginUser.profile_url}` : undefined
  const accountName = t('footer.accountMenu', { name: loginUser.user_name })

  const trigger = (
    <button
      type='button'
      aria-label={accountName}
      className={cn(
        'flex min-h-[44px] w-full cursor-pointer items-center gap-x3 rounded-r2_5 border-0 bg-transparent px-x2 py-x1_5 text-left font-sans',
        'hover:bg-bg-layer-default-pressed active:bg-bg-layer-default-pressed aria-expanded:bg-bg-layer-default-pressed',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stroke-focus-ring',
        collapsed && 'w-[40px] justify-center px-0'
      )}
    >
      <Avatar name={loginUser.user_name} src={photo} size={36} decorative />
      {!collapsed && (
        <>
          <span className='flex min-w-0 flex-1 flex-col'>
            <span className='text-t4 font-medium text-fg-neutral'>{loginUser.user_name}</span>
            {/* 메일 · 아이디처럼 한 낱말이 긴 칸 — 말줄임 없이 칸 끝에서 끊는다(v114 예외) */}
            <span className='text-t3 font-normal text-fg-neutral-subtle [overflow-wrap:anywhere]'>
              {loginUser.user_email}
            </span>
          </span>
          <EllipsisVertical aria-hidden className='size-[18px] shrink-0 text-fg-neutral-subtle' />
        </>
      )}
    </button>
  )

  const items = {
    edit: { label: t('footer.account'), icon: <CircleUser aria-hidden />, onSelect: () => { onOpenDialog?.(); openEdit() } },
    password: { label: t('footer.changePassword'), icon: <KeyRound aria-hidden />, onSelect: () => { onOpenDialog?.(); openPassword() } },
    theme: { label: t('footer.theme'), icon: <Monitor aria-hidden />, onSelect: () => setThemeOpen(true) },
    logout: { label: t('footer.logout'), icon: <LogOut aria-hidden />, onSelect: handleLogout },
  }

  return (
    <>
      {surface === 'menu' ? (
        <Menu>
          {collapsed ? (
            // 접힘 — 이름은 말풍선(메뉴가 열려 있는 동안은 말풍선을 숨긴다)
            <Tooltip>
              <TooltipTrigger asChild>
                <MenuTrigger asChild>{trigger}</MenuTrigger>
              </TooltipTrigger>
              <TooltipContent side='right'>{loginUser.user_name}</TooltipContent>
            </Tooltip>
          ) : (
            <MenuTrigger asChild>{trigger}</MenuTrigger>
          )}
          <MenuContent side='right' align='end'>
            {canEdit && (
              <MenuGroup>
                <MenuItem {...items.edit} className={MENU_ROW_TOUCH} />
                <MenuItem {...items.password} className={MENU_ROW_TOUCH} />
              </MenuGroup>
            )}
            <MenuGroup>
              {/* 메뉴는 실행만 한다(고른 표시 없음) — 지금 값은 고르기 창이 보인다 */}
              <MenuItem {...items.theme} className={MENU_ROW_TOUCH} />
            </MenuGroup>
            <MenuGroup>
              <MenuItem {...items.logout} className={MENU_ROW_TOUCH} />
            </MenuGroup>
          </MenuContent>
        </Menu>
      ) : (
        <MenuSheet>
          <MenuSheetTrigger asChild>{trigger}</MenuSheetTrigger>
          <MenuSheetContent title={loginUser.user_name}>
            {canEdit && (
              <MenuSheetGroup>
                <MenuSheetItem {...items.edit} />
                <MenuSheetItem {...items.password} />
              </MenuSheetGroup>
            )}
            <MenuSheetGroup>
              <MenuSheetItem {...items.theme} />
            </MenuSheetGroup>
            <MenuSheetGroup>
              <MenuSheetItem {...items.logout} />
            </MenuSheetGroup>
          </MenuSheetContent>
        </MenuSheet>
      )}

      <ThemeChooser open={themeOpen} onOpenChange={setThemeOpen} />
    </>
  )
}
