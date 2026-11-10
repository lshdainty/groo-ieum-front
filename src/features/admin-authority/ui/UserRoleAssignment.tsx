import { ArrowLeft } from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { Field } from '@/shared/ds/field'
import { CheckSelectBox, CheckSelectBoxGroup } from '@/shared/ds/select-box'
import { Role, User } from '@/features/admin-authority/types'

interface UserRoleAssignmentProps {
  user: User
  allRoles: Role[]
  // 실패하면 reject 해야 한다 — 그래야 고른 것을 그대로 두고 다시 저장할 수 있다
  onUpdateUserRole: (userId: string, roleCodes: string[]) => Promise<void>
  onBack?: () => void
}

// 순서와 상관없이 같은 역할 묶음인지 가린다
const toRoleKey = (codes: string[]): string => [...codes].sort().join('\n')

// 사용자 상세의 역할 고르기 — Select Box(칸 없는 체크) 여럿 + 아래 "저장" 한 번.
// 폰 · 데스크톱이 같은 모양이다. 상자를 눌러도 서버로 가지 않고, 저장을 눌러야 한 번에 보낸다.
// 다른 사용자로 바꾸면 고른 것이 그 사용자 값으로 돌아가도록 부르는 쪽이 key 를 사용자 id 로 준다.
const UserRoleAssignment = ({ user, allRoles, onUpdateUserRole, onBack }: UserRoleAssignmentProps) => {
  const { t } = useTranslation('admin')
  const hintId = useId()
  const serverCodes = user.role_codes
  const serverKey = toRoleKey(serverCodes)

  // baseline = 저장된 역할(바뀐 것을 가르는 기준), selected = 화면에서 고른 역할
  const [baseline, setBaseline] = useState<string[]>(serverCodes)
  const [selected, setSelected] = useState<string[]>(serverCodes)
  const [syncedKey, setSyncedKey] = useState(serverKey)
  const [isSaving, setIsSaving] = useState(false)

  const added = selected.filter(code => !baseline.includes(code)).length
  const removed = baseline.filter(code => !selected.includes(code)).length
  const isDirty = added + removed > 0

  // 서버 값이 바뀌면(저장 뒤 다시 받기 · 다른 곳에서 바꿈) 기준을 따라간다. 고치던 중이면 고른 것은 둔다
  if (serverKey !== syncedKey) {
    setSyncedKey(serverKey)
    setBaseline(serverCodes)
    if (!isDirty) setSelected(serverCodes)
  }

  const handleToggle = (roleCode: string) => {
    setSelected(prev => prev.includes(roleCode)
      ? prev.filter(code => code !== roleCode)
      : [...prev, roleCode])
  }

  const handleSave = async () => {
    if (!isDirty || isSaving) return
    const roleCodes = selected
    setIsSaving(true)
    try {
      await onUpdateUserRole(user.id, roleCodes)
      setBaseline(roleCodes)
    } catch {
      // 실패 토스트는 onUpdateUserRole 이 띄운다. 고른 것은 그대로 두어 다시 저장할 수 있게 한다
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-stroke-neutral-subtle bg-bg-layer-default p-x4 md:p-x6">
        <div className="mb-x1 flex items-start gap-x2">
          {onBack && (
            <Button variant="ghost" layout="iconOnly" size="medium" aria-label={t('authority.backToUserList')} onClick={onBack} className="-ml-x2 shrink-0 md:hidden" data-user-back>
              <ArrowLeft />
            </Button>
          )}
          <div className="min-w-0">
            <h2 className="m-0 text-t8 font-bold text-fg-neutral [overflow-wrap:anywhere]">{user.name}</h2>
            <p className="m-0 mb-x4 text-t4 text-fg-neutral-subtle [overflow-wrap:anywhere]">{user.email}</p>
          </div>
        </div>

        <div className="flex gap-x4 text-t4 text-fg-neutral-subtle">
          <div>
            <span className="font-medium text-fg-neutral">{t('authority.department')}:</span> {user.department || '-'}
          </div>
          <div>
            <span className="font-medium text-fg-neutral">{t('authority.position')}:</span> {user.position || '-'}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-x4 md:p-x6">
        <Field label={t('authority.roles')} description={t('authority.userRolesHint')}>
          {allRoles.length === 0 ? (
            <p className="m-0 py-x4 text-t4 text-fg-neutral-muted">{t('authority.noRoles')}</p>
          ) : (
            <CheckSelectBoxGroup>
              {allRoles.map(role => (
                <CheckSelectBox
                  key={role.role_code}
                  label={role.role_name}
                  description={role.desc || undefined}
                  checked={selected.includes(role.role_code)}
                  onCheckedChange={() => handleToggle(role.role_code)}
                />
              ))}
            </CheckSelectBoxGroup>
          )}
        </Field>

        <div className="mt-x3 flex flex-col gap-x3 md:flex-row md:items-center md:justify-end">
          <p id={hintId} className="m-0 text-t4 text-fg-neutral-subtle">
            {isDirty ? t('authority.userRolesPending', { added, removed }) : t('authority.userRolesNoChanges')}
          </p>
          <Button
            className="w-full md:w-auto"
            onClick={handleSave}
            loading={isSaving}
            disabled={!isDirty}
            aria-describedby={hintId}
          >
            {t('common:save')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export { UserRoleAssignment }
