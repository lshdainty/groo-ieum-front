import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/shared/ds/resizable'
import { ResultSection } from '@/shared/ds/result-section'
import { LoadingRegion, Skeleton } from '@/shared/ds/skeleton'
import { useSnackbar } from '@/shared/ds/snackbar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ds/tabs'
import { ScreenBody, ScreenTitleRow } from '@/widgets/layout/ui/ScreenBody'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { ConfirmDialog, useConfirmTarget } from '@/shared/ui/confirm'
import { useCompanyQuery, useCompanyWithDepartmentsQuery, type GetCompanyResp } from '@/entities/company'
import { useDeleteDepartmentMutation } from '@/entities/department'
import { useCompanyContext } from '../model/CompanyContext'
import { countDepts, findDept, firstDeptId, type Dept } from '../lib/dept-tree'
import { ChartSkeleton, DepartmentChartPanel } from './DepartmentChartPanel'
import { DepartmentFormDialog, type DepartmentFormTarget } from './DepartmentFormDialog'
import { DepartmentTreePanel, PanelFailure, PanelHeader, TreeSkeleton } from './DepartmentTreePanel'
import { CompanyFormDialog } from './CompanyFormDialog'

/** 회사 줄(폰) · 제목 줄 오른쪽(데스크톱)의 [회사 정보 수정] */
const EditCompanyButton = ({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation('admin')
  return (
    <Button variant='neutralOutline' size='small' onClick={onClick}>
      {t('company.editBtn')}
    </Button>
  )
}

const CompanyInner = ({ company }: { company: GetCompanyResp }) => {
  const { t } = useTranslation('admin')
  const { t: tMenu } = useTranslation('sidebar')
  const desktop = useDesktop()
  const snackbar = useSnackbar()
  const { selectedDeptId, setSelectedDeptId } = useCompanyContext()
  const query = useCompanyWithDepartmentsQuery(company.company_id, { quiet: true })
  const deleteDepartment = useDeleteDepartmentMutation()
  const deleteConfirm = useConfirmTarget<Dept>()
  const departments = useMemo(() => query.data?.departments ?? [], [query.data])
  const [tab, setTab] = useState('dept')
  // 조직도가 패널보다 넓으면 가운데(맨 위 부서)부터 보인다 — 왼쪽 끝에서 시작하면 맨 위 상자가 화면 밖이다
  const chartScroll = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = chartScroll.current
    if (el) el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2)
  }, [query.data, tab, desktop])

  // 고른 부서가 없거나(처음) 지워졌으면 최상위 첫 부서 — 방금 만든 부서는 나무를 다시 받으면 고른 줄이 된다
  const selected = selectedDeptId != null ? findDept(departments, selectedDeptId) : null
  const selectedId = selected?.department_id ?? firstDeptId(departments)

  // 폼 — 열 때마다 새로 만들어 값이 지난번 것을 물려받지 않는다
  const [companyForm, setCompanyForm] = useState<{ key: number; open: boolean }>({ key: 0, open: false })
  const [deptForm, setDeptForm] = useState<{ key: number; open: boolean; target: DepartmentFormTarget }>({
    key: 0,
    open: false,
    target: { kind: 'add', parent: null },
  })
  const openDept = (target: DepartmentFormTarget) => setDeptForm((f) => ({ key: f.key + 1, open: true, target }))

  const actions = {
    onAddChild: (dept: Dept) => openDept({ kind: 'add', parent: dept }),
    onEdit: (dept: Dept) => openDept({ kind: 'edit', dept }),
    onDelete: (dept: Dept) => deleteConfirm.ask(dept),
  }

  const treeFailure = (
    <PanelFailure title={t('department.treeFailure')} onRetry={() => void query.refetch()} retrying={query.isFetching} />
  )
  const chartFailure = (
    <PanelFailure title={t('department.chartFailure')} onRetry={() => void query.refetch()} retrying={query.isFetching} />
  )

  const treeBody = (
    <LoadingRegion
      pending={query.isPending}
      failed={query.isLoadingError}
      fallback={<TreeSkeleton />}
      failure={treeFailure}
      className='flex min-h-0 flex-1 flex-col'
    >
      <DepartmentTreePanel
        departments={departments}
        selectedId={selectedId}
        onSelect={setSelectedDeptId}
        actions={actions}
        empty={{ onAdd: () => openDept({ kind: 'add', parent: null }) }}
      />
    </LoadingRegion>
  )

  const chartBody = (
    <LoadingRegion pending={query.isPending} failed={query.isLoadingError} fallback={<ChartSkeleton />} failure={chartFailure}>
      <DepartmentChartPanel departments={departments} />
    </LoadingRegion>
  )

  const chartHeader = (
    <PanelHeader
      id='dept-chart-title'
      title={t('department.chart')}
      action={
        departments.length > 0 ? (
          <span className='pr-x2 text-t3 text-fg-neutral-subtle'>{t('department.chartCount', { count: countDepts(departments) })}</span>
        ) : undefined
      }
    />
  )

  const dialogs = (
    <>
      <CompanyFormDialog key={`c${companyForm.key}`} open={companyForm.open} onOpenChange={(open) => setCompanyForm((f) => ({ ...f, open }))} company={company} />
      <DepartmentFormDialog
        key={`d${deptForm.key}`}
        open={deptForm.open}
        onOpenChange={(open) => setDeptForm((f) => ({ ...f, open }))}
        target={deptForm.target}
        departments={departments}
        companyId={company.company_id}
        onSaved={(id) => {
          if (id != null) setSelectedDeptId(id)
        }}
      />
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title={t('department.deleteTitle')}
        description={t('department.deleteConfirm', { name: deleteConfirm.target?.department_name_kr })}
        onConfirm={async () => {
          if (deleteConfirm.target) await deleteDepartment.mutateAsync(deleteConfirm.target.department_id)
        }}
        onDone={() => snackbar.show({ message: t('department.deleted', { name: deleteConfirm.target?.department_name_kr }), tone: 'positive' })}
      />
    </>
  )

  const editCompany = () => setCompanyForm((f) => ({ key: f.key + 1, open: true }))

  // 폼 · 확인창(dialogs)은 폭과 상관없이 같은 자리에 둔다 — 768 을 넘나들어도 열린 폼이 다시 만들어지지 않는다
  const layout = !desktop ? (
      <div className='min-h-full bg-bg-layer-default'>
        <div className='flex items-center justify-between gap-x2 px-x6 py-x3'>
          <p className='m-0 min-w-0 break-keep text-t5 font-bold text-fg-neutral [overflow-wrap:break-word]'>{company.company_name}</p>
          <EditCompanyButton onClick={editCompany} />
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList layout='fill' size='medium' aria-label={tMenu('menu.adminCompany')}>
            <TabsTrigger value='dept'>{t('department.title')}</TabsTrigger>
            <TabsTrigger value='chart'>{t('department.chart')}</TabsTrigger>
          </TabsList>
          <TabsContent value='dept'>
            <div className='flex flex-col'>{treeBody}</div>
          </TabsContent>
          <TabsContent value='chart'>
            {chartHeader}
            <div ref={chartScroll} className='overflow-x-auto'>{chartBody}</div>
          </TabsContent>
        </Tabs>
      </div>
  ) : (
    <ScreenBody density='high'>
      <ScreenTitleRow title={tMenu('menu.adminCompany')} description={company.company_name} action={<EditCompanyButton onClick={editCompany} />} />
      <div className='h-[calc(100svh-180px)] min-h-[480px]'>
        <ResizablePanelGroup
          storageKey='hr-admin-company'
          className='overflow-hidden rounded-r4 border border-solid border-stroke-neutral-weak bg-bg-layer-default'
        >
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className='flex flex-col'>
            {treeBody}
          </ResizablePanel>
          <ResizableHandle label={t('department.resizeLabel')} />
          <ResizablePanel className='flex flex-col'>
            {chartHeader}
            <div ref={chartScroll} className='min-h-0 flex-1 overflow-auto'>{chartBody}</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </ScreenBody>
  )

  return (
    <>
      {layout}
      {dialogs}
    </>
  )
}

