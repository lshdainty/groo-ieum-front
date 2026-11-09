import type { ChartColor } from '@/shared/ds/chart'

/**
 * 휴가 유형 도넛 색(I-23 D 21 · HB3 A) — 유형마다 늘 같은 색. 서버 VacationType 차례(orderSeq 1 ~ 7)에 차트 색 배정 차례(v110)를
 * 하나씩 준다. 값이 있는 유형만 그려도 색이 달라지지 않는다. 표에 없는 새 유형은 쓰지 않은 색부터(assignChartColors),
 * 회색은 "기타" 전용이라 7종인 지금은 나오지 않는다.
 */
export const VACATION_TYPE_COLORS: Readonly<Record<string, ChartColor>> = {
  ANNUAL: 'blue',
  MATERNITY: 'green',
  WEDDING: 'orange',
  BEREAVEMENT: 'violet',
  OVERTIME: 'pink',
  HEALTH: 'indigo',
  ARMY: 'red',
}

export const vacationTypeColor = (type: string): ChartColor | null => VACATION_TYPE_COLORS[type] ?? null
