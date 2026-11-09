import { useTranslation } from 'react-i18next'

import { Select, SelectItem } from '@/shared/ds/select'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { ScreenBands } from '@/widgets/layout/ui/ScreenBands'
import { ScreenBody, ScreenTitleRow } from '@/widgets/layout/ui/ScreenBody'
import { useDuesContext } from '@/features/culture-dues/model/DuesContext'
import { DuesBirthMatrix } from './DuesBirthMatrix'
import { DuesHistory } from './DuesHistory'
import { DuesSummary } from './DuesSummary'

/** 고른 해 선택지 — 5년 전 ~ 1년 뒤(지금 그대로) */
const yearOptions = (): number[] => {
  const current = new Date().getFullYear()
  return Array.from({ length: 7 }, (_, i) => current - 5 + i)
}

/**
 * 회비(E 37) — 데스크톱: 제목 줄(h1 + 오른쪽 연도 Select) 아래 카드 셋(사이 8). 폰: 상단 바 제목 아래 띠 셋(사이 8),
 * 연도 Select 는 첫 띠 맨 위. 구역마다 따로 기다리고 따로 실패한다 — 연도를 바꾸면 머리는 그대로, 숫자 · 행렬 · 표 자리만 기다린다.
 */
export const DuesContent = () => {
  const { t } = useTranslation('culture')
  const desktop = useDesktop()
  const { year, setYear, month } = useDuesContext()

  const yearSelect = (
    <Select
      size={desktop ? 'medium' : 'large'}
      aria-label={t('dues.yearAria')}
      value={String(year)}
      onValueChange={(v) => setYear(parseInt(v, 10))}
      className={desktop ? 'w-[140px]' : undefined}
    >
      {yearOptions().map((y) => (
        <SelectItem key={y} value={String(y)} label={t('dues.yearLabel', { year: y })} />
      ))}
    </Select>
  )

  return (
    <ScreenBody density='high'>
      <ScreenTitleRow title={t('dues.title')} action={yearSelect} />
      {desktop ? (
        <div className='flex flex-col gap-x2'>
          <DuesSummary year={year} month={month} />
          <DuesBirthMatrix year={year} />
          <DuesHistory key={year} year={year} />
        </div>
      ) : (
        <ScreenBands>
          <DuesSummary year={year} month={month} leading={yearSelect} />
          <DuesBirthMatrix year={year} />
          <DuesHistory key={year} year={year} />
        </ScreenBands>
      )}
    </ScreenBody>
  )
}
