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
 * 역할 및 권한(I-24 G 32) — 제목 줄 → Line 탭 "역할 · 사용자"(hug) → 16 → 나눔 상자. 역할 상세에 바뀐 값이 있으면 탭을 바꿀 때
 * "작성한 내용이 사라져요" 를 묻는다.
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
          <Tabs value={tab} onValueChange={(v) => guard(() => setTab(v as AuthorityTab))}>
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
