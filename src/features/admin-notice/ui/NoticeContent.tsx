import { useRef, useState } from 'react'
import { Bell, Pin, Plus, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/shared/ds/badge'
import { Button } from '@/shared/ds/button'
import { Card, CardHeader, CardTitle } from '@/shared/ds/card'
import { Input } from '@/shared/ds/input'
import { InfiniteListEnd } from '@/shared/ds/infinite-list'
import { List, ListHeader } from '@/shared/ds/list'
import { ResponsiveMenuContent, ResponsiveMenuGroup, ResponsiveMenuItem } from '@/shared/ds/menu'
import { ResultSection } from '@/shared/ds/result-section'
import { LoadingRegion, Skeleton } from '@/shared/ds/skeleton'
import { useSnackbar } from '@/shared/ds/snackbar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableMoreCell, TableMoreHead, TableRow, TableRowHeader, TableSkeletonRows } from '@/shared/ds/table'
import { TablePagination, type TablePaginationValue } from '@/shared/ds/table-pagination'
import { ConfirmDialog, useConfirmTarget } from '@/shared/ui/confirm'
import {
  NOTICE_TONE,
  NoticeRow,
  formatNoticeDay,
  useAdminNoticesInfiniteQuery,
  useDeleteNoticeMutation,
  useNoticesQuery,
  useSearchNoticesQuery,
  type NoticeListResp,
} from '@/entities/notice'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { useScreenAction } from '@/widgets/layout/lib/screen-action'
import { ScreenBody, ScreenTitleRow } from '@/widgets/layout/ui/ScreenBody'
import { isNoticeActive } from '../lib/notice-form'
import { NoticeFormDialog, type NoticeFormTarget } from './NoticeFormDialog'

/** 쪽 크기 선택지 — 가장 작은 쪽 크기 이하면 넘김 줄을 두지 않는다(table-pagination.md) */
const PAGE_SIZES = [10, 25, 50] as const
/** 폰 끝없이 불러오기 — 한 번에 받는 수 */
const PHONE_SIZE = 10
const TEXT_WRAP = '[overflow-wrap:break-word] [word-break:keep-all]'

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

/** 서버가 고정을 먼저 준다 — 고정이 있으면 "고정" · "모든 공지" 두 묶음(머리), 없으면 한 묶음(I-23 G 56 과 같은 규칙) */
const groupOf = (items: NoticeListResp[]) => {
  const pinned = items.filter((n) => n.is_pinned === 'Y')
  if (pinned.length === 0) return [{ id: 'all' as const, items, titled: false }]
  const rest = items.filter((n) => n.is_pinned !== 'Y')
  return [{ id: 'pinned' as const, items: pinned, titled: true }, ...(rest.length > 0 ? [{ id: 'all' as const, items: rest, titled: true }] : [])]
}

/**
 * 공지사항 관리(I-24 J 48 · 50) — 데스크톱: 제목 줄 [추가] → 카드 "공지 n개" 머리 → 밑줄 검색칸 → ds Table(제목 · 작성자 · 작성일 · 조회 · 게시 기간 · ⋮) +
 * Table Pagination(서버 쪽 번호, 10 · 25 · 50). 폰: 상단 바 [추가] · 흰 면 안 검색칸 → 공지 줄(NoticeRow, 줄을 누르면 수정 시트, 삭제는 시트 바닥 왼쪽) → 끝없이 불러오기.
 * 줄 누름으로 본문을 여는 곳은 없다(관리 화면은 공지 본문을 그리지 않는다 — Q9 A). 검색은 Enter(지금 그대로), 지우면 전체 목록.
 * 읽기는 quiet — 실패는 이 구역의 Result Section + [다시 시도]. 화면 트리는 폭과 상관없이 하나다.
 */
export const NoticeContent = () => {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { t: tn, i18n } = useTranslation('notice')
  const desktop = useDesktop()
  const snackbar = useSnackbar()
  const [pageValue, setPageValue] = useState<TablePaginationValue>({ page: 1, pageSize: PAGE_SIZES[0] })
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [form, setForm] = useState<{ target: NoticeFormTarget; open: boolean; key: number } | null>(null)
  const deleteConfirm = useConfirmTarget<NoticeListResp>()
  const del = useDeleteNoticeMutation()
  const tableRef = useRef<HTMLDivElement>(null)
  const lastId = useRef<number | null>(null)
  const afterDelete = useRef<number[]>([])
  const fromSheet = useRef(false)
  const removed = useRef(false)

  const page = pageValue.page - 1
  const size = pageValue.pageSize
  const searching = keyword.length > 0
  const list = useNoticesQuery(page, size, { quiet: true, keepPrevious: true, enabled: desktop && !searching })
  const search = useSearchNoticesQuery(keyword, page, size, { quiet: true, keepPrevious: true, enabled: desktop })
  const query = searching ? search : list
  const rows = query.data?.content ?? []
  const total = query.data?.totalElements ?? 0
  const inf = useAdminNoticesInfiniteQuery(keyword, PHONE_SIZE, { quiet: true, enabled: !desktop })
  const phoneItems = inf.data?.pages.flatMap((p) => p.content) ?? []

  const submitSearch = () => {
    setKeyword(searchInput.trim())
    setPageValue((v) => ({ ...v, page: 1 }))
  }
  const clearSearch = () => {
    setSearchInput('')
    setKeyword('')
    setPageValue((v) => ({ ...v, page: 1 }))
  }

  const openForm = (target: NoticeFormTarget) => {
    lastId.current = target.kind === 'edit' ? target.row.notice_id : null
    setForm((cur) => ({ target, open: true, key: (cur?.key ?? 0) + 1 }))
  }
  const closeForm = () => setForm((cur) => (cur ? { ...cur, open: false } : cur))
  const openAdd = () => openForm({ kind: 'add' })
  const openEdit = (row: NoticeListResp) => openForm({ kind: 'edit', row })

  const askDelete = (row: NoticeListResp, sheet: boolean) => {
    const source = desktop ? rows : phoneItems
    const index = source.findIndex((r) => r.notice_id === row.notice_id)
    afterDelete.current = [source[index + 1]?.notice_id, source[index - 1]?.notice_id].filter((id): id is number => id !== undefined)
    fromSheet.current = sheet
    removed.current = false
    deleteConfirm.ask(row)
  }
  const focusAfterRemoval = () => {
    const part = desktop ? ' [data-slot=table-more-button]' : ''
    const reached = focusFirst([...afterDelete.current.map((id) => `[data-notice-id="${id}"]${part}`), ...afterDelete.current.map((id) => `[data-notice-id="${id}"]`)])
    if (!reached && !focusFirst(['[data-notice-add]'])) document.getElementById('main')?.focus({ preventScroll: true })
  }
  const onFormClosed = (e: Event) => {
    e.preventDefault()
    const id = lastId.current
    if (id !== null && focusFirst([`[data-notice-id="${id}"]`])) return
    if (id === null) focusFirst(['[data-notice-add]'])
  }
  const onDeleteClosed = (e: Event) => {
    if (!removed.current || !fromSheet.current) return
    e.preventDefault()
    focusAfterRemoval()
  }

  useScreenAction(desktop ? null : { label: tc('add'), onClick: openAdd })

  const dateText = (iso: string) => formatNoticeDay(iso, i18n.language)
  const periodText = (n: NoticeListResp) => t('adminNotice.periodText', { start: dateText(n.start_date), end: dateText(n.end_date) })
  const statusBadge = (n: NoticeListResp) =>
    isNoticeActive(n.start_date, n.end_date) ? (
      <Badge tone='positive'>{t('notice.statusActive')}</Badge>
    ) : (
      <Badge tone='neutral'>{t('notice.statusInactive')}</Badge>
    )

  const searchField = (
    <Input
      variant='underline'
      size='medium'
      aria-label={t('adminNotice.searchAria')}
      placeholder={t('notice.searchPlaceholder')}
      prefixIcon={<Search />}
      clearable
      enterKeyHint='search'
      value={searchInput}
      onChange={(e) => {
        setSearchInput(e.target.value)
        if (e.target.value === '' && keyword) clearSearch()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) submitSearch()
      }}
      data-notice-search
    />
  )

  const emptyNode = searching ? (
    <ResultSection size='medium' icon={<Search />} title={t('adminNotice.searchEmpty')} />
  ) : (
    <ResultSection size='medium' icon={<Bell />} title={t('adminNotice.emptyTitle')} description={t('adminNotice.emptyDescription')} primaryAction={{ label: tc('add'), onClick: openAdd }} />
  )
  const failureNode = (onRetry: () => void, retrying: boolean) => (
    <ResultSection
      kind='failure'
      size='medium'
      title={t('adminNotice.failureTitle')}
      description={t('adminNotice.failureDescription')}
      primaryAction={{ label: tc('retry'), onClick: onRetry, loading: retrying }}
    />
  )

  const tableHead = (
    <TableHeader>
      <TableRow>
        <TableHead>{t('adminNotice.colTitle')}</TableHead>
        <TableHead>{t('adminNotice.colWriter')}</TableHead>
        <TableHead>{t('adminNotice.colDate')}</TableHead>
        <TableHead align='end'>{t('adminNotice.colViews')}</TableHead>
        <TableHead>{t('adminNotice.colPeriod')}</TableHead>
        <TableMoreHead />
      </TableRow>
    </TableHeader>
  )
  const tableSkeleton = (
    <Table caption={t('adminNotice.caption')} rowHeight='rich'>
      {tableHead}
      <TableBody>
        <TableSkeletonRows rows={5} columns={[{ width: '80%' }, { width: '50%' }, { width: '50%' }, { align: 'end', width: '30%' }, { width: '70%' }, { width: '30%' }]} />
      </TableBody>
    </Table>
  )
  const listSkeleton = (
    <div className='flex flex-col'>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className='flex flex-col gap-x1 px-x6 py-x3'>
          <Skeleton text='t3' className='block w-1/4' />
          <Skeleton text='t5' className='block w-4/5' />
          <Skeleton text='t3' className='block w-3/5' />
        </div>
      ))}
    </div>
  )

  const showPagination = total > PAGE_SIZES[0]
  const desktopBody = (
    <LoadingRegion pending={query.isPending} failed={query.isLoadingError} fallback={tableSkeleton} failure={failureNode(() => void query.refetch(), query.isFetching)}>
      {query.data && rows.length === 0 ? (
        emptyNode
      ) : (
        <Table
          ref={tableRef}
          caption={t('adminNotice.caption')}
          rowHeight='rich'
          pagination={
            showPagination ? (
              <TablePagination
                value={pageValue}
                onValueChange={(v) => setPageValue(v.pageSize !== pageValue.pageSize ? { page: 1, pageSize: v.pageSize } : v)}
                totalItems={total}
                pageSizeOptions={PAGE_SIZES}
                scrollTarget={tableRef}
              />
            ) : undefined
          }
        >
          {tableHead}
          <TableBody>
            {rows.map((n) => (
              <TableRow key={n.notice_id} data-notice-id={n.notice_id}>
                <TableRowHeader className='min-w-[220px] max-w-[420px] whitespace-normal py-x3'>
                  <span className='flex flex-col items-start gap-x1'>
                    <span className='flex flex-wrap items-center gap-x1_5'>
                      {n.is_pinned === 'Y' && (
                        <span className='inline-flex items-center gap-x0_5 text-t3 font-medium text-fg-brand'>
                          <Pin aria-hidden className='size-[14px]' />
                          <span className='sr-only'>{tn('pinned')}</span>
                        </span>
                      )}
                      <Badge tone={NOTICE_TONE[n.notice_type]}>{n.notice_type_name}</Badge>
                    </span>
                    <span className={TEXT_WRAP}>{n.title}</span>
                  </span>
                </TableRowHeader>
                <TableCell className='whitespace-nowrap py-x3'>{n.writer_name}</TableCell>
                <TableCell className='whitespace-nowrap py-x3'>{dateText(n.create_date)}</TableCell>
                <TableCell align='end' className='whitespace-nowrap py-x3 tabular-nums'>
                  {n.view_count.toLocaleString(i18n.language)}
                </TableCell>
                <TableCell className='whitespace-nowrap py-x3'>
                  <span className='flex flex-col items-start gap-x1'>
                    <span>{periodText(n)}</span>
                    {statusBadge(n)}
                  </span>
                </TableCell>
                <TableMoreCell label={n.title}>
                  <ResponsiveMenuContent title={n.title}>
                    <ResponsiveMenuGroup>
                      <ResponsiveMenuItem label={tc('edit')} onSelect={() => openEdit(n)} />
                    </ResponsiveMenuGroup>
                    <ResponsiveMenuGroup>
                      <ResponsiveMenuItem label={tc('delete')} tone='critical' onSelect={() => askDelete(n, false)} />
                    </ResponsiveMenuGroup>
                  </ResponsiveMenuContent>
                </TableMoreCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </LoadingRegion>
  )

  const phoneStatus = inf.isFetchNextPageError ? 'error' : inf.hasNextPage || inf.isFetchingNextPage ? 'loading' : 'end'
  const phoneSingle = (inf.data?.pages.length ?? 0) <= 1 && !inf.hasNextPage
  const phoneBody = (
    <LoadingRegion
      pending={inf.isPending}
      failed={inf.isLoadingError}
      fallback={listSkeleton}
      failure={failureNode(() => void inf.refetch(), inf.isFetching)}
    >
      {inf.data && phoneItems.length === 0 ? (
        emptyNode
      ) : (
        <div className='pb-x2' aria-busy={inf.isFetchingNextPage || undefined}>
          {groupOf(phoneItems).map((g) => (
            <div key={g.id}>
              {g.titled && <ListHeader variant='mediumWeak'>{g.id === 'pinned' ? tn('pinned') : tn('allNotices')}</ListHeader>}
              <List>
                {g.items.map((n) => (
                  <NoticeRow key={n.notice_id} notice={n} badges={statusBadge(n)} onClick={() => openEdit(n)} />
                ))}
              </List>
            </div>
          ))}
          {!phoneSingle || phoneStatus === 'error' ? (
            <InfiniteListEnd
              status={phoneStatus}
              endText={t('adminNotice.listEnd')}
              onRetry={() => void inf.fetchNextPage()}
              onReachEnd={() => {
                if (inf.hasNextPage && !inf.isFetchingNextPage) void inf.fetchNextPage()
              }}
            />
          ) : null}
        </div>
      )}
    </LoadingRegion>
  )

  const target = deleteConfirm.target
  const cardTitle = query.isSuccess ? t('adminNotice.listTitle', { count: total }) : t('adminNotice.listTitleBase')

  return (
    <ScreenBody density='medium'>
      <ScreenTitleRow
        title={t('notice.title')}
        action={
          <Button variant='neutralOutline' size='small' onClick={openAdd} data-notice-add>
            <Plus />
            {tc('add')}
          </Button>
        }
      />
      {desktop ? (
        <Card body='list'>
          <CardHeader>
            <CardTitle>{cardTitle}</CardTitle>
          </CardHeader>
          <div className='px-x6 pb-x2 pt-x2'>{searchField}</div>
          {desktopBody}
        </Card>
      ) : (
        <div className='bg-bg-layer-default'>
          <div className='px-x6 pb-x1 pt-x3'>{searchField}</div>
          {phoneBody}
        </div>
      )}
      {form && (
        <NoticeFormDialog
          key={form.key}
          open={form.open}
          target={form.target}
          onOpenChange={(next) => (next ? undefined : closeForm())}
          onSaved={closeForm}
          onCloseAutoFocus={onFormClosed}
          onDelete={(row) => askDelete(row, true)}
        />
      )}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title={t('notice.deleteTitle')}
        description={t('notice.deleteConfirm', { title: target?.title ?? '' })}
        onConfirm={async () => {
          if (target) await del.mutateAsync(target.notice_id)
          removed.current = true
        }}
        onDone={() => {
          if (fromSheet.current) closeForm()
          // 쪽의 마지막 줄을 지웠으면 앞 쪽으로 — 빈 쪽이 남지 않게
          if (desktop && rows.length === 1 && pageValue.page > 1) setPageValue((v) => ({ ...v, page: v.page - 1 }))
          snackbar.show({ message: t('adminNotice.deleted'), tone: 'positive' })
        }}
        onCloseAutoFocus={onDeleteClosed}
      />
    </ScreenBody>
  )
}
