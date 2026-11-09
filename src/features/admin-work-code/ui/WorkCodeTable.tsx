import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Card } from '@/shared/ds/card'
import { List, ListButtonItem } from '@/shared/ds/list'
import { ResponsiveMenuContent, ResponsiveMenuGroup, ResponsiveMenuItem } from '@/shared/ds/menu'
import { ResultSection } from '@/shared/ds/result-section'
import { LoadingRegion, Skeleton } from '@/shared/ds/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableMoreCell, TableMoreHead, TableRow, TableRowHeader, TableSkeletonRows } from '@/shared/ds/table'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { workCodeTypeKey, type WorkCodeRow } from '../lib/work-code-rows'

const INDENT = ['', 'pl-x5', 'pl-x10'] as const
const TEXT_WRAP = '[overflow-wrap:break-word] [word-break:keep-all]'

/**
 * 업무 코드 표 한 장(업무 파트 · 업무 구분 같은 열) — 데스크톱 ds Table(이름 · 코드 · 종류 · 순서 · ⋮) 카드 한 장(머리 없음),
 * 폰은 List 줄("{코드} · {종류}" · 줄을 누르면 수정 시트). 이름은 들임 단계마다 20 + 앞 "└". 읽기는 quiet — 실패는 구역 Result Section.
 */
export function WorkCodeTable({
  caption,
  rows,
  pending,
  failed,
  fetching,
  onRetry,
  failureTitle,
  empty,
  onAddChild,
  onEdit,
  onDelete,
}: {
  caption: string
  rows: WorkCodeRow[]
  pending: boolean
  failed: boolean
  fetching: boolean
  onRetry: () => void
  failureTitle: string
  empty: ReactNode
  onAddChild: (row: WorkCodeRow) => void
  onEdit: (row: WorkCodeRow) => void
  onDelete: (row: WorkCodeRow) => void
}) {
  const { t } = useTranslation('work')
  const { t: tc } = useTranslation('common')
  const desktop = useDesktop()

  const head = (
    <TableHeader>
      <TableRow>
        <TableHead>{t('adminWorkCode.colName')}</TableHead>
        <TableHead>{t('adminWorkCode.colCode')}</TableHead>
        <TableHead>{t('adminWorkCode.colType')}</TableHead>
        <TableHead align='end'>{t('adminWorkCode.colOrder')}</TableHead>
        <TableMoreHead />
      </TableRow>
    </TableHeader>
  )
  const tableSkeleton = (
    <Table caption={caption}>
      {head}
      <TableBody>
        <TableSkeletonRows rows={5} columns={[{ width: '60%' }, { width: '50%' }, { width: '40%' }, { align: 'end', width: '30%' }, { width: '30%' }]} />
      </TableBody>
    </Table>
  )
  const listSkeleton = (
    <div className='flex flex-col'>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className='flex flex-col gap-x1 px-x6 py-x3'>
          <Skeleton text='t5' className='block w-3/5' />
          <Skeleton text='t3' className='block w-2/5' />
        </div>
      ))}
    </div>
  )

  const body = (
    <LoadingRegion
      pending={pending}
      failed={failed}
      fallback={desktop ? tableSkeleton : listSkeleton}
      failure={
        <ResultSection
          kind='failure'
          size='medium'
          title={failureTitle}
          description={t('adminWorkCode.failureDescription')}
          primaryAction={{ label: tc('retry'), onClick: onRetry, loading: fetching }}
        />
      }
    >
      {rows.length === 0 ? (
        empty
      ) : desktop ? (
        <Table caption={caption}>
          {head}
          <TableBody>
            {rows.map((row) => {
              const { code } = row
              return (
                <TableRow key={code.work_code_id} data-work-code-id={code.work_code_id} data-level={row.level}>
                  <TableRowHeader className={`min-w-[200px] whitespace-normal ${TEXT_WRAP}`}>
                    <span className={`flex items-start gap-x1 ${INDENT[row.level]}`}>
                      {row.level > 0 && (
                        <span aria-hidden className='shrink-0 text-fg-neutral-subtle'>
                          └
                        </span>
                      )}
                      <span>{code.work_code_name}</span>
                    </span>
                  </TableRowHeader>
                  <TableCell className='whitespace-nowrap'>{code.work_code}</TableCell>
                  <TableCell className='whitespace-nowrap'>{t(workCodeTypeKey(code.code_type))}</TableCell>
                  <TableCell align='end' className='whitespace-nowrap tabular-nums'>
                    {code.order_seq}
                  </TableCell>
                  <TableMoreCell label={code.work_code_name}>
                    <ResponsiveMenuContent title={code.work_code_name}>
                      {row.canAddChild && (
                        <ResponsiveMenuGroup>
                          <ResponsiveMenuItem label={t('addSubCode')} onSelect={() => onAddChild(row)} />
                        </ResponsiveMenuGroup>
                      )}
                      <ResponsiveMenuGroup>
                        <ResponsiveMenuItem label={tc('edit')} onSelect={() => onEdit(row)} />
                      </ResponsiveMenuGroup>
                      <ResponsiveMenuGroup>
                        <ResponsiveMenuItem label={tc('delete')} tone='critical' onSelect={() => onDelete(row)} />
                      </ResponsiveMenuGroup>
                    </ResponsiveMenuContent>
                  </TableMoreCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      ) : (
        <List>
          {rows.map((row) => (
            <ListButtonItem
              key={row.code.work_code_id}
              data-work-code-id={row.code.work_code_id}
              data-level={row.level}
              prefix={
                row.level > 0 ? (
                  <span aria-hidden className={`text-t4 text-fg-neutral-subtle ${row.level === 2 ? 'pl-x5' : ''}`}>
                    └
                  </span>
                ) : undefined
              }
              title={row.code.work_code_name}
              detail={t('adminWorkCode.rowDetail', { code: row.code.work_code, type: t(workCodeTypeKey(row.code.code_type)) })}
              align='top'
              onClick={() => onEdit(row)}
            />
          ))}
        </List>
      )}
    </LoadingRegion>
  )

  return <div data-work-code-table>{desktop ? <Card body='list'>{body}</Card> : body}</div>
}
