import { useRef, useState } from 'react'
import { CalendarX2, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useGrantTimeText } from '@/shared/lib/groo/use-grant-time-text'

import { InfiniteListEnd } from '@/shared/ds/infinite-list'
import { List, ListButtonItem, ListItem } from '@/shared/ds/list'
import { ResponsiveMenuContent, ResponsiveMenuGroup, ResponsiveMenuItem } from '@/shared/ds/menu'
import { ResultSection } from '@/shared/ds/result-section'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ds/tabs'
import { formatPeriodText } from '@/shared/lib/date-text'
import type { GetUserVacationHistoryResp, VacationGrantInfo, VacationUsageInfo } from '@/entities/vacation'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { formatValidity, joinDetail } from '@/features/vacation-history/lib/record-format'

/** 쪽 크기 선택지 — 가장 작은 쪽 크기 이하면 넘김 줄을 두지 않는다 */
const PAGE_SIZES = [10, 25, 50] as const
/** 폰은 쪽 넘김이 아니라 끝없이 — 받은 줄을 20개씩 더 보인다 */
const PHONE_STEP = 20
const WORD = '[overflow-wrap:break-word] [word-break:keep-all]'

type RecordTab = 'usages' | 'grants'

/** 읽기 상태 — 주면 기록 구역이 스스로 기다림 · 실패를 그린다(휴가 현황 화면). 안 주면 부르는 쪽(홈 위젯)이 그린다 */
export interface RecordsStatus {
  pending: boolean
  failed: boolean
  fetching: boolean
  onRetry: () => void
}

/** 사용 기록 줄의 이름 — ⋮ 의 이름 · 폰 시트 머리 "{휴가 종류} · {사용 기간}" */
const usageTitle = (u: VacationUsageInfo): string => joinDetail(u.vacation_time_type_name, formatPeriodText(u.start_date, u.end_date))

/**
 * 휴가 기록(I-25 C 13) — 탭 "사용 내역 · 부여 내역"(ds Tabs line) + 표(768 이상) · List 줄(미만).
 * 사용 표: 사용 기간 · 휴가 유형 · 사용 시간(오른쪽) · 내용(줄바꿈 전부) · ⋮(고칠 수 있는 줄만 — 동작 둘이라 Menu). 폰 사용 줄: 제목 휴가 유형 ·
 * 설명 "{기간} · {내용}" · 오른쪽 사용 시간, 고칠 수 있는 줄은 누르면 수정(ListButtonItem), 지난 줄은 보기 줄(누름 · 호버 · 포커스 없음).
 * 부여 표: 휴가 유형 · 내용 · 부여 시간 · 남은 시간 · 유효 기간 — 동작 없음. 쪽 넘김은 데스크톱 Table Pagination 10 · 25 · 50, 폰 끝없이 20 줄씩.
 * `pagination={false}` 면 받은 줄을 모두 보인다(홈 위젯 — 줄 수는 부르는 쪽이 자른다).
 */
