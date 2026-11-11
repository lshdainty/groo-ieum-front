import { useTranslation } from 'react-i18next'

import { cn } from '@/shared/lib/cn'
import { withCommaBreaks } from '@/shared/ds/i18n'
import { Badge } from '@/shared/ds/badge'
import { List, ListItem } from '@/shared/ds/list'
import { Skeleton } from '@/shared/ds/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableRowHeader, TableSkeletonRows } from '@/shared/ds/table'
import type { GetYearDuesResp } from '@/entities/dues'
import { DUES_TYPE_KEY } from '../lib/dues-form'
import { balanceMoney, formatDuesDate, signedMoney } from '../lib/dues-format'
import { RECENT_DUES_ROWS } from '../lib/dues-recent'

/** 홈 회비 내역 본문(D 26) — 보기만 한다(⋮ · 추가 · 줄 누름 없음: 고치기는 회비 화면에서). 데스크톱 ds Table, 폰 List 줄 */
export const DuesRecent = ({ rows, desktop }: { rows: GetYearDuesResp[]; desktop: boolean }) => {
  const { t } = useTranslation('culture')
  if (desktop) {
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
          {rows.map((row) => (
            <TableRow key={row.dues_id} data-dues-id={row.dues_id}>
              <TableRowHeader className='whitespace-nowrap'>{formatDuesDate(row.dues_date)}</TableRowHeader>
              <TableCell>{row.dues_user_name}</TableCell>
              <TableCell>
                <Badge>{t(DUES_TYPE_KEY[row.dues_type])}</Badge>
              </TableCell>
              <TableCell className='whitespace-normal [overflow-wrap:break-word] [word-break:keep-all]'>{row.dues_detail}</TableCell>
              <TableCell align='end' className={cn('font-bold', row.dues_calc === 'PLUS' && 'text-fg-brand')} data-amount={row.dues_calc}>
                {withCommaBreaks(signedMoney(row.dues_amount, row.dues_calc))}
              </TableCell>
              <TableCell align='end'>{withCommaBreaks(balanceMoney(row.total_dues))}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }
  return (
    <List>
      {rows.map((row) => {
        const detail = [formatDuesDate(row.dues_date), row.dues_user_name, t(DUES_TYPE_KEY[row.dues_type])].filter(Boolean).join(' · ')
        const title = row.dues_detail?.trim() || row.dues_user_name?.trim() || signedMoney(row.dues_amount, row.dues_calc)
        return (
          <ListItem
            key={row.dues_id}
            data-dues-id={row.dues_id}
            title={title}
            detail={detail}
            align='top'
            suffix={
              <span className='flex flex-col items-end'>
                <span className={cn('text-t5 font-bold tabular-nums', row.dues_calc === 'PLUS' ? 'text-fg-brand' : 'text-fg-neutral')} data-amount={row.dues_calc}>
                  {withCommaBreaks(signedMoney(row.dues_amount, row.dues_calc))}
                </span>
                <span className='text-t2 font-normal text-fg-neutral-subtle'>{withCommaBreaks(t('dues.remaining', { amount: balanceMoney(row.total_dues) }))}</span>
              </span>
            }
          />
        )
      })}
    </List>
  )
}

export const DuesRecentSkeleton = ({ desktop }: { desktop: boolean }) => {
  const { t } = useTranslation('culture')
  if (desktop) {
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
          <TableSkeletonRows rows={RECENT_DUES_ROWS} columns={[{ width: '70%' }, { width: '60%' }, { width: '50%' }, { width: '85%' }, { align: 'end', width: '70%' }, { align: 'end', width: '70%' }]} />
        </TableBody>
      </Table>
    )
  }
  return (
    <div className='flex flex-col'>
      {Array.from({ length: RECENT_DUES_ROWS }).map((_, i) => (
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
}
