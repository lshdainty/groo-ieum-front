import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ds/tabs'
import { ProtectedPage } from '@/shared/ui/require-permission/ProtectedPage'
import { useDiscardGuard } from '@/shared/ui/groo/use-discard-guard'
import { RoleManagementPanel } from '@/features/admin-authority/ui/RoleManagementPanel'
import { UserManagementPanel } from '@/features/admin-authority/ui/UserManagementPanel'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { ScreenBody, ScreenTitleRow } from '@/widgets/layout/ui/ScreenBody'

type AuthorityTab = 'roles' | 'users'

/**
 * 역할 및 권한(I-24 G 32) — 제목 줄 → Line 탭 "역할 · 사용자"(hug) → 16 → 나눔 상자. 탭 내용은 forceMount 라 탭을 바꿔도 역할 상세에 고치던 값이 그대로 남는다 —
 * 탭 전환에는 이탈 확인을 걸지 않는다(역할 · 목록 전환에만 패널이 건다).
 */
const Authority = () => {
  const { t } = useTranslation('admin')
  const desktop = useDesktop()
  const [tab, setTab] = useState<AuthorityTab>('roles')
  const [dirty, setDirty] = useState(false)
  const { guard, node } = useDiscardGuard(dirty)
  const onDirty = useCallback((d: boolean) => setDirty(d), [])

  return (
    <ProtectedPage permission='ROLE:MANAGE'>
      <ScreenBody density='high'>
        <ScreenTitleRow title={t('authority.title')} />
        <div className='bg-bg-layer-default min-[48rem]:bg-transparent'>
          <Tabs value={tab} onValueChange={(v) => setTab(v as AuthorityTab)}>
            <TabsList aria-label={t('authority.tabsAria')} layout={desktop ? 'hug' : 'fill'} size={desktop ? 'medium' : 'small'}>
              <TabsTrigger value='roles'>{t('authority.roles')}</TabsTrigger>
              <TabsTrigger value='users'>{t('authority.users')}</TabsTrigger>
            </TabsList>
            <TabsContent value='roles' className='min-[48rem]:mt-x4'>
              <RoleManagementPanel onDirtyChange={onDirty} discard={guard} />
            </TabsContent>
            <TabsContent value='users' className='min-[48rem]:mt-x4'>
              <UserManagementPanel />
            </TabsContent>
          </Tabs>
        </div>
        {node}
      </ScreenBody>
    </ProtectedPage>
  )
}

export { Authority }
