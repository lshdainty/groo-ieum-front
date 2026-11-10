import { Copy, Pencil, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { ResponsiveMenuContent, ResponsiveMenuGroup, ResponsiveMenuItem } from '@/shared/ds/menu'
import {
  Table,
  TableBody,
  TableBulkBar,
  TableCell,
  TableHead,
  TableHeader,
  TableMoreCell,
  TableMoreHead,
  TableRow,
  TableRowHeader,
  TableSelectCell,
  TableSelectHead,
} from '@/shared/ds/table'
import { TablePagination, type TablePaginationValue } from '@/shared/ds/table-pagination'
import { formatDayText, formatMonthDayText } from '@/shared/lib/date-text'
import type { WorkCodeResp, WorkGroupWithParts } from '@/entities/work'
import { codePath, hasRowActions, hoursText, type RowActions } from '../lib/report-format'
import type { DraftErrors } from '../lib/report-form'
import { useReportContext } from '../model/ReportContext'
import type { WorkRow } from '../model/types'
import { ReportEditRow } from './ReportEditRow'

/** 쪽 크기 선택지 — 처음 25(I-25 H 48) */
export const PAGE_SIZES = [10, 25, 50] as const
const DEFAULT_PAGE_SIZE = 25
const WORD = '[overflow-wrap:break-word] [word-break:keep-all]'

export interface RowHandlers {
  actionsOf: (row: WorkRow) => RowActions
  onEdit: (row: WorkRow) => void
  onDuplicate: (row: WorkRow) => void
  onDelete: (row: WorkRow) => void
}

/** 줄 ⋮ 의 내용 — 복제 · 수정 · (가름) 삭제. 남의 줄은 ⋮ 가 아니라 줄 끝 [복제] 단추라 여기 오지 않는다 */
export function ReportRowMenuContent({ row, actions, handlers }: { row: WorkRow; actions: RowActions; handlers: RowHandlers }) {
  const { t } = useTranslation('work')
  const { t: tc } = useTranslation('common')
  return (
    <ResponsiveMenuContent title={t('rep.rowMenuTitle', { date: formatDayText(row.date) })} description={codePath(row) || undefined}>
      <ResponsiveMenuGroup>
        {actions.duplicate && <ResponsiveMenuItem label={t('rep.duplicate')} icon={<Copy />} onSelect={() => handlers.onDuplicate(row)} />}
        {actions.edit && <ResponsiveMenuItem label={tc('edit')} icon={<Pencil />} onSelect={() => handlers.onEdit(row)} />}
      </ResponsiveMenuGroup>
      {actions.remove && (
        <ResponsiveMenuGroup>
          <ResponsiveMenuItem label={tc('delete')} icon={<Trash2 />} tone='critical' onSelect={() => handlers.onDelete(row)} />
        </ResponsiveMenuGroup>
      )}
    </ResponsiveMenuContent>
  )
}

/**
 * 업무 기록 표(768 이상 — I-25 H 48 · 50 · 51 · 52) — ds Table `rich`(두 줄 72) + Table Pagination(받은 목록을 화면에서 자른다 · 처음 25 · 조건을 바꾸면 첫 쪽).
 * 열(1280): 체크 · 일자 · 담당자 · 업무 분류 · 업무 파트 · 업무 구분 · 소요 시간 · 내용 · ⋮ / 1024: 업무(분류 › 파트 + 아래 구분) 한 열. "No" 열 없음 · 분류 · 파트 · 구분은 Badge 가 아니라 글.
 * ⋮ — 내 줄(또는 `WORK:MANAGE`)은 복제 · 수정 · 삭제 Menu, 남의 줄은 동작이 하나라 줄 끝 [복제] 글 단추, 쓰기 권한이 없으면 열 자체가 없다.
 * 체크 열은 쓰기 권한이 있을 때만(복제용). 고르면 표 위 일괄 작업 바(ds). 편집 줄은 한 줄 전체 폭.
 */
export function ReportTable({
  rows,
  wide,
  groups,
  divisions,
  canWrite,
  handlers,
  edit,
}: {
  rows: WorkRow[]
  wide: boolean
  groups: WorkGroupWithParts[]
  divisions: WorkCodeResp[]
  canWrite: boolean
  handlers: RowHandlers
  edit: {
    errors: DraftErrors
    showErrors: boolean
    failure: string | null
    busy: boolean
    onChange: (patch: Partial<import('../model/types').WorkDraft>) => void
    onSave: () => void
    onCancel: () => void
  }
}) {
  const { t } = useTranslation('work')
  const { selected, setSelected, draft } = useReportContext()
  const [pageValue, setPageValue] = useState<TablePaginationValue>({ page: 1, pageSize: DEFAULT_PAGE_SIZE })
  const tableRef = useRef<HTMLDivElement>(null)

  const showPagination = rows.length > PAGE_SIZES[0]
  const lastPage = Math.max(1, Math.ceil(rows.length / pageValue.pageSize))
  const page = showPagination ? Math.min(pageValue.page, lastPage) : 1
  const pageRows = showPagination ? rows.slice((page - 1) * pageValue.pageSize, page * pageValue.pageSize) : rows
  const anyActions = canWrite && rows.some((r) => hasRowActions(handlers.actionsOf(r)))
  const pageIds = pageRows.map((r) => r.id)
  const pickedOnPage = pageIds.filter((id) => selected.includes(id)).length
  const allChecked: boolean | 'indeterminate' = pageIds.length > 0 && pickedOnPage === pageIds.length ? true : pickedOnPage > 0 ? 'indeterminate' : false
  const colSpan = (canWrite ? 1 : 0) + (wide ? 8 : 6) + (anyActions ? 1 : 0)
  const isNew = draft && draft.id === undefined

  return (
    <Table
      ref={tableRef}
      caption={t('rep.tableCaption')}
      rowHeight='rich'
      pagination={
        showPagination ? (
          <TablePagination value={{ ...pageValue, page }} onValueChange={setPageValue} totalItems={rows.length} pageSizeOptions={PAGE_SIZES} scrollTarget={tableRef} />
        ) : undefined
      }
    >
      <TableHeader>
        <TableRow>
          {canWrite && (
            <TableSelectHead
              checked={allChecked}
              onCheckedChange={(on) => setSelected(on ? Array.from(new Set([...selected, ...pageIds])) : selected.filter((id) => !pageIds.includes(id)))}
            />
          )}
          <TableHead>{t('rep.colDate')}</TableHead>
          <TableHead>{t('rep.colManager')}</TableHead>
          {wide ? (
            <>
              <TableHead>{t('rep.colGroup')}</TableHead>
              <TableHead>{t('rep.colPart')}</TableHead>
              <TableHead>{t('rep.colDivision')}</TableHead>
            </>
          ) : (
            <TableHead>{t('rep.colWork')}</TableHead>
          )}
          <TableHead align='end'>{t('rep.colHours')}</TableHead>
          <TableHead>{t('rep.colContent')}</TableHead>
          {anyActions && <TableMoreHead />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isNew && (
          <ReportEditRow colSpan={colSpan} draft={draft} groups={groups} divisions={divisions} {...edit} />
        )}
        {pageRows.map((row) => {
          if (draft && draft.id === row.id) {
            return <ReportEditRow key={row.id} colSpan={colSpan} draft={draft} groups={groups} divisions={divisions} {...edit} />
          }
          const actions = handlers.actionsOf(row)
          return (
            <TableRow key={row.id} data-work-id={row.id}>
              {canWrite && (
                <TableSelectCell
                  label={t('rep.rowLabel', { date: formatDayText(row.date), name: row.managerName })}
                  checked={selected.includes(row.id)}
                  onCheckedChange={(on) => setSelected(on ? [...selected, row.id] : selected.filter((id) => id !== row.id))}
                />
              )}
              <TableRowHeader className='whitespace-nowrap'>{formatMonthDayText(row.date)}</TableRowHeader>
              <TableCell className={`min-w-[80px] max-w-[160px] whitespace-normal ${WORD}`}>{row.managerName}</TableCell>
              {wide ? (
                <>
                  <TableCell className={`min-w-[100px] max-w-[200px] whitespace-normal ${WORD}`}>{row.group?.work_code_name}</TableCell>
                  <TableCell className={`min-w-[120px] max-w-[260px] whitespace-normal ${WORD}`}>{row.part?.work_code_name}</TableCell>
                  <TableCell className={`min-w-[100px] max-w-[200px] whitespace-normal ${WORD}`}>{row.division?.work_code_name}</TableCell>
                </>
              ) : (
                <TableCell className={`min-w-[160px] max-w-[240px] whitespace-normal ${WORD}`}>
                  <span className='block'>{codePath(row)}</span>
                  <span className='block text-t3 text-fg-neutral-subtle'>{row.division?.work_code_name}</span>
                </TableCell>
              )}
              <TableCell align='end' className='whitespace-nowrap'>
                {hoursText(row.hours, t)}
              </TableCell>
              <TableCell className='min-w-[160px] whitespace-normal [overflow-wrap:anywhere] [word-break:keep-all]'>{row.content}</TableCell>
              {anyActions &&
                (actions.edit || actions.remove ? (
                  <TableMoreCell label={t('rep.rowLabel', { date: formatDayText(row.date), name: row.managerName })}>
                    <ReportRowMenuContent row={row} actions={actions} handlers={handlers} />
                  </TableMoreCell>
                ) : (
                  <TableCell className='whitespace-nowrap'>
                    {actions.duplicate && (
                      <Button variant='ghost' size='small' aria-label={t('rep.duplicateFor', { date: formatDayText(row.date), name: row.managerName })} onClick={() => handlers.onDuplicate(row)} data-duplicate-row>
                        {t('rep.duplicate')}
                      </Button>
                    )}
                  </TableCell>
                ))}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

/** 표 위 일괄 작업 바 — 고르면 "{n}개 선택됨" + [복제] + ✕ */
export function ReportBulkBar({ count, onClear, onDuplicate, busy }: { count: number; onClear: () => void; onDuplicate: () => void; busy: boolean }) {
  const { t } = useTranslation('work')
  return (
    <TableBulkBar count={count} onClear={onClear} data-report-bulk>
      <Button variant='ghost' size='small' loading={busy} onClick={onDuplicate} data-bulk-duplicate>
        <Copy />
        {t('rep.duplicate')}
      </Button>
    </TableBulkBar>
  )
}
