import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Building2, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

import { hasPreviousEntry } from '@/shared/ds/top-navigation/top-navigation-context'
import { LoadingRegion, Skeleton } from '@/shared/ds/skeleton'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/shared/ds/resizable'
import { ResultSection } from '@/shared/ds/result-section'
import { useSnackbar } from '@/shared/ds/snackbar'
import { SCREEN_TITLE_BOX, ScreenBody } from '@/widgets/layout/ui/ScreenBody'
import { ScreenTitle } from '@/shared/ds/top-navigation'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { useScreenHeader } from '@/widgets/layout/lib/screen-header'
import { useCompanyQuery, useCompanyWithDepartmentsQuery, type GetCompanyResp } from '@/entities/company'
import { useDeleteDepartmentUsersMutation, useDepartmentUsersQuery, usePutMainDepartmentMutation, type UserInfo } from '@/entities/department'
import { useUsersQuery } from '@/entities/user'
import { findDept, firstDeptId, type Dept } from '@/features/admin-company/lib/dept-tree'
import { DepartmentTreePanel, PanelFailure, TreeSkeleton } from '@/features/admin-company/ui/DepartmentTreePanel'
import { useDepartmentContext } from '../model/DepartmentContext'
import { AddPeopleDialog } from './AddPeopleDialog'
import { DepartmentMembers, MemberListSkeleton, MembersHeader } from './DepartmentMembers'

