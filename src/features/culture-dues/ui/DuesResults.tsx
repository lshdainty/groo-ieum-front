import { Receipt, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ResultSection } from '@/shared/ds/result-section'
import { Skeleton } from '@/shared/ds/skeleton'
import { isThisYear } from '../lib/dues-format'

/** 구역 읽기 실패(U) — 서버 글을 그리지 않는다. 제목은 "{구역}을/를 불러오지 못했어요" 의 구역 이름만 받는다 */
export const DuesFailure = ({ title, onRetry, retrying }: { title: string; onRetry: () => void; retrying?: boolean }) => {
  const { t } = useTranslation('culture')
  const { t: tc } = useTranslation('common')
  return (
    <ResultSection
      kind='failure'
      size='medium'
      title={title}
      description={t('dues.failure.description')}
      primaryAction={{ label: tc('retry'), onClick: onRetry, loading: retrying }}
    />
  )
}

/** 입출금 내역이 없을 때 — 관리 권한이면 [추가] */
export const DuesHistoryEmpty = ({ year, onAdd }: { year: number; onAdd?: () => void }) => {
  const { t } = useTranslation('culture')
  const { t: tc } = useTranslation('common')
  return (
    <ResultSection
      size='medium'
      icon={<Receipt />}
      title={t('dues.empty.history', { period: isThisYear(year) ? t('dues.period.this') : t('dues.period.year', { year }) })}
      primaryAction={onAdd ? { label: tc('add'), onClick: onAdd } : undefined}
    />
  )
}

export const DuesMatrixEmpty = () => {
  const { t } = useTranslation('culture')
  return <ResultSection size='medium' icon={<Users />} title={t('birthDues.empty.users')} />
}

/** 회비 현황 자리 — 라벨 넷 + 숫자(데스크톱 한 줄 넷 · 폰 키-값 줄 넷) */
export const SummarySkeleton = ({ desktop }: { desktop: boolean }) =>
  desktop ? (
    <div className='grid grid-cols-4'>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className='flex flex-col items-start gap-x1 px-x5 first:pl-0 last:pr-0'>
          <Skeleton text='t3' className='block w-1/2' />
          <Skeleton text='t7' className='block w-3/4' />
          <Skeleton text='t3' className='block w-full' />
        </div>
      ))}
    </div>
  ) : (
    <div className='flex flex-col'>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className='flex items-center justify-between gap-x4 px-x6 py-x3'>
          <div className='flex w-1/2 flex-col gap-x1'>
            <Skeleton text='t5' className='block w-3/4' />
            <Skeleton text='t3' className='block w-full' />
          </div>
          <Skeleton text='t5' className='block w-1/4' />
        </div>
      ))}
    </div>
  )

/** 생일비 행렬 자리 — 범례 + 줄 셋 */
export const MatrixSkeleton = () => (
  <div className='flex flex-col gap-x2'>
    <Skeleton text='t3' className='block w-1/2' />
    {Array.from({ length: 3 }).map((_, i) => (
      <Skeleton key={i} text='t5' className='block w-full' />
    ))}
  </div>
)
