import { useRef, useState } from 'react'
import { Briefcase, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { ResultSection } from '@/shared/ds/result-section'
import { useSnackbar } from '@/shared/ds/snackbar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ds/tabs'
import { ConfirmDialog, useConfirmTarget } from '@/shared/ui/confirm'
import { useDeleteWorkCodeMutation, useWorkDivisionLabelsQuery, useWorkDivisionQuery, useWorkGroupsWithPartsQuery } from '@/entities/work'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { useScreenAction } from '@/widgets/layout/lib/screen-action'
import { ScreenBody, ScreenTitleRow } from '@/widgets/layout/ui/ScreenBody'
import { divisionRowsOf, partRowsOf, type WorkCodeRow } from '../lib/work-code-rows'
import { WorkCodeFormDialog, type WorkCodeFormTarget } from './WorkCodeFormDialog'
import { WorkCodeTable } from './WorkCodeTable'

type Tab = 'part' | 'division'

const focusFirst = (selectors: string[]): boolean => {
  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el) {
      el.focus({ preventScroll: true })
      return true
    }
  }
  return false
}

/**
 * 업무 코드(I-24 J 47) — 제목 "업무 코드" · 오른쪽 [코드 추가](업무 구분 탭에서만 — 업무 파트 탭은 지금도 최상위 추가가 없다, 질문 Q-i24-5-1) →
 * ds Tabs line hug "업무 파트 · 업무 구분"(아래 16) → 카드(머리 없음) 안 표. 폰: 탭 → List 줄(줄을 누르면 수정 시트).
 * 두 탭 모두 그려 둔다(탭을 바꿔도 열린 폼 · 쪽이 이어진다) — 화면 트리는 폭과 상관없이 하나다.
 */
