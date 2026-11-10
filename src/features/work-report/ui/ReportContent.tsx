import dayjs from 'dayjs'
import { EllipsisVertical, FileText, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { claimFailure } from '@/shared/api/failure'
import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import { Card, CardHeader, CardTitle } from '@/shared/ds/card'
import { FloatingActionButton } from '@/shared/ds/floating-action-button'
import { ResponsiveMenu, ResponsiveMenuTrigger } from '@/shared/ds/menu'
import { ResultSection } from '@/shared/ds/result-section'
import { LoadingRegion, Skeleton } from '@/shared/ds/skeleton'
import { useSnackbar } from '@/shared/ds/snackbar'
import { readWriteFailure } from '@/shared/ui/groo/write-error'
import { useConfirmTarget } from '@/shared/ui/confirm'
import { usePermission, useUser } from '@/entities/session'
import { useUsersQuery } from '@/entities/user'
import {
  useBulkCreateWorkHistoriesMutation,
  useDeleteWorkHistoryMutation,
  usePostCreateWorkHistoryMutation,
  usePutUpdateWorkHistoryMutation,
  useWorkDivisionQuery,
  useWorkGroupsWithPartsQuery,
  useWorkHistoriesQuery,
  useWorkHistoryExcelDownloadMutation,
  type CreateWorkHistoryReq,
} from '@/entities/work'
import { useScreenHeader } from '@/widgets/layout/lib/screen-header'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { useWide } from '@/widgets/layout/lib/use-wide'
import { SCREEN_TITLE_BOX, ScreenBody } from '@/widgets/layout/ui/ScreenBody'
import { ScreenTitle } from '@/shared/ds/top-navigation'
import { isExcelPeriodValid } from '../model/excelPeriod'
import { useReportContext } from '../model/ReportContext'
import type { WorkDraft, WorkRow } from '../model/types'
import { searchConditionOf } from '../lib/report-filter'
import { draftChanged, draftErrors, draftOf, hasDraftErrors, newDraft } from '../lib/report-form'
import { rowActions, rowOf } from '../lib/report-format'
import { templateCsv } from '../lib/report-template'
import { ExcelImportDialog } from './ExcelImportDialog'
import { ReportDeleteDialog } from './ReportDeleteDialog'
import { ReportFilterBar } from './ReportFilterBar'
import { ReportFormSheet } from './ReportFormSheet'
import { ReportPhoneList } from './ReportPhoneList'
import { ReportBulkBar, ReportTable, type RowHandlers } from './ReportTable'
import { ReportToolsMenuContent } from './ReportToolsMenu'
import { UnregisteredDownloadDialog } from './UnregisteredDownloadDialog'

const toBody = (d: WorkDraft): CreateWorkHistoryReq => ({
  work_date: d.date,
  work_user_id: d.managerId,
  work_group_code: d.groupCode,
  work_part_code: d.partCode,
  work_class_code: d.divisionCode,
  work_hour: d.hours,
  work_content: d.content.trim(),
})

const ReportListSkeleton = ({ desktop }: { desktop: boolean }) => (
  <div aria-hidden className='flex flex-col'>
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className={desktop ? 'flex h-[72px] items-center gap-x6 border-b border-stroke-neutral-subtle px-x6' : 'flex items-start gap-x3 px-x6 py-x3'}>
        {desktop ? (
          <>
            <Skeleton text='t4' className='block w-[64px]' />
            <Skeleton text='t4' className='block w-[96px]' />
            <Skeleton text='t4' className='block w-[18%]' />
            <Skeleton text='t4' className='block w-[18%]' />
            <Skeleton text='t4' className='block w-[30%]' />
          </>
        ) : (
          <>
            <div className='flex flex-1 flex-col gap-x1'>
              <Skeleton text='t5' className='block w-3/5' />
              <Skeleton text='t3' className='block w-4/5' />
            </div>
            <Skeleton text='t3' className='block w-[40px]' />
          </>
        )}
      </div>
    ))}
  </div>
)