const DepartmentInner = ({ company }: { company: GetCompanyResp }) => {
  const { t } = useTranslation('admin')
  const { t: tMenu } = useTranslation('sidebar')
  const desktop = useDesktop()
  const snackbar = useSnackbar()
  const [params, setParams] = useSearchParams()
  const { selectedDeptId, setSelectedDeptId } = useDepartmentContext()
  const tree = useCompanyWithDepartmentsQuery(company.company_id, { quiet: true })
  const departments = useMemo(() => tree.data?.departments ?? [], [tree.data])

  // 데스크톱: 고른 부서(없으면 최상위 첫 부서). 폰: 주소의 `?dept=` — 있으면 그 부서 화면, 없으면 나무 화면
  const paramId = Number(params.get('dept')) || null
  const phoneDept = paramId != null ? findDept(departments, paramId) : null
  const deskDept = (selectedDeptId != null ? findDept(departments, selectedDeptId) : null) ?? findDept(departments, firstDeptId(departments) ?? -1)
  const current = desktop ? deskDept : phoneDept

  const members = useDepartmentUsersQuery(current?.department_id ?? 0, { quiet: true })
  const removeUser = useDeleteDepartmentUsersMutation()
  const setMain = usePutMainDepartmentMutation()
  const users = useUsersQuery({ quiet: true })
  // 줄마다 로딩 — 두 줄을 빠르게 눌러도 서로의 로딩을 끄지 않는다
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())
  const markBusy = (id: string, on: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  const mainDeptOf = (userId: string) => users.data?.find((u) => u.user_id === userId)?.main_department_name_kr ?? null
  const [addForm, setAddForm] = useState<{ key: number; open: boolean; dept: Dept | null }>({ key: 0, open: false, dept: null })
  const currentDept = current
  const openAdd = useCallback(() => setAddForm((f) => ({ key: f.key + 1, open: true, dept: currentDept })), [currentDept])

  const select = (id: number) => {
    if (desktop) setSelectedDeptId(id)
    else setParams({ dept: String(id) })
  }
  // 폰 ← — 앞 화면(나무)이 있으면 되감고, 주소로 바로 들어왔으면 `?dept=` 만 걷는다
  const back = useCallback(() => {
    if (hasPreviousEntry()) window.history.back()
    else setParams({}, { replace: true })
  }, [setParams])

  const plusIcon = useMemo(() => <Plus />, [])
  useScreenHeader(
    !desktop && phoneDept
      ? {
          title: phoneDept.department_name_kr,
          onBack: back,
          action: { label: t('department.members.add'), icon: plusIcon, onClick: openAdd },
        }
      : null,
  )

  const remove = async (user: UserInfo) => {
    if (!current || busyIds.has(user.user_id)) return
    markBusy(user.user_id, true)
    try {
      await removeUser.mutateAsync({ departmentId: current.department_id, data: { user_ids: [user.user_id] } })
      snackbar.show({
        message: t(user.main_yn === 'Y' ? 'department.members.removedMain' : 'department.members.removed', { name: user.user_name, dept: current.department_name_kr }),
        tone: 'positive',
      })
    } catch {
      // 실패는 쓰기 그물(고정 글 Snackbar — 22-1 사유 표)이 알린다
    } finally {
      markBusy(user.user_id, false)
    }
  }

  const makeMain = async (user: UserInfo) => {
    if (!current || busyIds.has(user.user_id)) return
    markBusy(user.user_id, true)
    try {
      await setMain.mutateAsync({ departmentId: current.department_id, userId: user.user_id })
      snackbar.show({ message: t('department.members.mainSet', { name: user.user_name, dept: current.department_name_kr }), tone: 'positive' })
    } catch {
      // 실패는 쓰기 그물이 알린다
    } finally {
      markBusy(user.user_id, false)
    }
  }

  const treeFailure = <PanelFailure title={t('department.treeFailure')} onRetry={() => void tree.refetch()} retrying={tree.isFetching} />
  const treePanel = (hideHeader: boolean) => (
    <LoadingRegion pending={tree.isPending} failed={tree.isLoadingError} fallback={<TreeSkeleton />} failure={treeFailure} className='flex min-h-0 flex-1 flex-col'>
      <DepartmentTreePanel
        departments={departments}
        selectedId={desktop ? (deskDept?.department_id ?? null) : (phoneDept?.department_id ?? null)}
        onSelect={select}
        mode='fixed'
        hideHeader={hideHeader}
      />
    </LoadingRegion>
  )

  const deptName = current?.department_name_kr ?? ''
  const membersBody = current ? (
    <LoadingRegion
      pending={members.isPending}
      failed={members.isLoadingError}
      fallback={<MemberListSkeleton />}
      failure={
        <PanelFailure title={t('department.members.failure', { dept: deptName })} onRetry={() => void members.refetch()} retrying={members.isFetching} />
      }
    >
      <DepartmentMembers
        deptName={deptName}
        users={members.data?.users_in_department ?? []}
        mainDeptOf={mainDeptOf}
        onSetMain={(u) => void makeMain(u)}
        onRemove={(u) => void remove(u)}
        onAdd={openAdd}
        busyIds={busyIds}
      />
    </LoadingRegion>
  ) : null

  const addDialog = addForm.dept ? (
    <AddPeopleDialog
      key={addForm.key}
      open={addForm.open}
      onOpenChange={(open) => setAddForm((f) => ({ ...f, open }))}
      departmentId={addForm.dept.department_id}
      deptName={addForm.dept.department_name_kr}
    />
  ) : null

  // 사람 추가 시트(addDialog)는 폭과 상관없이 같은 자리에 둔다 — 768 을 넘나들어도 열린 시트가 다시 만들어지지 않는다
  const layout = !desktop ? (
    <div className='min-h-full bg-bg-layer-default'>
      {phoneDept ? membersBody : <div className='flex flex-col'>{treePanel(true)}</div>}
    </div>
  ) : (
    <ScreenBody density='high'>
      <div className={SCREEN_TITLE_BOX}>
        <ScreenTitle>{tMenu('menu.adminUsersDepartment')}</ScreenTitle>
      </div>
      <div className='h-[calc(100svh-180px)] min-h-[480px]'>
        <ResizablePanelGroup
          storageKey='hr-admin-dept-members'
          className='overflow-hidden rounded-r4 border border-solid border-stroke-neutral-weak bg-bg-layer-default'
        >
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className='flex flex-col'>
            {treePanel(false)}
          </ResizablePanel>
          <ResizableHandle label={t('department.resizeLabel')} />
          <ResizablePanel className='flex flex-col'>
            {current && (
              <>
                <MembersHeader deptName={deptName} count={members.data ? members.data.users_in_department.length : null} onAdd={openAdd} />
                <div className='min-h-0 flex-1 overflow-y-auto'>{membersBody}</div>
              </>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </ScreenBody>
  )

  return (
    <>
      {layout}
      {addDialog}
    </>
  )
}

/** 부서 배치 전체 — 회사를 받는 동안 · 실패 · 회사 없음을 먼저 가르고, 있으면 나무 + 사람 목록 */
export const DepartmentContent = () => {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { t: tMenu } = useTranslation('sidebar')
  const desktop = useDesktop()
  const query = useCompanyQuery({ quiet: true })
  const company = query.data

  const frame = (children: ReactNode) => (
    <ScreenBody density='high'>
      <div className={SCREEN_TITLE_BOX}>
        <ScreenTitle>{tMenu('menu.adminUsersDepartment')}</ScreenTitle>
      </div>
      {children}
    </ScreenBody>
  )

  if (query.isPending) {
    return frame(
      <div className={desktop ? 'overflow-hidden rounded-r4 border border-solid border-stroke-neutral-weak bg-bg-layer-default' : 'bg-bg-layer-default'}>
        <Skeleton text='t5' className='m-x4 block w-1/3' />
        <TreeSkeleton />
      </div>,
    )
  }
  if (query.isLoadingError || !company) {
    return frame(
      <ResultSection
        kind='failure'
        title={t('company.loadFailed')}
        description={t('department.failureDesc')}
        primaryAction={{ label: tc('retry'), onClick: () => void query.refetch(), loading: query.isFetching }}
      />,
    )
  }
  if (!company.company_id) {
    return frame(
      <div className={desktop ? '' : 'min-h-full bg-bg-layer-default'}>
        <ResultSection icon={<Building2 />} title={t('company.emptyTitle')} description={t('department.members.noCompanyDesc')} />
      </div>,
    )
  }
  return <DepartmentInner company={company} />
}
