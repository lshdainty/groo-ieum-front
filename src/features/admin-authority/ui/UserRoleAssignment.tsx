import { Button } from '@/shared/ui/shadcn/button'
import { FieldDescription, FieldLegend, FieldSet } from '@/shared/ui/shadcn/field'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { Role, User } from '@/features/admin-authority/types'
import { cn } from '@/shared/lib'
import { ArrowLeft, Check } from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

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
    <div className="flex flex-col h-full min-h-0 min-w-0">
      <div className="shrink-0 p-4 min-[48rem]:p-6 border-b bg-background">
        <div className="flex items-start gap-2 mb-1">
          {onBack && (
            <Button variant="outline" size="icon" onClick={onBack} className="mr-2 min-[48rem]:hidden shrink-0 h-8 w-8 mt-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{user.name}</h2>
            <p className="text-muted-foreground mb-4">{user.email}</p>
          </div>
        </div>

        <div className="flex gap-4 text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">{t('authority.department')}:</span> {user.department || '-'}
          </div>
          <div>
            <span className="font-medium text-foreground">{t('authority.position')}:</span> {user.position || '-'}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 min-[48rem]:p-6">
        {/* fieldset 은 기본 min-inline-size 가 min-content 라 띄어쓰기 없는 긴 설명에 폭이 밀린다 — min-w-0 */}
        <FieldSet className="min-w-0 gap-3">
          <FieldLegend className="mb-2 leading-[22px]">{t('authority.roles')}</FieldLegend>
          <FieldDescription className="[[data-variant=legend]+&]:mt-0">
            {t('authority.userRolesHint')}
          </FieldDescription>

          {allRoles.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">{t('authority.noRoles')}</p>
          ) : (
            allRoles.map(role => {
              const isSelected = selected.includes(role.role_code)
              return (
                <label
                  key={role.role_code}
                  className={cn(
                    'group relative flex cursor-pointer rounded-xl py-4 pl-5 pr-4',
                    'inset-ring inset-ring-border transition-[background-color,box-shadow] duration-150',
                    'hover:bg-accent active:bg-accent',
                    'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                    isSelected && 'inset-ring-2 inset-ring-foreground'
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isSelected}
                    onChange={() => handleToggle(role.role_code)}
                  />
                  <span className="flex flex-1 min-w-0 items-center gap-1.5 transition-transform duration-150 ease-out motion-safe:group-active:scale-[0.985]">
                    <span className="flex flex-1 min-w-0 flex-col gap-0.5 pr-1 break-keep wrap-break-word">
                      <span className="text-base leading-[22px] font-medium text-foreground">{role.role_name}</span>
                      {role.desc && (
                        <span className="text-[13px] leading-[18px] text-muted-foreground">{role.desc}</span>
                      )}
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        'grid size-5 shrink-0 place-items-center transition-colors duration-150',
                        isSelected ? 'text-foreground' : 'text-muted-foreground/50'
                      )}
                    >
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                  </span>
                </label>
              )
            })
          )}
        </FieldSet>

        <div className="mt-3 flex flex-col gap-3 min-[48rem]:flex-row min-[48rem]:items-center min-[48rem]:justify-end">
          <p id={hintId} className="text-sm text-muted-foreground">
            {isDirty ? t('authority.userRolesPending', { added, removed }) : t('authority.userRolesNoChanges')}
          </p>
          <Button
            className="relative w-full min-[48rem]:w-auto"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            aria-busy={isSaving}
            aria-describedby={hintId}
          >
            {/* 저장 중에도 글자 자리를 남겨 폭을 지키고, 버튼 이름도 "저장" 으로 둔다(진행은 aria-busy) */}
            <span className={cn(isSaving && 'opacity-0')}>{t('common:save')}</span>
            {isSaving && (
              // svg 를 버튼 바로 아래 두면 Button 의 has-[>svg] 여백이 걸려 폭이 준다 — 한 겹 감싼다
              <span className="absolute inset-0 grid place-items-center">
                <Spinner aria-hidden />
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export { UserRoleAssignment }
