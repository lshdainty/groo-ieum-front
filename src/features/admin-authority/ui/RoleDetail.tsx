import { ChevronLeft, EllipsisVertical, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import { Field } from '@/shared/ds/field'
import { Input } from '@/shared/ds/input'
import { ResponsiveMenu, ResponsiveMenuContent, ResponsiveMenuGroup, ResponsiveMenuItem, ResponsiveMenuTrigger } from '@/shared/ds/menu'
import { Textarea } from '@/shared/ds/textarea'
import type { PermissionResp } from '@/entities/permission'
import { ROLE_NAME_MAX, type RoleDraft } from '../lib/role-draft'
import { PermissionList } from './PermissionList'

interface RoleDetailProps {
  draft: RoleDraft
  isNew: boolean
  permissions: PermissionResp[]
  canManage: boolean
  desktop: boolean
  busy: boolean
  dirty: boolean
  /** 있는 역할의 이름을 비웠다 — 서버가 빈 이름을 받지 않는다(400) */
  nameEmpty: boolean
  saveError: string | null
  codeError: string | null
  showErrors: boolean
  onChange: (next: RoleDraft) => void
  onSave: () => void
  onDelete?: () => void
  onBack?: () => void
}

/**
 * 역할 상세 한 면(I-24 G 33 · 34) — 머리(역할 이름 + [저장] 하나 + ⋮ "삭제") · 칸(역할 코드 · 이름 · 설명) · 권한 묶음 체크 줄.
 * 데스크톱: 머리 오른쪽 [저장](새 역할은 [만들기]). 폰: 머리에 ← + 이름 + ⋮, 바닥에 [저장] 폭 전체(권한 시트는 걷었다 — 저장 시점이 같다).
 * 이름 · 설명은 관리 권한이 있으면 고친다(PUT 은 바뀐 칸만). 이름은 20자까지 · 비울 수 없고, 설명은 비우면 지운다.
 */
const RoleDetail = ({ draft, isNew, permissions, canManage, desktop, busy, dirty, nameEmpty, saveError, codeError, showErrors, onChange, onSave, onDelete, onBack }: RoleDetailProps) => {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  // 이름 칸을 비우는 중에도 머리가 비지 않게 — 역할 코드로 둔다
  const title = isNew ? t('authority.newRole') : draft.name.trim() || draft.code
  const saveLabel = isNew ? t('authority.createRole') : tc('save')
  const nameMissing = (isNew && showErrors && !draft.name.trim()) || nameEmpty
  const codeMissing = isNew && showErrors && !draft.code.trim()

  const menu =
    onDelete && canManage ? (
      <ResponsiveMenu>
        <ResponsiveMenuTrigger asChild>
          <Button variant='ghost' layout='iconOnly' size='medium' aria-label={t('authority.moreFor', { name: title })} data-role-more>
            <EllipsisVertical />
          </Button>
        </ResponsiveMenuTrigger>
        <ResponsiveMenuContent title={title}>
          <ResponsiveMenuGroup>
            <ResponsiveMenuItem label={tc('delete')} icon={<Trash2 />} tone='critical' onSelect={onDelete} />
          </ResponsiveMenuGroup>
        </ResponsiveMenuContent>
      </ResponsiveMenu>
    ) : null

  return (
    <div className='flex min-w-0 flex-col' data-role-detail>
      <div className='flex items-center justify-between gap-x2 px-global-gutter pb-x2 pt-x4'>
        <div className='flex min-w-0 items-center gap-x2'>
          {!desktop && onBack && (
            <Button variant='ghost' layout='iconOnly' size='medium' aria-label={t('authority.backToList')} data-role-back onClick={onBack} className='-ml-x2'>
              <ChevronLeft />
            </Button>
          )}
          <h2 className='m-0 min-w-0 text-t5 font-bold text-fg-neutral [overflow-wrap:anywhere]'>{title}</h2>
        </div>
        <div className='flex shrink-0 items-center gap-x1'>
          {desktop && canManage && (
            <Button variant='neutralSolid' size='small' loading={busy} disabled={!dirty || nameEmpty} data-role-save onClick={onSave}>
              {saveLabel}
            </Button>
          )}
          {menu}
        </div>
      </div>
      {saveError && (
        <Callout tone='critical' role='alert' className='mx-global-gutter mb-x4' data-save-failure>
          {saveError}
        </Callout>
      )}
      <div className='flex flex-col gap-x6 px-global-gutter pb-x2 pt-x2'>
        <Field
          label={t('authority.roleCode')}
          showRequiredIndicator={isNew}
          readOnly={!isNew}
          invalid={codeMissing || !!codeError}
          errorMessage={codeError ?? t('authority.roleCodeRequired')}
          description={isNew ? t('authority.roleCodeHint') : t('authority.roleCodeDisabledHint')}
        >
          <Input value={draft.code} readOnly={!isNew} autoCapitalize='characters' placeholder={isNew ? t('authority.roleCodePlaceholder') : undefined} onChange={(e) => onChange({ ...draft, code: e.target.value })} />
        </Field>
        <Field
          label={t('authority.roleName')}
          showRequiredIndicator={canManage}
          readOnly={!canManage}
          invalid={nameMissing}
          errorMessage={t('authority.roleNameRequired')}
          maxGraphemeCount={canManage ? ROLE_NAME_MAX : undefined}
        >
          <Input
            value={draft.name}
            readOnly={!canManage}
            maxLength={ROLE_NAME_MAX}
            placeholder={isNew ? t('authority.roleNamePlaceholder') : undefined}
            onChange={(e) => onChange({ ...draft, name: e.target.value.slice(0, ROLE_NAME_MAX) })}
            data-role-name
          />
        </Field>
        <Field label={t('authority.roleDesc')} readOnly={!canManage}>
          <Textarea value={draft.desc} readOnly={!canManage} data-role-desc placeholder={t('authority.roleDescPlaceholder')} onChange={(e) => onChange({ ...draft, desc: e.target.value })} />
        </Field>
      </div>
      <PermissionList
        permissions={permissions}
        selected={draft.perms}
        disabled={!canManage || busy}
        onToggle={(code, on) => onChange({ ...draft, perms: on ? [...draft.perms.filter((c) => c !== code), code] : draft.perms.filter((c) => c !== code) })}
        onToggleGroup={(codes, on) => onChange({ ...draft, perms: on ? [...draft.perms, ...codes.filter((c) => !draft.perms.includes(c))] : draft.perms.filter((c) => !codes.includes(c)) })}
      />
      {!desktop && canManage && (
        <div className='sticky bottom-0 z-10 bg-bg-layer-default px-global-gutter pb-x4 pt-x3'>
          <Button size='large' variant='neutralSolid' className='w-full' loading={busy} disabled={!dirty || nameEmpty} data-role-save onClick={onSave}>
            {saveLabel}
          </Button>
        </div>
      )}
    </div>
  )
}

export { RoleDetail }
