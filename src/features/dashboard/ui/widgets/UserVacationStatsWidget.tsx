import { useState } from 'react'
import { Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useGrantTimeText } from '@/shared/lib/groo/use-grant-time-text'

import { InfiniteListEnd } from '@/shared/ds/infinite-list'
import { List, ListItem } from '@/shared/ds/list'
import { ResultSection } from '@/shared/ds/result-section'
import { Skeleton } from '@/shared/ds/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableRowHeader,
  TableSkeletonRows,
} from '@/shared/ds/table'
import { TablePagination, type TablePaginationValue } from '@/shared/ds/table-pagination'
import { useAllUsersVacationSummaryQuery } from '@/entities/vacation'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { WidgetBoundary } from '@/features/dashboard/ui/WidgetResults'
import { WidgetFrame } from '@/features/dashboard/ui/WidgetFrame'

const PAGE_SIZES = [10, 25, 50] as const

/**
 * 전체 사용자 휴가 현황(D 33 — 홈뿐 · 관리) — 다른 화면이 없어 모두 볼 수 있어야 한다. 데스크톱은 ds Table + Table Pagination(10 · 25 · 50, 10명 이하면 넘김 줄 없음),
 * 폰은 List 줄(이름 · "{부서} · 전체 {n} · 쓴 {n}" · 남은 값)을 10줄씩 끝없이. 남은 값은 700 `fg-neutral`(파랑을 걷는다).
 */
export const UserVacationStatsWidget = () => {
  const { t } = useTranslation('vacation')
  const gt = useGrantTimeText()
  const { t: td } = useTranslation('dashboard')
  const desktop = useDesktop()
  const query = useAllUsersVacationSummaryQuery(new Date().getFullYear(), { quiet: true })
  const rows = query.data ?? []
  const [value, setValue] = useState<TablePaginationValue>({ page: 1, pageSize: PAGE_SIZES[0] })
  const [shown, setShown] = useState<number>(PAGE_SIZES[0])
  const lastPage = Math.max(1, Math.ceil(rows.length / value.pageSize))
  const page = Math.min(value.page, lastPage)
  const pageRows = rows.slice((page - 1) * value.pageSize, page * value.pageSize)

  return (
    <WidgetFrame id='user-vacation-stats' body='list'>
      <WidgetBoundary id='user-vacation-stats' queries={[query]} fallback={desktop ? <TableSkeleton /> : <ListSkeleton />}>
        {query.data && rows.length === 0 ? (
          <ResultSection size='medium' icon={<Users />} title={td('widget.empty.allUsers.title')} />
        ) : desktop ? (
          <Table
            caption={td('widget.allUserVacationStatus')}
            pagination={
              rows.length > PAGE_SIZES[0] ? (
                <TablePagination value={{ ...value, page }} onValueChange={setValue} totalItems={rows.length} pageSizeOptions={PAGE_SIZES} />
              ) : undefined
            }
          >
            <TableHeader>
              <TableRow>
                <TableHead>{t('history.tableName')}</TableHead>
                <TableHead>{t('history.tableDepartment')}</TableHead>
                <TableHead align='end'>{t('history.tableTotalAnnual')}</TableHead>
                <TableHead align='end'>{t('history.tableUsed')}</TableHead>
                <TableHead align='end'>{t('history.tableScheduled')}</TableHead>
                <TableHead align='end'>{t('history.tableRemaining')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((user) => (
                <TableRow key={user.user_id}>
                  <TableRowHeader className='whitespace-normal [overflow-wrap:break-word] [word-break:keep-all]'>{user.user_name}</TableRowHeader>
                  <TableCell className='whitespace-normal [overflow-wrap:break-word] [word-break:keep-all]'>{user.department_name}</TableCell>
                  <TableCell align='end'>{gt(user.total_vacation_days, user.total_vacation_days_str)}</TableCell>
                  <TableCell align='end'>{gt(user.used_vacation_days, user.used_vacation_days_str)}</TableCell>
                  <TableCell align='end'>{gt(user.scheduled_vacation_days, user.scheduled_vacation_days_str)}</TableCell>
                  <TableCell align='end' className='font-bold text-fg-neutral'>
                    {gt(user.remaining_vacation_days, user.remaining_vacation_days_str)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <>
            <List>
              {rows.slice(0, shown).map((user) => (
                <ListItem
                  key={user.user_id}
                  title={user.user_name}
                  detail={td('widget.allUsers.detail', { department: user.department_name, total: gt(user.total_vacation_days, user.total_vacation_days_str), used: gt(user.used_vacation_days, user.used_vacation_days_str) })}
                  suffix={<span className='text-t5 font-bold tabular-nums text-fg-neutral'>{gt(user.remaining_vacation_days, user.remaining_vacation_days_str)}</span>}
                  align='top'
                />
              ))}
            </List>
            {rows.length > PAGE_SIZES[0] && (
              <InfiniteListEnd
                status={shown < rows.length ? 'loading' : 'end'}
                endText={td('widget.allUsers.listEnd')}
                onRetry={() => setShown((n) => n + PAGE_SIZES[0])}
                onReachEnd={() => setShown((n) => (n < rows.length ? n + PAGE_SIZES[0] : n))}
              />
            )}
          </>
        )}
      </WidgetBoundary>
    </WidgetFrame>
  )
}

const TableSkeleton = () => {
  const { t } = useTranslation('vacation')
  const { t: td } = useTranslation('dashboard')
  return (
    <Table caption={td('widget.allUserVacationStatus')}>
      <TableHeader>
        <TableRow>
          <TableHead>{t('history.tableName')}</TableHead>
          <TableHead>{t('history.tableDepartment')}</TableHead>
          <TableHead align='end'>{t('history.tableTotalAnnual')}</TableHead>
          <TableHead align='end'>{t('history.tableUsed')}</TableHead>
          <TableHead align='end'>{t('history.tableScheduled')}</TableHead>
          <TableHead align='end'>{t('history.tableRemaining')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableSkeletonRows rows={3} columns={[{ width: '70%' }, { width: '70%' }, { align: 'end', width: '50%' }, { align: 'end', width: '50%' }, { align: 'end', width: '50%' }, { align: 'end', width: '50%' }]} />
      </TableBody>
    </Table>
  )
}

const ListSkeleton = () => (
  <div className='flex flex-col'>
    {[0, 1, 2].map((i) => (
      <div key={i} className='flex items-start justify-between gap-x4 px-x6 py-x3'>
        <div className='flex w-3/5 flex-col gap-x1'>
          <Skeleton text='t5' className='block w-1/2' />
          <Skeleton text='t3' className='block w-full' />
        </div>
        <Skeleton text='t5' className='block w-1/5' />
      </div>
    ))}
  </div>
)
