import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { List, ListButtonItem } from '@/shared/ds/list'
import { usePermission } from '@/entities/session'
import type { RoleResp } from '@/entities/role'

/**
 * 역할 목록(I-24 G 32) — 패널 머리 "역할 {n}개" + 오른쪽 `plus` 아이콘 단추("역할 추가", ROLE:MANAGE), 아래 줄(고른 줄 강조).
 * 줄 🗑 는 걷었다 — 삭제는 상세 머리 ⋮. 새로 만드는 중인 역할은 맨 아래 "새 역할" 줄로 보인다.
 */
const RoleList = ({
  roles,
  selected,
  creating,
  onSelect,
  onAdd,
}: {
  roles: RoleResp[]
  selected: string | null
  creating: boolean
  onSelect: (code: string) => void
  onAdd: () => void
}) => {
  const { t } = useTranslation('admin')
  const { hasPermission } = usePermission()
  return (
    <div className='flex min-h-0 flex-col' data-role-list>
      <div className='flex items-center justify-between gap-x2 pb-x2 pl-x4 pr-x2 pt-x3'>
        <h2 className='m-0 text-t5 font-bold text-fg-neutral'>{t('authority.roleCount', { count: roles.length })}</h2>
        {hasPermission('ROLE:MANAGE') && (
          <Button variant='ghost' layout='iconOnly' size='medium' aria-label={t('authority.addRole')} data-role-add disabled={creating} onClick={onAdd}>
            <Plus />
          </Button>
        )}
      </div>
      <List>
        {roles.map((role) => (
          <ListButtonItem
            key={role.role_code}
            data-role-code={role.role_code}
            title={<span className='[overflow-wrap:anywhere]'>{role.role_name}</span>}
            highlighted={selected === role.role_code}
            aria-current={selected === role.role_code || undefined}
            onClick={() => onSelect(role.role_code)}
          />
        ))}
        {creating && <ListButtonItem title={t('authority.newRole')} highlighted aria-current data-role-code='__new' onClick={() => undefined} />}
      </List>
    </div>
  )
}

export { RoleList }