/** 회사 관리 전체 — 회사를 받는 동안 · 실패 · 회사 없음을 먼저 가르고, 있으면 나무 + 조직도 */
export const CompanyContent = () => {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { t: tMenu } = useTranslation('sidebar')
  const desktop = useDesktop()
  const query = useCompanyQuery({ quiet: true })
  const [create, setCreate] = useState<{ key: number; open: boolean }>({ key: 0, open: false })
  const company = query.data

  const frame = (children: ReactNode) => (
    <ScreenBody density='high'>
      <ScreenTitleRow title={tMenu('menu.adminCompany')} />
      {children}
    </ScreenBody>
  )

  if (query.isPending) {
    return frame(
      <div className={desktop ? 'h-[calc(100svh-180px)] min-h-[480px] overflow-hidden rounded-r4 border border-solid border-stroke-neutral-weak bg-bg-layer-default' : 'bg-bg-layer-default'}>
        <div className='flex items-center justify-between px-x6 py-x3'>
          <Skeleton text='t5' className='block w-1/3' />
        </div>
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
    return (
      <>
        {frame(
          <div className={desktop ? '' : 'min-h-full bg-bg-layer-default'}>
            <ResultSection
              icon={<Building2 />}
              title={t('company.emptyTitle')}
              description={t('company.emptyDesc')}
              primaryAction={{ label: t('company.createBtn'), onClick: () => setCreate((c) => ({ key: c.key + 1, open: true })) }}
            />
          </div>,
        )}
        <CompanyFormDialog key={create.key} open={create.open} onOpenChange={(open) => setCreate((c) => ({ ...c, open }))} />
      </>
    )
  }
  return <CompanyInner company={company} />
}