export function VacationHistoryContent({
  data,
  year,
  canAct,
  onEdit,
  onDelete,
  pagination = true,
  status,
}: {
  data: GetUserVacationHistoryResp | undefined
  year: number
  /** 이 줄에 수정 · 삭제가 있는가(시작 전 + 권한). 없으면 모든 줄이 보기 줄이다 */
  canAct?: (usage: VacationUsageInfo) => boolean
  onEdit?: (usage: VacationUsageInfo) => void
  onDelete?: (usage: VacationUsageInfo) => void
  pagination?: boolean
  status?: RecordsStatus
}) {
  const { t } = useTranslation('vacation')
  const gt = useGrantTimeText()
  const { t: tc } = useTranslation('common')
  const desktop = useDesktop()
  const [tab, setTab] = useState<RecordTab>('usages')
  const [pageValue, setPageValue] = useState<TablePaginationValue>({ page: 1, pageSize: PAGE_SIZES[0] })
  const [shown, setShown] = useState<number>(PHONE_STEP)
  const tableRef = useRef<HTMLDivElement>(null)

  const usages = data?.usages ?? []
  const grants = data?.grants ?? []
  const rows = tab === 'usages' ? usages : grants
  const showPagination = pagination && rows.length > PAGE_SIZES[0]
  const lastPage = Math.max(1, Math.ceil(rows.length / pageValue.pageSize))
  const page = showPagination ? Math.min(pageValue.page, lastPage) : 1
  const pageRows = !pagination ? rows : desktop ? rows.slice((page - 1) * pageValue.pageSize, page * pageValue.pageSize) : rows.slice(0, shown)

  const changeTab = (next: string) => {
    setTab(next as RecordTab)
    setPageValue((v) => ({ ...v, page: 1 }))
    setShown(PHONE_STEP)
  }

  const pager = showPagination ? (
    <TablePagination value={{ ...pageValue, page }} onValueChange={setPageValue} totalItems={rows.length} pageSizeOptions={PAGE_SIZES} scrollTarget={tableRef} />
  ) : undefined

  const usageActions = (u: VacationUsageInfo) => !!canAct?.(u) && !!(onEdit || onDelete)
  const anyAction = tab === 'usages' && (pageRows as VacationUsageInfo[]).some(usageActions)

  const empty = (
    <ResultSection
      size='medium'
      icon={<CalendarX2 />}
      title={t(tab === 'usages' ? 'history.emptyUsage' : 'history.emptyGrant', { year })}
    />
  )

  const usageTable = (
    <Table ref={tableRef} caption={t('history.captionUsage')} pagination={pager}>
      <TableHeader>
        <TableRow>
          <TableHead>{t('history.usagePeriod')}</TableHead>
          <TableHead>{t('history.colType')}</TableHead>
          <TableHead align='end'>{t('history.usageTime')}</TableHead>
          <TableHead>{t('history.content')}</TableHead>
          {anyAction && <TableMoreHead />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {(pageRows as VacationUsageInfo[]).map((u) => (
          <TableRow key={u.vacation_usage_id} data-usage-id={u.vacation_usage_id}>
            <TableRowHeader className={`min-w-[200px] whitespace-normal ${WORD}`}>{formatPeriodText(u.start_date, u.end_date)}</TableRowHeader>
            <TableCell className={`min-w-[96px] whitespace-normal ${WORD}`}>{u.vacation_time_type_name}</TableCell>
            <TableCell align='end' className='whitespace-nowrap'>
              {gt(u.used_time, u.used_time_str)}
            </TableCell>
            <TableCell className='min-w-[200px] whitespace-pre-wrap [overflow-wrap:anywhere]'>{u.vacation_usage_desc}</TableCell>
            {anyAction &&
              (usageActions(u) ? (
                <TableMoreCell label={usageTitle(u)}>
                  <ResponsiveMenuContent title={usageTitle(u)}>
                    <ResponsiveMenuGroup>{onEdit && <ResponsiveMenuItem label={t('history.edit')} icon={<Pencil />} onSelect={() => onEdit(u)} />}</ResponsiveMenuGroup>
                    {onDelete && (
                      <ResponsiveMenuGroup>
                        <ResponsiveMenuItem label={t('history.delete')} icon={<Trash2 />} tone='critical' onSelect={() => onDelete(u)} />
                      </ResponsiveMenuGroup>
                    )}
                  </ResponsiveMenuContent>
                </TableMoreCell>
              ) : (
                <TableCell />
              ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  const grantTable = (
    <Table ref={tableRef} caption={t('history.captionGrant')} pagination={pager}>
      <TableHeader>
        <TableRow>
          <TableHead>{t('history.colType')}</TableHead>
          <TableHead>{t('history.content')}</TableHead>
          <TableHead align='end'>{t('history.grantTime')}</TableHead>
          <TableHead align='end'>{t('history.remainTime')}</TableHead>
          <TableHead>{t('history.colValidity')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(pageRows as VacationGrantInfo[]).map((g) => (
          <TableRow key={g.vacation_grant_id} data-grant-id={g.vacation_grant_id}>
            <TableRowHeader className={`min-w-[96px] whitespace-normal ${WORD}`}>{g.vacation_type_name}</TableRowHeader>
            <TableCell className='min-w-[200px] whitespace-pre-wrap [overflow-wrap:anywhere]'>{g.vacation_grant_desc}</TableCell>
            <TableCell align='end' className='whitespace-nowrap'>
              {gt(g.grant_time, g.grant_time_str)}
            </TableCell>
            <TableCell align='end' className='whitespace-nowrap'>
              {gt(g.remain_time, g.remain_time_str)}
            </TableCell>
            <TableCell className='min-w-[160px]'>{formatValidity(g.grant_date, g.expiry_date)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  const usageList = (
    <List>
      {(pageRows as VacationUsageInfo[]).map((u) => {
        const common = {
          'data-usage-id': u.vacation_usage_id,
          title: <span className={WORD}>{u.vacation_time_type_name}</span>,
          detail: <span className='[overflow-wrap:anywhere]'>{joinDetail(formatPeriodText(u.start_date, u.end_date), u.vacation_usage_desc)}</span>,
          suffix: <span className='text-t5 font-bold tabular-nums text-fg-neutral'>{gt(u.used_time, u.used_time_str)}</span>,
          align: 'top' as const,
        }
        return usageActions(u) && onEdit ? (
          <ListButtonItem key={u.vacation_usage_id} {...common} onClick={() => onEdit(u)} />
        ) : (
          <ListItem key={u.vacation_usage_id} {...common} />
        )
      })}
    </List>
  )

  const grantList = (
    <List>
      {(pageRows as VacationGrantInfo[]).map((g) => (
        <ListItem
          key={g.vacation_grant_id}
          data-grant-id={g.vacation_grant_id}
          title={<span className={WORD}>{g.vacation_type_name}</span>}
          detail={<span className='[overflow-wrap:anywhere]'>{joinDetail(g.vacation_grant_desc, formatValidity(g.grant_date, g.expiry_date))}</span>}
          align='top'
          suffix={
            <span className='flex flex-col items-end'>
              <span className='text-t5 font-bold tabular-nums text-fg-neutral'>{gt(g.remain_time, g.remain_time_str)}</span>
              <span className='text-t3 font-normal text-fg-neutral-subtle'>{t('history.grantRemainOf', { total: gt(g.grant_time, g.grant_time_str) })}</span>
            </span>
          }
        />
      ))}
    </List>
  )

  const body = (
    <>
      {rows.length === 0 ? empty : desktop ? (tab === 'usages' ? usageTable : grantTable) : tab === 'usages' ? usageList : grantList}
      {!desktop && pagination && rows.length > PHONE_STEP && (
        <InfiniteListEnd
          status={shown < rows.length ? 'loading' : 'end'}
          endText={t(tab === 'usages' ? 'history.usageListEnd' : 'history.grantListEnd')}
          onRetry={() => setShown((n) => n + PHONE_STEP)}
          onReachEnd={() => setShown((n) => (n < rows.length ? n + PHONE_STEP : n))}
        />
      )}
    </>
  )

  return (
    <Tabs value={tab} onValueChange={changeTab} data-vacation-records>
      <div className='px-x6 md:pt-x1'>
        <TabsList aria-label={t('history.recordsTabsAria')} layout={desktop ? 'hug' : 'fill'} size={desktop ? 'medium' : 'small'}>
          <TabsTrigger value='usages'>{t('history.usageTab')}</TabsTrigger>
          <TabsTrigger value='grants'>{t('history.grantTab')}</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value={tab} className='mt-0'>
        {status ? (
          <LoadingRegion
            pending={status.pending}
            failed={status.failed}
            fallback={<RecordsSkeleton desktop={desktop} />}
            failure={
              <ResultSection
                kind='failure'
                size='medium'
                title={t('history.recordsFailureTitle')}
                description={t('memberVacation.failureDescription')}
                primaryAction={{ label: tc('retry'), onClick: status.onRetry, loading: status.fetching }}
              />
            }
          >
            {body}
          </LoadingRegion>
        ) : (
          body
        )}
      </TabsContent>
    </Tabs>
  )
}

/** 표 머리 + 줄 다섯 · 폰 줄 넷 */
const RecordsSkeleton = ({ desktop }: { desktop: boolean }) => {
  const { t } = useTranslation('vacation')
  return desktop ? (
    <Table caption={t('history.captionUsage')}>
      <TableHeader>
        <TableRow>
          <TableHead>{t('history.usagePeriod')}</TableHead>
          <TableHead>{t('history.colType')}</TableHead>
          <TableHead align='end'>{t('history.usageTime')}</TableHead>
          <TableHead>{t('history.content')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableSkeletonRows rows={5} columns={[{ width: '60%' }, { width: '40%' }, { align: 'end', width: '40%' }, { width: '70%' }]} />
      </TableBody>
    </Table>
  ) : (
    <div className='flex flex-col'>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className='flex items-center justify-between gap-x3 px-x6 py-x3'>
          <div className='flex flex-1 flex-col gap-x1'>
            <Skeleton text='t5' className='block w-2/5' />
            <Skeleton text='t3' className='block w-4/5' />
          </div>
          <Skeleton text='t5' className='block w-[48px]' />
        </div>
      ))}
    </div>
  )
}
