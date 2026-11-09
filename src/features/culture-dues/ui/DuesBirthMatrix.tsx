import { useEffect, useRef, useState } from 'react'
import { Gift } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/shared/lib/cn'
import { dsMoney } from '@/shared/ds/i18n'
import { LoadingRegion } from '@/shared/ds/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ds/tooltip'
import { useUsersMonthBirthDuesQuery } from '@/entities/dues'
import { useUsersQuery } from '@/entities/user'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { MATRIX_CELL_MAX, MATRIX_CELL_MIN, MONTH_LABEL_MIN, matrixCellWidth, rowsOf, type Row } from '../lib/dues-matrix'
import { DuesFailure, DuesMatrixEmpty, MatrixSkeleton } from './DuesResults'
import { DuesSection } from './DuesSection'

const useWidth = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => setWidth(el.clientWidth)
    read()
    const observer = new ResizeObserver(read)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

/**
 * 월별 생일비 입금 현황(E 43) — 범례 + 행렬. 칸은 색만(입금 = 브랜드 채움 · 아님 = 옅은 회색), 칸에 글을 두지 않는다.
 * 금액은 가리키면(웹) · 누르면(터치) 툴팁으로, 보조 기술은 표(머리 = 달 · 줄 머리 = 이름)와 칸마다 읽는 글로 — 칸 96개는 탭 순서에 없다.
 */
export const DuesBirthMatrix = ({ year }: { year: number }) => {
  const { t } = useTranslation('culture')
  const desktop = useDesktop()
  const birth = useUsersMonthBirthDuesQuery(year, { quiet: true })
  const users = useUsersQuery({ quiet: true })
  const pending = birth.isPending || users.isPending
  const failed = birth.isLoadingError || users.isLoadingError
  const retry = () => {
    if (birth.isLoadingError) void birth.refetch()
    if (users.isLoadingError) void users.refetch()
  }
  const rows = rowsOf(users.data, birth.data)

  return (
    <DuesSection title={t('dues.monthBirthDuesTitle')}>
      <LoadingRegion
        pending={pending}
        failed={failed}
        fallback={<MatrixSkeleton />}
        failure={<DuesFailure title={t('dues.failure.matrix')} onRetry={retry} retrying={birth.isFetching || users.isFetching} />}
      >
        {users.data && rows.length === 0 ? <DuesMatrixEmpty /> : <Matrix rows={rows} nameColumn={desktop ? 96 : 72} />}
      </LoadingRegion>
    </DuesSection>
  )
}

export const Matrix = ({ rows, nameColumn: nameWanted }: { rows: Row[]; nameColumn: number }) => {
  const { t } = useTranslation('culture')
  const [ref, width] = useWidth()
  // 터치로 연 툴팁 하나 — 누르면 열고 다시 누르거나 다른 곳을 누르면 닫는다
  const [openKey, setOpenKey] = useState<string | null>(null)
  // 폭이 모자라(360) 칸이 18 로도 안 들면 이름 열을 줄인다 — 표가 본문 밖으로 나가지 않게(이름은 줄바꿈)
  const nameColumn = width > 0 ? Math.max(48, Math.min(nameWanted, width - MATRIX_CELL_MIN * 12 - 60)) : nameWanted
  const cell = width > 0 ? matrixCellWidth(width, nameColumn) : MATRIX_CELL_MAX
  const monthText = cell >= MONTH_LABEL_MIN

  useEffect(() => {
    if (!openKey) return
    const close = (e: PointerEvent) => {
      if (!(e.target instanceof Element) || !e.target.closest('[data-matrix-cell]')) setOpenKey(null)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [openKey])

  return (
    <div ref={ref}>
      <ul className='m-0 mb-x3 flex list-none flex-wrap items-center gap-x4 p-0 text-t3 text-fg-neutral-subtle' data-matrix-legend>
        <li className='flex items-center gap-x1_5'>
          <span aria-hidden className='size-x3_5 rounded-r1 bg-bg-brand-solid' />
          {t('dues.legend.paid')}
        </li>
        <li className='flex items-center gap-x1_5'>
          <span aria-hidden className='size-x3_5 rounded-r1 bg-bg-neutral-weak' />
          {t('dues.legend.notYet')}
        </li>
        <li className='flex items-center gap-x1_5'>
          <Gift aria-hidden className='size-x3_5' />
          {t('dues.legend.birthMonth')}
        </li>
      </ul>
      <table className='table-fixed border-separate border-spacing-x1' data-matrix style={{ marginLeft: -4, width: nameColumn + cell * 12 + 4 * 14 }}>
        <caption className='sr-only'>{t('dues.monthBirthDuesTitle')}</caption>
        <colgroup>
          <col style={{ width: nameColumn }} />
          {Array.from({ length: 12 }).map((_, i) => (
            <col key={i} style={{ width: cell }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th scope='col' className='p-0 text-start text-t3 font-medium text-fg-neutral-subtle'>
              {monthText ? <span className='sr-only'>{t('dues.matrixName')}</span> : <span>{t('dues.monthUnit')}</span>}
            </th>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <th key={m} scope='col' className='whitespace-nowrap p-0 text-center text-t3 font-medium text-fg-neutral-subtle'>
                {monthText ? t('dues.monthFormat', { month: m }) : m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ user, amounts, birthMonth }) => (
            <tr key={user.user_id}>
              <th scope='row' className='p-0 pr-x1 text-start text-t3 font-medium text-fg-neutral' style={{ overflowWrap: 'break-word', wordBreak: 'keep-all' }}>
                {user.user_name}
              </th>
              {amounts.map((value, index) => {
                const month = index + 1
                const key = `${user.user_id}-${month}`
                const paid = value > 0
                const text = paid ? t('dues.tooltip.paid', { name: user.user_name, month, amount: dsMoney(value) }) : t('dues.tooltip.none', { name: user.user_name, month })
                return (
                  <td key={month} className='p-0'>
                      <Tooltip
                        open={openKey === key}
                        onOpenChange={(open) => setOpenKey((cur) => (open ? key : cur === key ? null : cur))}
                      >
                        <TooltipTrigger asChild>
                          <div
                            data-matrix-cell
                            data-paid={paid || undefined}
                            data-birth={birthMonth === month || undefined}
                            onPointerDown={(e) => {
                              if (e.pointerType === 'mouse') return
                              setOpenKey((cur) => (cur === key ? null : key))
                            }}
                            className={cn('relative h-x7 rounded-r1', paid ? 'bg-bg-brand-solid' : 'bg-bg-neutral-weak')}
                          >
                            {birthMonth === month && (
                              <Gift aria-hidden className={cn('absolute left-x0_5 top-x0_5 size-x3', paid ? 'text-static-white' : 'text-fg-neutral')} />
                            )}
                            <span className='sr-only'>{text}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>{text}</TooltipContent>
                      </Tooltip>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
