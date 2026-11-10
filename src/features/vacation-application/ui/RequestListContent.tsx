import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { InfiniteListEnd } from '@/shared/ds/infinite-list'
import { List, ListButtonItem } from '@/shared/ds/list'
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
import { VacationStatusBadge } from '@/shared/ui/groo/vacation-status'
import type { GetUserRequestedVacationsResp } from '@/entities/vacation'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { useWide } from '@/widgets/layout/lib/use-wide'
import { canCancelRequest, progressText, requestTargetText, requestTitle } from '../lib/request-format'
import { CancelRequestConfirm } from './CancelRequestConfirm'
import { RequestDetail } from './RequestDetail'

/** 쪽 크기 선택지 — 가장 작은 쪽 크기 이하면 넘김 줄을 두지 않는다 */
const PAGE_SIZES = [10, 25, 50] as const
/** 폰은 쪽 넘김이 아니라 끝없이 — 받은 줄을 20개씩 더 보인다 */
const PHONE_STEP = 20

const NAME = '[overflow-wrap:break-word] [word-break:keep-all]'

export const RequestTableSkeleton = ({ wide }: { wide: boolean }) => {
  const { t } = useTranslation('vacation')
  return (
    <Table caption={t('req.listCaption')} rowHeight='rich'>
      <TableHeader>
        <TableRow>
          <TableHead>{t('req.colTitle')}</TableHead>
          {wide && <TableHead>{t('req.colType')}</TableHead>}
          <TableHead>{t('req.colDate')}</TableHead>
          <TableHead align='end'>{t('req.colGrant')}</TableHead>
          <TableHead>{t('req.colProgress')}</TableHead>
          <TableHead>
            <span className='sr-only'>{t('req.cancel')}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableSkeletonRows
          rows={4}
          columns={[{ width: '70%' }, ...(wide ? [{ width: '60%' }] : []), { width: '80%' }, { align: 'end' as const, width: '50%' }, { width: '70%' }, { width: '50%' }]}
        />
      </TableBody>
    </Table>
  )
}

export const RequestListSkeleton = () => (
  <div className='flex flex-col'>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className='flex items-start gap-x3 px-x6 py-x3'>
        <div className='flex flex-1 flex-col gap-x1'>
          <Skeleton text='t5' className='block w-3/5' />
          <Skeleton text='t3' className='block w-4/5' />
          <Skeleton text='t3' className='block w-2/3' />
        </div>
        <Skeleton text='t3' className='block w-[40px]' />
      </div>
    ))}
  </div>
)

/**
 * 신청 내역 본문(I-25 D 20) — 데스크톱 ds Table `rich`(두 줄 72 · 1280 이상 휴가 종류 열 · 미만은 제목 아래 줄) + Table Pagination,
 * 폰 List 줄(제목 · "{종류} · {날짜} · {받을 휴가}" + 진행 글 · 오른쪽 상태 Badge) + 끝없이 불러오기. 줄을 누르면 상세.
 * 줄 ⋮ 는 없다(11-08 A1) — 동작이 취소 하나뿐이라 데스크톱 표는 줄 끝 글 단추(대기 줄만), 폰은 상세 바닥.
 * `cancelUserId` 를 주면(내 신청 목록) 취소 길이 열린다. `limit` 은 홈 위젯(앞에서 n 줄 · 쪽 넘김 없음).
 */
