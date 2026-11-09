import i18n from '@/app/config/i18n'

const MINUS = '−'

/**
 * 비중 % 표기(DESIGN.hr "퍼센트" — 전체 중 몫: 도넛 범례 · 승인율) — 소수 첫째 자리를 늘 한 자리로("30.0%").
 * 0 보다 크고 0.05% 미만이면 "0.1% 미만"(반올림하면 "0.0%" 로 사라지는 것을 막는다), 유한하지 않으면(분모 0) "—".
 * 값은 0 ~ 100 단위 퍼센트다. 진행률(정수)은 shared/lib/percent.ts.
 */
export function formatShare(pct: number): string {
  if (!Number.isFinite(pct)) return '—'
  if (pct < 0) {
    if (Math.round(-pct * 10) === 0) return '0.0%'
    return `${MINUS}${formatShare(-pct)}`
  }
  if (pct > 0 && pct < 0.05) return i18n.t('common:percentBelowShare')
  return `${(Math.round(pct * 10) / 10).toFixed(1)}%`
}

/** 몫 ÷ 전체 를 % 로 — 전체가 0 이면 "—" */
export const shareOf = (part: number, whole: number): string => (whole > 0 ? formatShare((part / whole) * 100) : '—')

/**
 * 등락률(%) — 소수 둘째 자리(5.00% · 33.33% · −12.30%). 증감 화살표가 방향을 말하는 자리는 sign "none"(절댓값).
 * 반올림해서 0.00 이 되는 음수는 "−0.00%" 가 아니라 "0.00%", 유한하지 않으면 "—".
 */
export function formatChangeRate(pct: number, { sign = 'auto' }: { sign?: 'auto' | 'always' | 'none' } = {}): string {
  if (!Number.isFinite(pct)) return '—'
  const body = Math.abs(pct).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const zero = Number(body.replace(/,/g, '')) === 0
  const prefix = sign === 'none' || zero ? (sign === 'always' && zero ? '+' : '') : pct < 0 ? MINUS : sign === 'always' ? '+' : ''
  return `${prefix}${body}%`
}
