import { useRef, useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@/shared/ds/avatar'
import { Button } from '@/shared/ds/button'
import { Card } from '@/shared/ds/card'
import { InfiniteListEnd } from '@/shared/ds/infinite-list'
import { List, ListButtonItem } from '@/shared/ds/list'
import { ResultSection } from '@/shared/ds/result-section'
import { LoadingRegion, Skeleton } from '@/shared/ds/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableCellContent,
  TableHead,
  TableHeader,
  TableRow,
  TableRowHeader,
  TableSkeletonRows,
} from '@/shared/ds/table'
import { TablePagination, type TablePaginationValue } from '@/shared/ds/table-pagination'
import { VacationStatusBadge } from '@/shared/ui/groo/vacation-status'
import type { GetUserRequestedVacationsResp } from '@/entities/vacation'
import { RequestDetail } from '@/features/vacation-application/ui/RequestDetail'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { approvalRowName, formatRequestRange, formatRequestedAt } from '../lib/approval-format'

/** 쪽 크기 선택지 — 가장 작은 쪽 크기 이하면 넘김 줄을 두지 않는다(table-pagination.md) */
const PAGE_SIZES = [10, 25, 50] as const
/** 폰은 쪽 넘김이 아니라 끝없이 — 이미 받은 줄을 20개씩 더 보인다 */
const PHONE_STEP = 20

/** 결재함 구역 읽기 실패(U) — 서버 글을 그리지 않는다 */
const InboxFailure = ({ onRetry, retrying }: { onRetry: () => void; retrying?: boolean }) => {
  const { t } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  return (
    <ResultSection
      kind='failure'
      size='medium'
      title={t('inbox.failureTitle')}
      description={t('memberVacation.failureDescription')}
      primaryAction={{ label: tc('retry'), onClick: onRetry, loading: retrying }}
    />
  )
}

const InboxEmpty = () => {
  const { t } = useTranslation('vacation')
  return <ResultSection size='medium' icon={<ClipboardCheck />} title={t('inbox.emptyTitle')} description={t('inbox.emptyDescription')} />
}

const InboxTableSkeleton = () => {
  const { t } = useTranslation('vacation')
  return (
    <Table caption={t('inbox.caption')} rowHeight='rich'>
      <TableHeader>
        <TableRow>
          <TableHead>{t('inbox.colApplicant')}</TableHead>
          <TableHead>{t('inbox.colVacation')}</TableHead>
          <TableHead>{t('inbox.colDate')}</TableHead>
          <TableHead align='end'>{t('inbox.colTime')}</TableHead>
          <TableHead>{t('inbox.colRequestedAt')}</TableHead>
          <TableHead>{t('inbox.colStatus')}</TableHead>
          <TableHead>
            <span className='sr-only'>{t('inbox.detail')}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableSkeletonRows
          rows={5}
          columns={[{ width: '70%' }, { width: '70%' }, { width: '80%' }, { align: 'end', width: '50%' }, { width: '60%' }, { width: '50%' }, { width: '60%' }]}
        />
      </TableBody>
    </Table>
  )
}

const InboxListSkeleton = () => (
  <div className='flex flex-col'>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className='flex items-center gap-x3 px-x6 py-x3'>
        <Skeleton className='size-[42px] shrink-0 rounded-full' />
        <div className='flex flex-1 flex-col gap-x1'>
          <Skeleton text='t5' className='block w-3/5' />
          <Skeleton text='t3' className='block w-4/5' />
        </div>
        <Skeleton text='t3' className='block w-[40px]' />
      </div>
    ))}
  </div>
)

/**
 * ds Table `rich` 줄은 칸 높이 최소 72 + 위아래 12(TABLE_BODY_RICH)를 ds 가 지킨다 — 내용이 길면 줄이 자라고 글이 줄 선에 붙지 않는다(칸마다 여백을 따로 주지 않는다).
 * 결재함(I-24 C 12 · 13) — 로그인한 사람이 결재자인 신청(고른 직원과 무관, 고른 해). 줄을 누르면 결재 상세(승인 · 반려).
 * 데스크톱: ds Table 일곱 열 + 줄 끝 [상세 보기] + Table Pagination(동작이 하나뿐이라 ⋮ 가 아니라 글 단추 — 11-08 A1).
 * 폰: List 줄(앞 Avatar 42 · "신청자 · 정책" · 날짜 · 시간 · 신청일 · 상태) — 줄 ⋮ 없음, 줄 누름 = 상세, 끝은 끝없이 불러오기.
 * 읽기는 quiet — 실패는 이 구역의 Result Section + [다시 시도].
 */
