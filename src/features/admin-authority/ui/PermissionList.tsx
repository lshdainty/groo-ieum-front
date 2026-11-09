import { useTranslation } from 'react-i18next'

import { Checkbox } from '@/shared/ds/checkbox'
import { List, ListCheckItem, ListHeader } from '@/shared/ds/list'
import type { PermissionResp } from '@/entities/permission'

/**
 * 권한 한 면(I-24 G 33) — 머리 "권한 {n}개"(n = 고른 수) 아래 묶음마다 List Header + "모두" Checkbox(일부면 일부 표시), 권한 줄(앞 Checkbox ·
 * 이름 · 설명 — 설명은 DB 글 그대로, 줄 전체 누름 = 체크). 묶음 이름은 서버 resource 코드를 사람 말로(모르는 코드는 코드 그대로).
 */
export function PermissionList({
  permissions,
  selected,
  disabled,
  onToggle,
  onToggleGroup,
}: {
  permissions: PermissionResp[]
  selected: string[]
  disabled?: boolean
  onToggle: (code: string, on: boolean) => void
  onToggleGroup: (codes: string[], on: boolean) => void
}) {
  const { t } = useTranslation('admin')
  const groups = new Map<string, PermissionResp[]>()
  permissions.forEach((p) => {
    if (!p.resource) return
    groups.set(p.resource, [...(groups.get(p.resource) ?? []), p])
  })
  return (
    <div className='flex flex-col' data-permission-list>
      <div className='px-global-gutter pb-x1 pt-x5'>
        <h3 className='m-0 text-t5 font-bold text-fg-neutral' data-permission-count>
          {t('authority.permissionCount', { count: selected.length })}
        </h3>
      </div>
      {[...groups.entries()].map(([resource, items]) => {
        const codes = items.map((p) => p.code)
        const all = codes.every((c) => selected.includes(c))
        const some = codes.some((c) => selected.includes(c))
        const name = t(`authority.resource.${resource}`, { defaultValue: resource })
        return (
          <section key={resource} data-permission-group={resource}>
            <ListHeader as='div' variant='mediumWeak'>
              <h4 className='m-0'>{name}</h4>
              <Checkbox
                label={t('authority.selectAllShort')}
                aria-label={t('authority.selectAllOf', { name })}
                checked={all ? true : some ? 'indeterminate' : false}
                disabled={disabled}
                onCheckedChange={(c) => onToggleGroup(codes, c === true)}
              />
            </ListHeader>
            <List>
              {items.map((p) => (
                <ListCheckItem
                  key={p.code}
                  data-permission-code={p.code}
                  title={<span className='[overflow-wrap:break-word] [word-break:keep-all]'>{p.name}</span>}
                  detail={p.desc || undefined}
                  checked={selected.includes(p.code)}
                  disabled={disabled}
                  onCheckedChange={(c) => onToggle(p.code, c === true)}
                />
              ))}
            </List>
          </section>
        )
      })}
    </div>
  )
}
