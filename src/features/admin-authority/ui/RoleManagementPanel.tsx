import { useEffect, useState } from 'react'
import { Shield } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/shared/ui/shadcn/resizable'
import { ResultSection } from '@/shared/ds/result-section'
import { LoadingRegion, Skeleton } from '@/shared/ds/skeleton'
import { useSnackbar } from '@/shared/ds/snackbar'
import { usePermissionsQuery } from '@/entities/permission'
import { useDeleteRoleMutation, usePostRoleMutation, usePutRoleMutation, usePutRolePermissionsMutation, useRolesQuery } from '@/entities/role'
import { usePermission } from '@/entities/session'
import { useBeforeUnloadWhile } from '@/shared/lib/before-unload'
import { ConfirmDialog, useConfirmTarget } from '@/shared/ui/confirm'
import { useDiscardGuard } from '@/shared/ui/groo/use-discard-guard'
import { readWriteFailure } from '@/shared/ui/groo/write-error'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { changesOf, draftOf, EMPTY_DRAFT, type RoleDraft } from '../lib/role-draft'
import { RoleDetail } from './RoleDetail'
import { RoleList } from './RoleList'

const PanelSkeleton = () => (
  <div className='flex flex-col gap-x3 p-x4'>
    {[0, 1, 2, 3].map((i) => (
      <Skeleton key={i} text='t5' className='block w-2/3' />
    ))}
    {[0, 1, 2].map((i) => (
      <Skeleton key={`f${i}`} text='t5' className='block h-[40px] w-full' />
    ))}
  </div>
)

/**
 * 역할 탭(I-24 G 32 ~ 35) — 데스크톱: 나눔 상자(왼쪽 목록 · 오른쪽 상세 한 면), 폰: 목록 → 역할을 누르면 그 역할 화면(`?role=코드`, 뒤로 = 목록).
 * 고치는 값(draft)은 이 패널이 들어 폭이 바뀌어도 이어진다. [저장] 하나가 두 요청을 차례로 한다(설명 → 권한, 앞이 실패하면 뒤는 보내지 않는다).
 * 값이 바뀐 채 다른 역할 · 목록으로 가면 "작성한 내용이 사라져요" 를 묻는다(dirty 는 페이지에도 알려 탭 전환을 막는다).
 */
