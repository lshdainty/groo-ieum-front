import { useTranslation } from 'react-i18next'

import { Select, SelectItem } from '@/shared/ds/select'
import { useUser } from '@/entities/session'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { ScreenBody, ScreenTitleRow } from '@/widgets/layout/ui/ScreenBody'
import { useHistoryContext } from '@/features/vacation-history/model/HistoryContext'
import { VacationSections } from './VacationSections'

/** 고른 해 선택지 — 5년 전 ~ 1년 뒤(지금 그대로) */
const yearOptions = (): number[] => {
  const current = new Date().getFullYear()
  return Array.from({ length: 7 }, (_, i) => current - 5 + i)
}

/**
 * 휴가 현황(I-25 C — 남은 휴가 먼저, 내 정보 카드는 걷었다) — 제목 줄 "휴가 현황" + 연도 Select(데스크톱), 폰은 상단 바가 제목이고 연도는 첫 띠 맨 위.
 * 연도를 바꾸면 머리는 바로 두고 숫자 · 표 자리만 기다린다. 트리는 폭과 상관없이 하나(Select 하나가 위치만 옮겨 가지 않고 둘 다 그리되 한쪽만 보인다).
 */
const HistoryContent = () => {
  const { t } = useTranslation('vacation')
  const desktop = useDesktop()
  const { loginUser } = useUser()
  const { selectedYear, setSelectedYear } = useHistoryContext()
  const userId = loginUser?.user_id || ''

  const yearSelect = (
    <Select size='responsive' aria-label={t('history.yearAria')} value={selectedYear} onValueChange={setSelectedYear} className='w-[9rem]'>
      {yearOptions().map((y) => (
        <SelectItem key={y} value={String(y)} label={t('history.yearLabel', { year: y })} />
      ))}
    </Select>
  )

  return (
    <ScreenBody density='high'>
      <ScreenTitleRow title={t('history.title')} action={desktop ? yearSelect : undefined} />
      {userId && <VacationSections userId={userId} year={selectedYear} leading={desktop ? undefined : yearSelect} />}
    </ScreenBody>
  )
}

export { HistoryContent }