export function RequestListContent({
  rows,
  cancelUserId,
  limit,
}: {
  rows: GetUserRequestedVacationsResp[]
  cancelUserId?: string
  limit?: number
}) {
  const { t } = useTranslation('vacation')
  const desktop = useDesktop()
  const wide = useWide()
  const [pageValue, setPageValue] = useState<TablePaginationValue>({ page: 1, pageSize: PAGE_SIZES[0] })
  const [shown, setShown] = useState<number>(PHONE_STEP)
  const [detail, setDetail] = useState<GetUserRequestedVacationsResp | null>(null)
  const [cancelTarget, setCancelTarget] = useState<GetUserRequestedVacationsResp | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  const all = limit ? rows.slice(0, limit) : rows
  const paginate = !limit
  const showPagination = paginate && all.length > PAGE_SIZES[0]
  const lastPage = Math.max(1, Math.ceil(all.length / pageValue.pageSize))
  const page = showPagination ? Math.min(pageValue.page, lastPage) : 1
  const pageRows = !paginate ? all : desktop ? all.slice((page - 1) * pageValue.pageSize, page * pageValue.pageSize) : all.slice(0, shown)
  const latest = (id: number) => rows.find((r) => r.vacation_grant_id === id)

  return (
    <>
      {desktop ? (
        <Table
          ref={tableRef}
          caption={t('req.listCaption')}
          rowHeight='rich'
          pagination={
            showPagination ? (
              <TablePagination value={{ ...pageValue, page }} onValueChange={setPageValue} totalItems={all.length} pageSizeOptions={PAGE_SIZES} scrollTarget={tableRef} />
            ) : undefined
          }
        >
          <TableHeader>
            <TableRow>
              <TableHead>{t('req.colTitle')}</TableHead>
              {wide && <TableHead>{t('req.colType')}</TableHead>}
              <TableHead>{t('req.colDate')}</TableHead>
              <TableHead align='end'>{t('req.colGrant')}</TableHead>
              <TableHead>{t('req.colProgress')}</TableHead>
              <TableHead>
                <span className='sr-only'>{t('req.cancel')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => {
              const open = () => setDetail(row)
              return (
                <TableRow key={row.vacation_grant_id} data-grant-id={row.vacation_grant_id} onClick={open}>
                  <TableRowHeader className='min-w-[160px] max-w-[280px] whitespace-normal' onClick={open}>
                    <span className={`block ${NAME}`}>{requestTitle(row)}</span>
                    {!wide && <span className='block text-t3 font-normal text-fg-neutral-subtle'>{row.vacation_type_name}</span>}
                  </TableRowHeader>
                  {wide && <TableCell className='whitespace-nowrap'>{row.vacation_type_name}</TableCell>}
                  <TableCell className='min-w-[120px] whitespace-normal'>{requestTargetText(row)}</TableCell>
                  <TableCell align='end' className='whitespace-nowrap'>
                    {row.grant_time_str}
                  </TableCell>
                  <TableCell className='min-w-[160px] whitespace-normal'>
                    <span className='flex flex-col items-start gap-x1'>
                      <VacationStatusBadge status={row.grant_status} />
                      <span className='text-t3 text-fg-neutral-subtle'>{progressText(row, t)}</span>
                    </span>
                  </TableCell>
                  <TableCell className='whitespace-nowrap'>
                    {cancelUserId && canCancelRequest(row) && (
                      <Button
                        variant='ghost'
                        ghostColor='critical'
                        size='small'
                        aria-label={t('req.cancelFor', { name: requestTitle(row) })}
                        onClick={(e) => {
                          e.stopPropagation()
                          setCancelTarget(row)
                        }}
                        data-cancel-row
                      >
                        {t('req.cancel')}
                      </Button>
                    )}
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
                title={<span className={NAME}>{requestTitle(row)}</span>}
                detail={
                  <>
                    <span className='block'>{t('req.rowDetail', { type: row.vacation_type_name, date: requestTargetText(row), grant: row.grant_time_str })}</span>
                    <span className='block'>{progressText(row, t)}</span>
                  </>
                }
                suffix={<VacationStatusBadge status={row.grant_status} />}
                align='top'
                onClick={() => setDetail(row)}
              />
            ))}
          </List>
          {paginate && all.length > PHONE_STEP && (
            <InfiniteListEnd
              status={shown < all.length ? 'loading' : 'end'}
              endText={t('req.listEnd')}
              onRetry={() => setShown((n) => n + PHONE_STEP)}
              onReachEnd={() => setShown((n) => (n < all.length ? n + PHONE_STEP : n))}
            />
          )}
        </>
      )}
      <RequestDetail open={detail !== null} onClose={() => setDetail(null)} requestData={detail ?? undefined} cancelUserId={cancelUserId} latest={latest} />
      <CancelRequestConfirm
        target={cancelTarget}
        latest={latest}
        userId={cancelUserId ?? ''}
        onOpenChange={(o) => {
          if (!o) setCancelTarget(null)
        }}
      />
    </>
  )
}