export const RoleManagementPanel = ({ onDirtyChange, discard }: { onDirtyChange: (dirty: boolean) => void; discard: ReturnType<typeof useDiscardGuard>['guard'] }) => {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const desktop = useDesktop()
  const snackbar = useSnackbar()
  const { hasPermission } = usePermission()
  const canManage = hasPermission('ROLE:MANAGE')
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const rolesQ = useRolesQuery({ quiet: true })
  const permsQ = usePermissionsQuery({ quiet: true })
  const { mutateAsync: createRole } = usePostRoleMutation()
  const { mutateAsync: putRole } = usePutRoleMutation()
  const { mutateAsync: putPerms } = usePutRolePermissionsMutation()
  const { mutateAsync: deleteRole } = useDeleteRoleMutation()
  const deleteConfirm = useConfirmTarget<{ code: string; name: string }>()
  const [creating, setCreating] = useState(false)
  const [edits, setEdits] = useState<RoleDraft | null>(null)
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(false)

  const roles = rolesQ.data ?? []
  const permissions = permsQ.data ?? []
  const param = params.get('role')
  // 데스크톱은 처음 첫 역할을 고른다(지금 그대로), 폰은 목록이 처음 화면이다
  const selectedCode = creating ? null : roles.some((r) => r.role_code === param) ? param : desktop ? (roles[0]?.role_code ?? null) : null
  const selected = roles.find((r) => r.role_code === selectedCode)
  const base: RoleDraft | null = creating ? EMPTY_DRAFT : selected ? draftOf(selected) : null
  const draft: RoleDraft | null = creating ? (edits ?? EMPTY_DRAFT) : selected ? (edits && edits.code === selected.role_code ? edits : base) : null
  const changes = base && draft ? changesOf(base, draft) : { desc: false, perms: false }
  const descEmpty = !creating && changes.desc && !draft?.desc.trim()
  const dirty = creating ? !!edits && (!!edits.code || !!edits.name || !!edits.desc || edits.perms.length > 0) : changes.desc || changes.perms

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange])
  // 새로 고침 · 탭 닫기도 바뀐 값이 있거나 저장 중일 때 브라우저 확인을 건다(사이드바 이동은 라우터가 막지 못한다)
  useBeforeUnloadWhile(dirty || busy)

  const resetEdits = () => {
    setEdits(null)
    setSaveError(null)
    setCodeError(null)
    setShowErrors(false)
  }
  const choose = (code: string | null) => {
    discard(() => {
      resetEdits()
      setCreating(false)
      if (code) {
        // 목록에서 처음 열 때만 기록을 쌓는다(← 가 그 한 칸을 되감는다) — 이미 연 상태에서 다른 역할로 가면 바꿔 쓴다
        const next = new URLSearchParams(params)
        next.set('role', code)
        if (param) setParams(next, { replace: true, state: location.state })
        else navigate({ search: next.toString() }, { state: { fromList: true } })
      } else if ((location.state as { fromList?: boolean } | null)?.fromList) {
        navigate(-1)
      } else {
        const next = new URLSearchParams(params)
        next.delete('role')
        setParams(next, { replace: true })
      }
    })
  }
  const add = () =>
    discard(() => {
      resetEdits()
      setCreating(true)
    })

  const save = async () => {
    if (!draft || busy || !canManage || descEmpty) return
    if (creating && (!draft.code.trim() || !draft.name.trim())) {
      setShowErrors(true)
      return
    }
    setBusy(true)
    setSaveError(null)
    setCodeError(null)
    try {
      if (creating) {
        await createRole({ role_code: draft.code.trim(), role_name: draft.name.trim(), desc: draft.desc, permission_codes: draft.perms })
        await rolesQ.refetch()
        resetEdits()
        setCreating(false)
        const next = new URLSearchParams(params)
        next.set('role', draft.code.trim())
        setParams(next)
        snackbar.show({ message: t('authority.roleCreatedToast'), tone: 'positive' })
      } else if (selected) {
        if (changes.desc) await putRole({ roleCode: selected.role_code, data: { desc: draft.desc } })
        if (changes.perms) await putPerms({ roleCode: selected.role_code, data: { permission_codes: draft.perms } })
        await rolesQ.refetch()
        resetEdits()
        snackbar.show({ message: t('authority.roleSavedToast'), tone: 'positive' })
      }
    } catch (error) {
      const { code, key } = readWriteFailure(error)
      if (code === 'PERMISSION_003') setCodeError(tc('failure.code.roleExists'))
      else if (key) setSaveError(tc(key))
      // 앞 요청이 이미 먹었을 수 있다 — 서버 값을 다시 받아 맞춘다(값은 화면에 남는다)
      void rolesQ.refetch()
    } finally {
      setBusy(false)
    }
  }

  const detail = draft && (
    <RoleDetail
      key={creating ? '__new' : selectedCode}
      draft={draft}
      isNew={creating}
      permissions={permissions}
      canManage={canManage}
      desktop={desktop}
      busy={busy}
      dirty={dirty}
      descEmpty={descEmpty}
      saveError={saveError}
      codeError={codeError}
      showErrors={showErrors}
      onChange={setEdits}
      onSave={() => void save()}
      onDelete={creating || !selected ? undefined : () => deleteConfirm.ask({ code: selected.role_code, name: selected.role_name })}
      onBack={() => choose(null)}
    />
  )

  const list = <RoleList roles={roles} selected={selectedCode} creating={creating} onSelect={(c) => (c !== selectedCode || creating ? choose(c) : undefined)} onAdd={add} />

  const body =
    roles.length === 0 && !creating ? (
      <ResultSection
        size='medium'
        icon={<Shield />}
        title={t('authority.noRoles')}
        description={t('authority.noRolesDesc')}
        primaryAction={canManage ? { label: t('authority.addRole'), onClick: add } : undefined}
      />
    ) : desktop ? (
      <ResizablePanelGroup direction='horizontal' className='min-h-[32rem] rounded-r3 border border-stroke-neutral-subtle bg-bg-layer-default' data-role-split>
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          {list}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={75}>
          {detail ?? <div className='p-x6 text-t4 text-fg-neutral-muted'>{t('authority.selectRoleToView')}</div>}
        </ResizablePanel>
      </ResizablePanelGroup>
    ) : (
      <div className='bg-bg-layer-default'>{detail ?? list}</div>
    )

  return (
    <>
      <LoadingRegion
        pending={rolesQ.isPending || permsQ.isPending}
        failed={rolesQ.isLoadingError || permsQ.isLoadingError}
        fallback={<PanelSkeleton />}
        failure={
          <ResultSection
            kind='failure'
            size='medium'
            title={t('authority.failureTitle')}
            description={t('users.failureDescription')}
            primaryAction={{ label: tc('retry'), onClick: () => { void rolesQ.refetch(); void permsQ.refetch() }, loading: rolesQ.isFetching || permsQ.isFetching }}
          />
        }
      >
        {body}
      </LoadingRegion>
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title={t('authority.deleteRoleTitle')}
        description={t('authority.confirmDeleteRole', { name: deleteConfirm.target?.name })}
        onConfirm={async () => {
          const code = deleteConfirm.target?.code
          if (!code) return
          await deleteRole(code)
          await rolesQ.refetch()
          resetEdits()
          const next = new URLSearchParams(params)
          next.delete('role')
          setParams(next, { replace: true })
        }}
        onDone={() => snackbar.show({ message: t('authority.roleDeletedToast'), tone: 'positive' })}
      />
    </>
  )
}
