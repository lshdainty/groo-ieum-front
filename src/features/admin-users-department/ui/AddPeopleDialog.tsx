import { useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { claimFailure, writeFailureKey } from '@/shared/api/failure'
import { Avatar } from '@/shared/ds/avatar'
import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogCancel,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
} from '@/shared/ds/dialog'
import { Input } from '@/shared/ds/input'
import { ListCheckGroup, ListCheckItem } from '@/shared/ds/list'
import { ResultSection } from '@/shared/ds/result-section'
import { matchesSearch } from '@/shared/ds/searchable-list'
import { useSnackbar } from '@/shared/ds/snackbar'
import { PanelFailure } from '@/features/admin-company/ui/DepartmentTreePanel'
import { MemberListSkeleton } from './DepartmentMembers'
import { useDepartmentUsersQuery, usePostDepartmentUsersMutation } from '@/entities/department'

/**
 * 사람 추가(E 26) — Responsive Dialog `form`(1280 이상 Dialog 480 · 미만 Bottom Sheet). 위 검색칸 "이름 · 아이디 검색" · 아래 여럿 고르기 줄(체크 24 · Avatar · 이름 · 아이디).
 * 목록 = 이 부서에 없는 사람(서버가 주는 `users_not_in_department`). 바닥 [취소] [{n}명 추가] — 0명이면 누를 때 "추가할 사람을 골라주세요." 를 목록 위에(버튼은 켜 둔다).
 * 저장 = 지금 `postDepartmentUsers` — 늘 `main_yn: 'N'`(주 부서는 넣은 뒤 정한다). 하나라도 체크하면 닫을 때 "작성한 내용이 사라져요".
 */
export function AddPeopleDialog({
  open,
  onOpenChange,
  departmentId,
  deptName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  departmentId: number
  deptName: string
}) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const snackbar = useSnackbar()
  const post = usePostDepartmentUsersMutation()
  // 받아 둔 목록(부서 화면이 이미 받은 것)을 그대로 쓴다 — 화면 폭이 바뀌어도 이 시트가 자기 부서를 안다
  const membersQuery = useDepartmentUsersQuery(departmentId, { quiet: true })
  const candidates = membersQuery.data?.users_not_in_department ?? []
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [showError, setShowError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const shown = useMemo(() => candidates.filter((u) => matchesSearch(query, u.user_name, u.user_id)), [candidates, query])

  const toggle = (id: string, on: boolean) => {
    setShowError(false)
    setPicked((list) => (on ? [...list, id] : list.filter((x) => x !== id)))
  }

  const submit = async () => {
    if (busy) return
    if (picked.length === 0) {
      setShowError(true)
      return
    }
    setBusy(true)
    setSaveError(null)
    try {
      await post.mutateAsync({ departmentId, data: { users: picked.map((user_id) => ({ user_id, main_yn: 'N' as const })) } })
      snackbar.show({ message: t('department.members.added', { count: picked.length, dept: deptName }), tone: 'positive' })
      onOpenChange(false)
    } catch (error) {
      claimFailure(error)
      const key = writeFailureKey(error)
      if (key) setSaveError(key === 'failure.write' ? t('department.members.addFailed') : tc(key))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ResponsiveDialog open={open} form dirty={picked.length > 0} busy={busy} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        title={t('department.members.add')}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          searchRef.current?.focus({ preventScroll: true })
        }}
      >
        <ResponsiveDialogBody>
          {saveError && (
            <Callout tone='critical' role='alert' className='mb-x4' data-save-failure>
              {saveError}
            </Callout>
          )}
          <Input
            ref={searchRef}
            variant='underline'
            prefixIcon={<Search />}
            clearable
            aria-label={t('department.members.search')}
            placeholder={t('department.members.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {showError && (
            <p role='alert' data-pick-error className='m-0 pt-x3 text-t4 text-fg-critical'>
              {t('department.members.pickError')}
            </p>
          )}
          <div className='-mx-x6 pt-x2'>
            {membersQuery.isPending ? (
              <MemberListSkeleton />
            ) : membersQuery.isError && !membersQuery.data ? (
              <PanelFailure title={t('department.members.failure', { dept: deptName })} onRetry={() => void membersQuery.refetch()} retrying={membersQuery.isFetching} />
            ) : candidates.length === 0 ? (
              <ResultSection size='medium' icon={<Search />} title={t('department.members.noneToAdd')} />
            ) : shown.length === 0 ? (
              <ResultSection size='medium' icon={<Search />} title={t('department.members.searchEmpty')} />
            ) : (
              <ListCheckGroup aria-label={t('department.members.add')}>
                {shown.map((u) => (
                  <ListCheckItem
                    key={u.user_id}
                    title={u.user_name}
                    detail={<span className='break-all'>{u.user_id}</span>}
                    prefix={<Avatar name={u.user_name} size={36} />}
                    checked={picked.includes(u.user_id)}
                    onCheckedChange={(v) => toggle(u.user_id, v === true)}
                  />
                ))}
              </ListCheckGroup>
            )}
          </div>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <ResponsiveDialogCancel>{tc('cancel')}</ResponsiveDialogCancel>
          <Button loading={busy} onClick={() => void submit()}>
            {t('department.members.submit', { count: picked.length })}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