export const WorkCodeContent = () => {
  const { t } = useTranslation('work')
  const desktop = useDesktop()
  const snackbar = useSnackbar()
  const [tab, setTab] = useState<Tab>('part')
  const [form, setForm] = useState<{ target: WorkCodeFormTarget; open: boolean; key: number } | null>(null)
  const deleteConfirm = useConfirmTarget<WorkCodeRow>()
  const del = useDeleteWorkCodeMutation()
  const groups = useWorkGroupsWithPartsQuery({ quiet: true })
  const divisions = useWorkDivisionQuery({ quiet: true })
  const divisionLabel = useWorkDivisionLabelsQuery({ quiet: true })
  const partRows = partRowsOf(groups.data ?? [])
  const divisionRows = divisionRowsOf(divisions.data ?? [])
  const lastId = useRef<number | null>(null)
  const afterDelete = useRef<number[]>([])
  const fromSheet = useRef(false)
  const removed = useRef(false)

  const openForm = (target: WorkCodeFormTarget) => {
    lastId.current = target.kind === 'edit' ? target.row.code.work_code_id : null
    setForm((cur) => ({ target, open: true, key: (cur?.key ?? 0) + 1 }))
  }
  const closeForm = () => setForm((cur) => (cur ? { ...cur, open: false } : cur))
  // 하위 코드 추가 — 라벨 줄 아래. 업무 구분 추가 — 업무 구분 코드 아래(지금 그대로)
  const addChild = (row: WorkCodeRow) => openForm({ kind: 'create', parentId: row.code.work_code_id })
  const addDivision = () => openForm({ kind: 'create', parentId: divisionLabel.data?.work_code_id })

  const askDelete = (row: WorkCodeRow, sheet: boolean) => {
    const list = tab === 'part' ? partRows : divisionRows
    const index = list.findIndex((r) => r.code.work_code_id === row.code.work_code_id)
    afterDelete.current = [list[index + 1]?.code.work_code_id, list[index - 1]?.code.work_code_id].filter((id): id is number => id !== undefined)
    fromSheet.current = sheet
    removed.current = false
    deleteConfirm.ask(row)
  }
  const focusAfterRemoval = () => {
    const part = desktop ? ' [data-slot=table-more-button]' : ''
    const reached = focusFirst([...afterDelete.current.map((id) => `[data-work-code-id="${id}"]${part}`), ...afterDelete.current.map((id) => `[data-work-code-id="${id}"]`)])
    if (!reached && !focusFirst(['[data-work-code-add]'])) document.getElementById('main')?.focus({ preventScroll: true })
  }
  const onFormClosed = (e: Event) => {
    e.preventDefault()
    const id = lastId.current
    if (id !== null && focusFirst([`[data-work-code-id="${id}"]`])) return
    if (id === null) focusFirst(['[data-work-code-add]'])
  }
  const onDeleteClosed = (e: Event) => {
    if (!removed.current || !fromSheet.current) return
    e.preventDefault()
    focusAfterRemoval()
  }

  useScreenAction(!desktop && tab === 'division' ? { label: t('adminWorkCode.add'), onClick: addDivision } : null)

  const addButton =
    tab === 'division' ? (
      <Button variant='neutralOutline' size='small' onClick={addDivision} data-work-code-add>
        <Plus />
        {t('adminWorkCode.add')}
      </Button>
    ) : undefined

  const row = deleteConfirm.target

  return (
    <ScreenBody density='medium'>
      <ScreenTitleRow title={t('adminWorkCode.title')} action={addButton} />
      <div className='bg-bg-layer-default min-[48rem]:bg-transparent'>
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList aria-label={t('adminWorkCode.tabsAria')} layout={desktop ? 'hug' : 'fill'} size={desktop ? 'medium' : 'small'}>
            <TabsTrigger value='part'>{t('workPart')}</TabsTrigger>
            <TabsTrigger value='division'>{t('workDivision')}</TabsTrigger>
          </TabsList>
          <TabsContent value='part' className='min-[48rem]:mt-x4'>
            <WorkCodeTable
              caption={t('workPart')}
              rows={partRows}
              pending={groups.isPending}
              failed={groups.isLoadingError}
              fetching={groups.isFetching}
              onRetry={() => void groups.refetch()}
              failureTitle={t('adminWorkCode.failureTitle')}
              empty={<ResultSection size='medium' icon={<Briefcase />} title={t('adminWorkCode.emptyTitle')} description={t('adminWorkCode.emptyDescription')} />}
              onAddChild={addChild}
              onEdit={(r) => openForm({ kind: 'edit', row: r })}
              onDelete={(r) => askDelete(r, false)}
            />
          </TabsContent>
          <TabsContent value='division' className='min-[48rem]:mt-x4'>
            <WorkCodeTable
              caption={t('workDivision')}
              rows={divisionRows}
              pending={divisions.isPending}
              failed={divisions.isLoadingError}
              fetching={divisions.isFetching}
              onRetry={() => void divisions.refetch()}
              failureTitle={t('adminWorkCode.failureTitle')}
              empty={
                <ResultSection
                  size='medium'
                  icon={<Briefcase />}
                  title={t('adminWorkCode.divisionEmptyTitle')}
                  description={t('adminWorkCode.emptyDescription')}
                  primaryAction={{ label: t('adminWorkCode.add'), onClick: addDivision }}
                />
              }
              onAddChild={addChild}
              onEdit={(r) => openForm({ kind: 'edit', row: r })}
              onDelete={(r) => askDelete(r, false)}
            />
          </TabsContent>
        </Tabs>
      </div>
      {form && (
        <WorkCodeFormDialog
          key={form.key}
          open={form.open}
          target={form.target}
          onOpenChange={(next) => (next ? undefined : closeForm())}
          onSaved={closeForm}
          onCloseAutoFocus={onFormClosed}
          onDelete={(r) => askDelete(r, true)}
          onAddChild={(r) => {
            closeForm()
            addChild(r)
          }}
        />
      )}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title={t('codeDelete')}
        description={t('codeDeleteConfirm', { name: row?.code.work_code_name ?? '' })}
        onConfirm={async () => {
          if (row) await del.mutateAsync(row.code.work_code_id)
          removed.current = true
        }}
        onDone={() => {
          if (fromSheet.current) closeForm()
          snackbar.show({ message: t('adminWorkCode.deleted'), tone: 'positive' })
        }}
        onCloseAutoFocus={onDeleteClosed}
      />
    </ScreenBody>
  )
}
