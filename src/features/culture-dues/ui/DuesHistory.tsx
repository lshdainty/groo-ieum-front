import { useRef, useState } from 'react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

import { cn } from '@/shared/lib/cn'
import { Badge } from '@/shared/ds/badge'
import { CardAction } from '@/shared/ds/card'
import { InfiniteListEnd } from '@/shared/ds/infinite-list'
import { List, ListButtonItem, ListItem } from '@/shared/ds/list'
import { ResponsiveMenuContent, ResponsiveMenuItem } from '@/shared/ds/menu'
import { LoadingRegion, Skeleton } from '@/shared/ds/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableMoreCell,
  TableMoreHead,
  TableRow,
  TableRowHeader,
  TableSkeletonRows,
} from '@/shared/ds/table'
import { TablePagination, type TablePaginationValue } from '@/shared/ds/table-pagination'
import { ConfirmDialog, useConfirmTarget } from '@/shared/ui/confirm'
import { dsMoney } from '@/shared/ds/i18n'
import { useDeleteDuesMutation, useYearDuesQuery, type GetYearDuesResp } from '@/entities/dues'
import { usePermission } from '@/entities/session'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { DUES_TYPE_KEY } from '../lib/dues-form'
import { balanceMoney, duesRowName, formatDuesDate, signedMoney } from '../lib/dues-format'
import { DuesFormDialog, type DuesFormTarget } from './DuesFormDialog'
import { DuesFailure, DuesHistoryEmpty } from './DuesResults'
import { DuesSection } from './DuesSection'

/** 쪽 크기 선택지 — 가장 작은 쪽 크기 이하면 넘김 줄을 두지 않는다(table-pagination.md) */
const PAGE_SIZES = [10, 25, 50] as const

/** 줄 눌림 · 넘김 때 초점을 되돌릴 자리 — 줄마다 data-dues-id */
const rowSelector = (id: number, part: 'more' | 'row') =>
  part === 'more' ? `[data-dues-id="${id}"] [data-slot=table-more-button]` : `[data-dues-id="${id}"] [data-slot=table-row-link], button[data-dues-id="${id}"]`

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
 * 입출금 내역(E 39 · 40 · 41 · 42) — 데스크톱 ds Table 일곱 열 + 줄 끝 ⋮(관리만) + Table Pagination, 폰 List 줄(줄 누름 = 수정 시트).
 * 관리 권한(DUES:MANAGE)이 없으면 [추가] · ⋮ · 줄 누름이 모두 없다. 삭제는 확인창(22-3)이 묻고, 닫힌 뒤 초점은 지운 줄 다음 ⋮ 로 간다.
 * 고른 해가 바뀌면 이 구역을 새로 쌓는다(key) — 쪽 · 열린 폼이 이어지지 않는다.
 */