export function ApprovalInbox({
  rows,
  pending,
  failed,
  fetching,
  onRetry,
}: {
  rows: GetUserRequestedVacationsResp[]
  pending: boolean
  failed: boolean
  fetching: boolean
  onRetry: () => void
}) {
  const { t } = useTranslation('vacation')
  const desktop = useDesktop()
  const [pageValue, setPageValue] = useState<TablePaginationValue>({ page: 1, pageSize: PAGE_SIZES[0] })
  const [shown, setShown] = useState<number>(PHONE_STEP)
  const [detail, setDetail] = useState<GetUserRequestedVacationsResp | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  const showPagination = rows.length > PAGE_SIZES[0]
  const lastPage = Math.max(1, Math.ceil(rows.length / pageValue.pageSize))
  const page = showPagination ? Math.min(pageValue.page, lastPage) : 1
  const pageRows = desktop ? rows.slice((page - 1) * pageValue.pageSize, page * pageValue.pageSize) : rows.slice(0, shown)

  const body = (
    <LoadingRegion
      pending={pending}
      failed={failed}
      fallback={desktop ? <InboxTableSkeleton /> : <InboxListSkeleton />}
      failure={<InboxFailure onRetry={onRetry} retrying={fetching} />}
    >
      {rows.length === 0 ? (
        <InboxEmpty />
      ) : desktop ? (
        <Table
          ref={tableRef}
          caption={t('inbox.caption')}
          rowHeight='rich'
          pagination={
            showPagination ? (
              <TablePagination value={{ ...pageValue, page }} onValueChange={setPageValue} totalItems={rows.length} pageSizeOptions={PAGE_SIZES} scrollTarget={tableRef} />
            ) : undefined
          }
        >
          <TableHeader>
            <TableRow>
              <TableHead>{t('inbox.colApplicant')}</TableHead>
              <TableHead>{t('inbox.colVacation')}</TableHead>
              <TableHead>{t('inbox.colDate')}</TableHead>
              <TableHead align='end'>{t('inbox.colTime')}</TableHead>
              <TableHead>{t('inbox.colRequestedAt')}</TableHead>
              <TableHead>{t('inbox.colStatus')}</TableHead>
              <TableHead>
                <span className='sr-only'>{t('inbox.detail')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => {
              const open = () => setDetail(row)
              return (
                <TableRow key={row.vacation_grant_id} data-grant-id={row.vacation_grant_id} onClick={open}>
                  <TableRowHeader className='min-w-[140px]' onClick={open}>
                    <TableCellContent media={<Avatar name={row.applicant_name} size={42} />} title={<span className='[overflow-wrap:break-word] [word-break:keep-all]'>{row.applicant_name}</span>} />
                  </TableRowHeader>
                  <TableCell className='min-w-[160px] max-w-[260px] whitespace-normal'>
                    <TableCellContent
                      title={<span className='[overflow-wrap:break-word] [word-break:keep-all]'>{row.policy_name}</span>}
                      detail={row.desc?.trim() ? <span className='line-clamp-1 [overflow-wrap:break-word]'>{row.desc}</span> : undefined}
                    />
                  </TableCell>
                  <TableCell className='whitespace-nowrap'>{formatRequestRange(row.request_start_time, row.request_end_time)}</TableCell>
                  <TableCell align='end' className='whitespace-nowrap'>
                    {row.grant_time_str}
                  </TableCell>
                  <TableCell className='whitespace-nowrap'>{formatRequestedAt(row.create_date)}</TableCell>
                  <TableCell className='whitespace-nowrap'>
                    <VacationStatusBadge status={row.grant_status} />
                  </TableCell>
                  <TableCell className='whitespace-nowrap'>
                    <Button variant='ghost' size='small' aria-label={t('inbox.detailFor', { name: approvalRowName(row) })} onClick={(e) => { e.stopPropagation(); open() }}>
                      {t('inbox.detail')}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      ) : (
        <>
          <List>
            {pageRows.map((row) => (
              <ListButtonItem
                key={row.vacation_grant_id}
                data-grant-id={row.vacation_grant_id}
                prefix={<Avatar name={row.applicant_name} size={42} />}
                title={approvalRowName(row)}
                detail={t('inbox.rowDetail', {
                  date: formatRequestRange(row.request_start_time, row.request_end_time),
                  time: row.grant_time_str,
                  requested: formatRequestedAt(row.create_date),
                })}
                suffix={<VacationStatusBadge status={row.grant_status} />}
                align='top'
                onClick={() => setDetail(row)}
              />
            ))}
          </List>
          {rows.length > PHONE_STEP && (
            <InfiniteListEnd
              status={shown < rows.length ? 'loading' : 'end'}
              endText={t('inbox.listEnd')}
              onRetry={() => setShown((n) => n + PHONE_STEP)}
              onReachEnd={() => setShown((n) => (n < rows.length ? n + PHONE_STEP : n))}
            />
          )}
        </>
      )}
    </LoadingRegion>
  )

  return (
    <div data-approval-inbox>
      {desktop ? <Card body='list'>{body}</Card> : body}
      <RequestDetail open={detail !== null} onClose={() => setDetail(null)} requestData={detail ?? undefined} />
    </div>
  )
}