/**
 * 업무 보고(I-25 H, HC11 A · HC12 A · HC13 B) — 제목 줄 [업무 추가] + ⋮(엑셀 넷) → 카드 "업무 기록": 칩 필터 바 → 일괄 작업 바 → 표(편집 줄 · Table Pagination) /
 * 폰: 상단 바 ⋮ + 흰 면(칩 줄 · "업무 기록" 머리 + 고르기 · 날짜 묶음 줄) + 떠 있는 + .
 * 읽기는 모두 `quiet` — 기록 목록 실패는 목록 자리의 Result Section + [다시 시도](그 질의만), 분류 · 구분 목록 실패는 알림 줄 + 추가 · 수정 막기(고를 값을 모르면 진행하지 못한다),
 * 사람 목록 실패는 담당자 칩 · 가져오기 안에서. 쓰기 실패는 폼 안 Callout(고정 글) · 확인창 Snackbar. 트리는 폭과 무관한 하나 — 폭이 바뀌어도 열린 편집은 같은 값으로 이어진다.
 */
export function ReportContent() {
  const { t } = useTranslation('work')
  const { t: tc } = useTranslation('common')
  const desktop = useDesktop()
  const wide = useWide()
  const snackbar = useSnackbar()
  const { loginUser } = useUser()
  const { hasPermission } = usePermission()
  const ctx = useReportContext()
  const { filters, selected, setSelected, selecting, setSelecting, draft, draftBase, setDraft, openDraft, closeDraft } = ctx

  const canWrite = hasPermission('WORK:WRITE')
  const canManage = hasPermission('WORK:MANAGE')
  const me = { id: loginUser?.user_id ?? '', name: loginUser?.user_name ?? '' }

  const groupsQ = useWorkGroupsWithPartsQuery({ quiet: true })
  const divisionQ = useWorkDivisionQuery({ quiet: true })
  const usersQ = useUsersQuery({ quiet: true })
  const condition = searchConditionOf(filters, groupsQ.data, divisionQ.data)
  const historiesQ = useWorkHistoriesQuery(condition, { quiet: true })

  const createM = usePostCreateWorkHistoryMutation()
  const updateM = usePutUpdateWorkHistoryMutation()
  const deleteM = useDeleteWorkHistoryMutation()
  const bulkM = useBulkCreateWorkHistoriesMutation()
  const exportM = useWorkHistoryExcelDownloadMutation()

  const groups = groupsQ.data ?? []
  const divisions = divisionQ.data ?? []
  const rows: WorkRow[] = (historiesQ.data ?? []).map(rowOf)
  const codesReady = !!groupsQ.data && !!divisionQ.data
  const codesFailed = groupsQ.isLoadingError || divisionQ.isLoadingError
  const retryCodes = () => {
    if (groupsQ.isLoadingError) void groupsQ.refetch()
    if (divisionQ.isLoadingError) void divisionQ.refetch()
  }
  const usersView = { data: usersQ.data ?? [], failed: usersQ.isLoadingError, fetching: usersQ.isFetching, refetch: () => void usersQ.refetch() }

  const [showErrors, setShowErrors] = useState(false)
  const [saveKey, setSaveKey] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkNote, setBulkNote] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [unregisteredOpen, setUnregisteredOpen] = useState(false)
  const confirm = useConfirmTarget<WorkRow>()

  const filtersKey = JSON.stringify(filters)
  const selectedRows = rows.filter((r) => selected.includes(r.id))
  const dirty = draft && draftBase ? draftChanged(draftBase, draft) : false

  // 고친 내용이 있는 채로 탭을 닫거나 새로 고치지 않게(시트는 ds 가 같은 일을 한다 — 표 안 편집 줄 몫)
  useEffect(() => {
    if (!dirty) return
    const guard = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', guard)
    return () => window.removeEventListener('beforeunload', guard)
  }, [dirty])

  const actionsOf = (row: WorkRow) => rowActions(row, { canWrite, canManage, loginId: me.id })

  const begin = (d: WorkDraft) => {
    setShowErrors(false)
    setSaveKey(null)
    setBulkNote(false)
    setSelecting(false)
    openDraft(d)
  }
  const close = () => {
    setShowErrors(false)
    setSaveKey(null)
    closeDraft()
  }
  const change = (patch: Partial<WorkDraft>) => {
    if (!draft) return
    setSaveKey(null)
    setDraft({ ...draft, ...patch })
  }

  const handlers: RowHandlers = {
    actionsOf,
    onEdit: (row) => begin(draftOf(row)),
    onDuplicate: (row) =>
      begin({
        ...newDraft(me),
        groupCode: row.group?.work_code ?? '',
        partCode: row.part?.work_code ?? '',
        divisionCode: row.division?.work_code ?? '',
        hours: Number(row.hours) || 0,
        content: row.content,
        duplicated: true,
      }),
    onDelete: (row) => confirm.ask(row),
  }

  const save = async () => {
    if (!draft || busy) return
    if (hasDraftErrors(draftErrors(draft))) {
      setShowErrors(true)
      setTimeout(() => document.querySelector<HTMLElement>('[data-report-edit] [aria-invalid="true"], [data-report-form] [aria-invalid="true"]')?.focus(), 0)
      return
    }
    setBusy(true)
    setSaveKey(null)
    try {
      if (draft.id === undefined) await createM.mutateAsync(toBody(draft))
      else await updateM.mutateAsync({ work_history_id: draft.id, ...toBody(draft) })
      await historiesQ.refetch()
      snackbar.show({ message: t(draft.duplicated ? 'rep.duplicated' : 'rep.saved'), tone: 'positive' })
      close()
    } catch (error) {
      setSaveKey(readWriteFailure(error).key ?? 'failure.write')
    } finally {
      setBusy(false)
    }
  }

  const deleteRow = async () => {
    const target = confirm.target
    if (!target) return
    await deleteM.mutateAsync(target.id)
    await historiesQ.refetch()
  }

  const duplicateSelected = async () => {
    if (selectedRows.length === 0 || bulkBusy) return
    if (selectedRows.some((r) => !r.group || !r.part || !r.division)) {
      setBulkNote(true)
      return
    }
    setBulkNote(false)
    setBulkBusy(true)
    try {
      const today = dayjs().format('YYYY-MM-DD')
      await Promise.all(
        selectedRows.map((r) =>
          createM.mutateAsync({
            work_date: today,
            work_user_id: me.id,
            work_group_code: r.group!.work_code,
            work_part_code: r.part!.work_code,
            work_class_code: r.division!.work_code,
            work_hour: Number(r.hours) || 0,
            work_content: r.content,
          }),
        ),
      )
      await historiesQ.refetch()
      setSelected([])
      setSelecting(false)
      snackbar.show({ message: t('rep.duplicatedCount', { count: selectedRows.length }), tone: 'positive' })
    } catch (error) {
      // 일부만 만들어졌을 수 있다 — 다시 시도 단추를 두지 않고 목록을 다시 받아 서버 값으로 맞춘다
      const { key } = readWriteFailure(error)
      void historiesQ.refetch()
      snackbar.show({ message: tc(key ?? 'failure.write'), tone: 'critical' })
    } finally {
      setBulkBusy(false)
    }
  }

  const registerRows = async (payload: CreateWorkHistoryReq[]) => {
    await bulkM.mutateAsync({ work_histories: payload })
    await historiesQ.refetch()
  }

  const exportExcel = async () => {
    if (!isExcelPeriodValid(condition.startDate, condition.endDate)) {
      snackbar.show({ message: t('rep.excelPeriodInvalid'), tone: 'critical' })
      return
    }
    try {
      const blob = await exportM.mutateAsync(condition)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${t('report.fileNamePrefix')}_${dayjs().format('YYYYMMDD')}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      claimFailure(error)
      snackbar.show({ message: t('rep.excelFailed'), tone: 'critical' })
    }
  }

  const downloadTemplate = () => {
    const header = [t('rep.colDate'), t('rep.colManager'), t('rep.colGroup'), t('rep.colPart'), t('rep.colDivision'), t('rep.colHours'), t('rep.colContent')]
    const blob = new Blob([templateCsv(header, groups, divisions, me.name)], { type: 'text/csv;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${t('rep.templateFile')}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  const addNew = () => begin(newDraft(me))

  // 폰 상단 바 오른쪽 ⋮ — 같은 엑셀 넷의 Menu Sheet. 데스크톱은 제목 줄이 맡는다
  useScreenHeader(desktop ? null : { action: { label: t('rep.tools'), icon: <EllipsisVertical />, onClick: () => setToolsOpen(true) } })

  const tools = (
    <ReportToolsMenuContent
      canImport={canWrite}
      onImport={() => setImportOpen(true)}
      onExport={() => void exportExcel()}
      onTemplate={downloadTemplate}
      onUnregistered={() => setUnregisteredOpen(true)}
    />
  )

  const addDisabled = !codesReady
  const empty = rows.length === 0
  const filterBar = <ReportFilterBar users={usersView} groups={groups} divisions={divisions} disabled={{ codes: !codesReady, all: !!draft && desktop }} />

  const codesAlert = codesFailed && (
    <div className='px-x6 pb-x3' data-codes-failed>
      <Callout tone='critical' role='alert'>
        <span className='block'>{t('rep.codesFailed')}</span>
        <Button variant='ghost' size='small' flush='left' loading={groupsQ.isFetching || divisionQ.isFetching} onClick={retryCodes} data-codes-retry>
          {tc('retry')}
        </Button>
      </Callout>
    </div>
  )

  const failure = (
    <ResultSection
      kind='failure'
      size='medium'
      title={t('rep.failureTitle')}
      description={t('rep.failureDescription')}
      primaryAction={{ label: tc('retry'), onClick: () => void historiesQ.refetch(), loading: historiesQ.isFetching }}
    />
  )
  const filteredNow = filtersKey !== JSON.stringify(ctx.base) && JSON.stringify({ ...filters, startDate: '', endDate: '' }) !== JSON.stringify({ ...ctx.base, startDate: '', endDate: '' })
  const emptyView = (
    <ResultSection
      size='medium'
      icon={<FileText />}
      title={t('rep.emptyTitle')}
      description={filteredNow ? t('rep.emptyFilteredDescription') : t('rep.emptyDescription')}
      primaryAction={canWrite && !addDisabled ? { label: t('rep.add'), icon: <Plus />, onClick: addNew } : undefined}
    />
  )

  const bulkBar = (
    <>
      <ReportBulkBar count={selectedRows.length} onClear={() => setSelected([])} onDuplicate={() => void duplicateSelected()} busy={bulkBusy} />
      {bulkNote && selectedRows.length > 0 && (
        <div className='px-x6 pb-x3' data-bulk-note>
          <Callout tone='critical' role='alert'>
            {t('rep.duplicateBlocked')}
          </Callout>
        </div>
      )}
    </>
  )

  const editProps = {
    errors: draftErrors(draft ?? newDraft(me)),
    showErrors,
    failure: saveKey ? tc(saveKey) : null,
    busy,
    onChange: change,
    onSave: () => void save(),
    onCancel: close,
  }

  const body = (
    <LoadingRegion pending={historiesQ.isPending} failed={historiesQ.isLoadingError} fallback={<ReportListSkeleton desktop={desktop} />} failure={failure}>
      {empty && !(draft && desktop) ? (
        emptyView
      ) : desktop ? (
        <ReportTable key={filtersKey} rows={rows} wide={wide} groups={groups} divisions={divisions} canWrite={canWrite} handlers={handlers} edit={editProps} />
      ) : (
        <ReportPhoneList key={filtersKey} rows={rows} handlers={handlers} />
      )}
    </LoadingRegion>
  )

  return (
    <ResponsiveMenu open={toolsOpen} onOpenChange={setToolsOpen}>
      <ScreenBody density='high'>
        <div className={SCREEN_TITLE_BOX}>
          <ScreenTitle actions={
            desktop ? (
              <div className='flex items-center gap-x2'>
                {canWrite && (
                  <Button variant='neutralOutline' size='small' disabled={addDisabled} onClick={addNew} data-create-work>
                    <Plus aria-hidden />
                    {t('rep.add')}
                  </Button>
                )}
                <ResponsiveMenuTrigger asChild>
                  <Button variant='neutralOutline' size='small' layout='iconOnly' aria-label={t('rep.tools')} data-report-tools>
                    <EllipsisVertical />
                  </Button>
                </ResponsiveMenuTrigger>
              </div>
            ) : undefined
          }>
            {t('rep.title')}
          </ScreenTitle>
        </div>
        {desktop ? (
          <Card body='list' data-report-card>
            <CardHeader>
              <CardTitle>{t('rep.tableTitle')}</CardTitle>
            </CardHeader>
            {filterBar}
            {codesAlert}
            {bulkBar}
            {body}
          </Card>
        ) : (
          <section className='bg-bg-layer-default pb-[96px]' data-report-card>
            <div className='pt-x2'>{filterBar}</div>
            <div className='flex items-center justify-between gap-x2 px-x6 pb-x1 pt-x4'>
              <h2 className='m-0 text-t5 font-bold text-fg-neutral'>{t('rep.tableTitle')}</h2>
              {canWrite && !empty && (
                <Button
                  variant='ghost'
                  size='small'
                  flush='right'
                  onClick={() => {
                    setSelecting(!selecting)
                    setSelected([])
                    setBulkNote(false)
                  }}
                  data-select-toggle
                >
                  {selecting ? t('rep.selectDone') : t('rep.select')}
                </Button>
              )}
            </div>
            {codesAlert}
            {selecting && <div className='px-x6'>{bulkBar}</div>}
            {body}
          </section>
        )}
        {!desktop && canWrite && !selecting && !draft && <FloatingActionButton icon={<Plus />} aria-label={t('rep.add')} disabled={addDisabled} onClick={addNew} data-create-work />}
      </ScreenBody>
      {tools}

      {!desktop && draft && (
        <ReportFormSheet
          groups={groups}
          divisions={divisions}
          errors={editProps.errors}
          showErrors={showErrors}
          failure={editProps.failure}
          busy={busy}
          onChange={change}
          onSave={() => void save()}
          onClose={close}
          onDelete={
            draft.id !== undefined && rows.find((r) => r.id === draft.id) && actionsOf(rows.find((r) => r.id === draft.id)!).remove
              ? () => confirm.ask(rows.find((r) => r.id === draft.id)!)
              : undefined
          }
          onDuplicate={draft.id !== undefined && rows.find((r) => r.id === draft.id) ? () => handlers.onDuplicate(rows.find((r) => r.id === draft.id)!) : undefined}
        />
      )}

      <ReportDeleteDialog
        target={confirm.target}
        open={confirm.open}
        onOpenChange={confirm.onOpenChange}
        onConfirm={deleteRow}
        onDone={() => {
          snackbar.show({ message: t('rep.deleted'), tone: 'positive' })
          if (draft && draft.id === confirm.target?.id) close()
          setSelected(selected.filter((id) => id !== confirm.target?.id))
        }}
      />
      {importOpen && (
        <ExcelImportDialog
          open
          onClose={() => setImportOpen(false)}
          groups={groups}
          divisions={divisions}
          users={usersView}
          codes={{ ready: codesReady, failed: codesFailed, fetching: groupsQ.isFetching || divisionQ.isFetching, refetch: retryCodes }}
          me={me}
          canManage={canManage}
          onRegister={registerRows}
          registering={bulkM.isPending}
        />
      )}
      {unregisteredOpen && <UnregisteredDownloadDialog open onClose={() => setUnregisteredOpen(false)} />}
    </ResponsiveMenu>
  )
}