export const DuesHistory = ({ year }: { year: number }) => {
  const { t } = useTranslation('culture')
  const { t: tc } = useTranslation('common')
  const desktop = useDesktop()
  const { hasAnyPermission } = usePermission()
  const manage = hasAnyPermission(['DUES:MANAGE'])
  const query = useYearDuesQuery(year, { quiet: true })
  const deleteDues = useDeleteDuesMutation()
  const rows = query.data ?? []
  const [pageValue, setPageValue] = useState<TablePaginationValue>({ page: 1, pageSize: PAGE_SIZES[0] })
  const [form, setForm] = useState<{ target: DuesFormTarget; open: boolean; key: number } | null>(null)
  const deleteConfirm = useConfirmTarget<GetYearDuesResp>()
  const tableRef = useRef<HTMLDivElement>(null)
  // 확인창을 연 자리와 지운 뒤 초점이 갈 후보(지운 줄의 다음 · 이전 줄)
  const opener = useRef<Element | null>(null)
  const fromSheet = useRef(false)
  const after = useRef<number[]>([])
  const lastRowId = useRef<number | null>(null)

  // 768 미만은 쪽 넘김이 아니라 끝없이 불러온다(table-pagination.md "768 미만은 List 줄") — 이미 받은 줄을 10개씩 더 보인다
  const [shown, setShown] = useState<number>(PAGE_SIZES[0])
  const pageRows = desktop ? rows.slice((pageValue.page - 1) * pageValue.pageSize, pageValue.page * pageValue.pageSize) : rows.slice(0, shown)
  const showPagination = rows.length > PAGE_SIZES[0]

  const openForm = (target: DuesFormTarget) => {
    lastRowId.current = target.kind === 'edit' ? target.row.dues_id : null
    setForm((cur) => ({ target, open: true, key: (cur?.key ?? 0) + 1 }))
  }
  const closeForm = () => setForm((cur) => (cur ? { ...cur, open: false } : cur))

  const askDelete = (row: GetYearDuesResp, sheet: boolean) => {
    opener.current = document.activeElement
    fromSheet.current = sheet
    const index = rows.findIndex((r) => r.dues_id === row.dues_id)
    after.current = [rows[index + 1]?.dues_id, rows[index - 1]?.dues_id].filter((id): id is number => id !== undefined)
    deleteConfirm.ask(row)
  }

  /** 지운 줄은 없다 — 초점은 다음 줄(없으면 이전 줄)의 ⋮ · 줄로, 하나도 없으면 [추가] · 구역 머리로 */
  const focusAfterRemoval = () => {
    const part = desktop ? 'more' : 'row'
    const reached = focusFirst([...after.current.flatMap((id) => [rowSelector(id, part), rowSelector(id, 'row')])])
    if (!reached && !focusFirst(['[data-dues-history] [data-slot=card-action]', '[data-dues-history] [data-slot=card-title], [data-dues-history] h2'])) {
      document.getElementById('main')?.focus({ preventScroll: true })
    }
  }

  const onDeleteClosed = (e: Event) => {
    // 연 자리(줄 끝 ⋮)가 그대로 있으면 ds 가 거기로 돌려준다 — 취소 · Esc. 지워서 사라졌거나 시트 안에서 연 것이면 다음 줄로
    if (!fromSheet.current && opener.current?.isConnected) return
    e.preventDefault()
    focusAfterRemoval()
  }

  // 폼이 닫힌 뒤 — 수정했으면 그 줄로(줄을 눌러 열어 초점이 body 였다), 줄이 없어졌으면(지움) 다음 줄로
  const onFormClosed = (e: Event) => {
    e.preventDefault()
    const id = lastRowId.current
    if (id !== null && focusFirst([rowSelector(id, 'row')])) return
    if (id === null && focusFirst(['[data-dues-history] [data-slot=card-action]'])) return
    if (id !== null) focusAfterRemoval()
  }

  const addAction = manage ? (
    <CardAction aria-label={t('dues.addAria')} onClick={() => openForm({ kind: 'add' })}>
      {tc('add')}
    </CardAction>
  ) : undefined

  const rowActions = {
    onCopy: (row: GetYearDuesResp) => openForm({ kind: 'copy', row }),
    onDelete: (row: GetYearDuesResp) => askDelete(row, true),
  }

  const pagination = showPagination ? (
    <TablePagination value={pageValue} onValueChange={setPageValue} totalItems={rows.length} pageSizeOptions={PAGE_SIZES} scrollTarget={tableRef} />
  ) : undefined

  const duesRow = deleteConfirm.target

  return (
    <div data-dues-history>
      <DuesSection title={t('dues.transactionHistory')} action={addAction} body='list'>
        <LoadingRegion
          pending={query.isPending}
          failed={query.isLoadingError}
          fallback={desktop ? <HistoryTableSkeleton /> : <HistoryListSkeleton />}
          failure={<DuesFailure title={t('dues.failure.history')} onRetry={() => void query.refetch()} retrying={query.isFetching} />}
        >
          {query.data && rows.length === 0 ? (
            <DuesHistoryEmpty year={year} onAdd={manage ? () => openForm({ kind: 'add' }) : undefined} />
          ) : desktop ? (
            <Table ref={tableRef} caption={t('dues.transactionHistory')} pagination={pagination}>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('dues.tableDate')}</TableHead>
                  <TableHead>{t('dues.tableName')}</TableHead>
                  <TableHead>{t('dues.tableCategory')}</TableHead>
                  <TableHead>{t('dues.tableContent')}</TableHead>
                  <TableHead align='end'>{t('dues.tableAmount')}</TableHead>
                  <TableHead align='end'>{t('dues.tableTotal')}</TableHead>
                  {manage && <TableMoreHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row) => {
                  const name = duesRowName(row)
                  const edit = () => openForm({ kind: 'edit', row })
                  return (
                    <TableRow key={row.dues_id} data-dues-id={row.dues_id} onClick={manage ? edit : undefined}>
                      <TableRowHeader className='whitespace-nowrap' onClick={manage ? edit : undefined}>{formatDuesDate(row.dues_date)}</TableRowHeader>
                      <TableCell>{row.dues_user_name}</TableCell>
                      <TableCell>
                        <Badge>{t(DUES_TYPE_KEY[row.dues_type])}</Badge>
                      </TableCell>
                      <TableCell className='whitespace-normal [overflow-wrap:break-word] [word-break:keep-all]'>{row.dues_detail}</TableCell>
                      <TableCell align='end' className={cn('font-bold', row.dues_calc === 'PLUS' && 'text-fg-brand')} data-amount={row.dues_calc}>
                        {signedMoney(row.dues_amount, row.dues_calc)}
                      </TableCell>
                      <TableCell align='end'>{balanceMoney(row.total_dues)}</TableCell>
                      {manage && (
                        <TableMoreCell label={name}>
                          <ResponsiveMenuContent title={name}>
                            <ResponsiveMenuItem label={tc('edit')} onSelect={edit} />
                            <ResponsiveMenuItem label={t('dues.copyAdd')} onSelect={() => openForm({ kind: 'copy', row })} />
                            <ResponsiveMenuItem label={tc('delete')} tone='critical' onSelect={() => askDelete(row, false)} />
                          </ResponsiveMenuContent>
                        </TableMoreCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <>
              <List>
                {pageRows.map((row) => {
                  const detail = [formatDuesDate(row.dues_date), row.dues_user_name, t(DUES_TYPE_KEY[row.dues_type])].filter(Boolean).join(' · ')
                  const suffix = (
                    <span className='flex flex-col items-end'>
                      <span className={cn('text-t5 font-bold tabular-nums', row.dues_calc === 'PLUS' ? 'text-fg-brand' : 'text-fg-neutral')} data-amount={row.dues_calc}>
                        {signedMoney(row.dues_amount, row.dues_calc)}
                      </span>
                      <span className='text-t2 font-normal text-fg-neutral-subtle'>{t('dues.remaining', { amount: balanceMoney(row.total_dues) })}</span>
                    </span>
                  )
                  const title = row.dues_detail?.trim() || row.dues_user_name?.trim() || signedMoney(row.dues_amount, row.dues_calc)
                  return manage ? (
                    <ListButtonItem key={row.dues_id} data-dues-id={row.dues_id} title={title} detail={detail} suffix={suffix} align='top' onClick={() => openForm({ kind: 'edit', row })} />
                  ) : (
                    <ListItem key={row.dues_id} data-dues-id={row.dues_id} title={title} detail={detail} suffix={suffix} align='top' />
                  )
                })}
              </List>
              {rows.length > PAGE_SIZES[0] && (
                <InfiniteListEnd
                  status={shown < rows.length ? 'loading' : 'end'}
                  endText={t('dues.listEnd')}
                  onRetry={() => setShown((n) => n + PAGE_SIZES[0])}
                  onReachEnd={() => setShown((n) => (n < rows.length ? n + PAGE_SIZES[0] : n))}
                />
              )}
            </>
          )}
        </LoadingRegion>
      </DuesSection>
      {manage && form && (
        <DuesFormDialog
          key={form.key}
          open={form.open}
          target={form.target}
          onOpenChange={(next) => (next ? undefined : closeForm())}
          onSaved={closeForm}
          onCloseAutoFocus={onFormClosed}
          rowActions={desktop ? undefined : rowActions}
        />
      )}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title={t('dues.deleteTitle')}
        // 내용이 비어 있으면 그 조각을 뺀다(빈칸이 겹치지 않게)
        description={t(duesRow?.dues_detail?.trim() ? 'dues.deleteConfirm' : 'dues.deleteConfirmNoContent', {
          date: duesRow ? duesRowDate(duesRow) : '',
          content: duesRow?.dues_detail?.trim(),
          amount: dsMoney(Math.abs(duesRow?.dues_amount ?? 0)),
        })}
        // 실패하면 던진다 — 확인창이 닫히고 실패 알림(Snackbar + 다시 시도)이 뜬다
        onConfirm={async () => {
          if (duesRow) await deleteDues.mutateAsync(duesRow.dues_id)
        }}
        // 시트(폰 수정 폼) 안에서 지웠으면 시트도 닫는다 — 다시 시도로 지운 뒤에도 불린다
        onDone={() => {
          if (fromSheet.current) closeForm()
        }}
        onCloseAutoFocus={onDeleteClosed}
      />
    </div>
  )
}

// 확인창 글의 날짜는 22-3 이 정한 "YYYY-MM-DD" 그대로 — 글을 바꾸지 않는다
const duesRowDate = (row: GetYearDuesResp) => dayjs(row.dues_date).format('YYYY-MM-DD')

const HistoryTableSkeleton = () => {
  const { t } = useTranslation('culture')
  return (
    <Table caption={t('dues.transactionHistory')}>
      <TableHeader>
        <TableRow>
          <TableHead>{t('dues.tableDate')}</TableHead>
          <TableHead>{t('dues.tableName')}</TableHead>
          <TableHead>{t('dues.tableCategory')}</TableHead>
          <TableHead>{t('dues.tableContent')}</TableHead>
          <TableHead align='end'>{t('dues.tableAmount')}</TableHead>
          <TableHead align='end'>{t('dues.tableTotal')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableSkeletonRows
          rows={5}
          columns={[{ width: '70%' }, { width: '60%' }, { width: '50%' }, { width: '85%' }, { align: 'end', width: '70%' }, { align: 'end', width: '70%' }]}
        />
      </TableBody>
    </Table>
  )
}

const HistoryListSkeleton = () => (
  <div className='flex flex-col'>
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className='flex items-start justify-between gap-x4 px-x6 py-x3'>
        <div className='flex w-3/5 flex-col gap-x1'>
          <Skeleton text='t5' className='block w-4/5' />
          <Skeleton text='t3' className='block w-full' />
        </div>
        <div className='flex w-1/4 flex-col items-end gap-x1'>
          <Skeleton text='t5' className='block w-full' />
          <Skeleton text='t2' className='block w-3/4' />
        </div>
      </div>
    ))}
  </div>
)
