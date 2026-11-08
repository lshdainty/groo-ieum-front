// 업무 기록 엑셀 내려받기 기간 검사. 서버(WorkHistoryServiceImpl.validateExcelPeriod)와 같은 규칙이다.
// 비었음 / 끝이 시작보다 앞 / 끝이 시작일 + 1년(LocalDate.plusYears, 당일 포함) 초과 이면 거절.
// 시간대에 흔들리지 않도록 'YYYY-MM-DD' 문자열의 연·월·일 숫자만 비교한다.

const parse = (value?: string): [number, number, number] | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '')
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
}

const isLeap = (y: number): boolean => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0

const compare = (a: [number, number, number], b: [number, number, number]): number =>
  a[0] - b[0] || a[1] - b[1] || a[2] - b[2]

export const isExcelPeriodValid = (startDate?: string, endDate?: string): boolean => {
  const start = parse(startDate)
  const end = parse(endDate)
  if (!start || !end) return false
  if (compare(end, start) < 0) return false

  // LocalDate.plusYears: 2/29 → 평년이면 2/28
  const limitYear = start[0] + 1
  const limitDay = start[1] === 2 && start[2] === 29 && !isLeap(limitYear) ? 28 : start[2]
  return compare(end, [limitYear, start[1], limitDay]) <= 0
}
