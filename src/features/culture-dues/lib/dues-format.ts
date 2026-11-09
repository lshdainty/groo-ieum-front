import dayjs from 'dayjs'

import { dsLanguage, dsMoney } from '@/shared/ds/i18n'
import type { GetYearDuesResp } from '@/entities/dues'

/** 출금 · 음수의 빼기 기호 — U+2212(하이픈 아님, DESIGN.hr 금액) */
export const MINUS_SIGN = '−'

const english = () => dsLanguage().startsWith('en')

/**
 * 표 · 줄의 날짜 — 올해면 연도를 빼고("10월 1일"), 다른 해를 고른 화면이면 연도를 붙인다("2025년 10월 1일").
 * 서버 날짜는 "2026-10-01"(옛 가짜 응답은 "20261001")이고 dayjs 가 둘 다 읽는다. `now` 는 시험 · 하네스가 시계를 고정하는 자리.
 */
export const formatDuesDate = (value: string, now: dayjs.Dayjs = dayjs()): string => {
  const d = dayjs(value)
  if (!d.isValid()) return value
  const sameYear = d.year() === now.year()
  if (english()) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) }).format(d.toDate())
  }
  return sameYear ? `${d.month() + 1}월 ${d.date()}일` : `${d.year()}년 ${d.month() + 1}월 ${d.date()}일`
}

/** 입금 "+" · 출금 U+2212 를 붙인 금액 — 원까지(1억이 넘어도 줄여 쓰지 않는다) */
export const signedMoney = (amount: number, calc: GetYearDuesResp['dues_calc']): string =>
  `${calc === 'PLUS' ? '+' : MINUS_SIGN}${dsMoney(Math.abs(amount))}`

/** 부호가 값에 있는 금액 — 남은 돈. 음수는 U+2212 */
export const balanceMoney = (value: number): string => `${value < 0 ? MINUS_SIGN : ''}${dsMoney(Math.abs(value))}`

/** 줄 이름 — ⋮ 의 "{이름} 더보기" · 확인창 대상. 내용 → 이름 → 날짜 + 금액 차례 */
export const duesRowName = (row: GetYearDuesResp): string =>
  row.dues_detail?.trim() || row.dues_user_name?.trim() || `${formatDuesDate(row.dues_date)} ${dsMoney(Math.abs(row.dues_amount))}`

/** 고른 해가 올해면 "올해", 아니면 "{yyyy}년"(회비 현황 설명) */
export const isThisYear = (year: number, now: dayjs.Dayjs = dayjs()): boolean => year === now.year()
