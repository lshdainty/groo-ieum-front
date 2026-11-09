/** 날짜 내림차순(최신 먼저)으로 정렬해 앞 n 줄 — 서버가 오름차순으로 주든 내림차순으로 주든 같다. 날짜는 ISO 글(YYYY-MM-DD…)이라 글 비교로 충분하다 */
export const latestRows = <T>(rows: readonly T[] | undefined, dateOf: (row: T) => string, count = 5): T[] =>
  [...(rows ?? [])].sort((a, b) => dateOf(b).localeCompare(dateOf(a))).slice(0, count)
