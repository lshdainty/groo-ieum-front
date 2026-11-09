import type { GetYearDuesResp } from '@/entities/dues'

/** 홈 회비 내역에 보이는 줄 수 — 최근 5줄(쪽 넘김 없음 · 나머지는 "전체 보기") */
export const RECENT_DUES_ROWS = 5

/** 서버는 오래된 것부터 준다 — 최근 5줄을 최신부터(같은 날은 나중 것 먼저) */
export const recentDues = (rows: readonly GetYearDuesResp[] | undefined): GetYearDuesResp[] =>
  [...(rows ?? [])].reverse().slice(0, RECENT_DUES_ROWS)

