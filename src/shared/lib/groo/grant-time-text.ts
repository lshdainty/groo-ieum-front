import { splitGrantTime } from '@/shared/lib/groo/grant-time'

type T = (key: string, options?: Record<string, unknown>) => string

/**
 * 받을 휴가 시간 글 — 영어 화면은 서버 글("3hour(s)" · "1day(s) 2hour(s)", 숫자와 단위가 붙고 단수 · 복수가 없다) 대신
 * `grant_time` 숫자(하루 = 1, 한 시간 = 0.125)로 웹이 쓴다("3 hours" · "1 day 2 hours" · 0 은 "0 days", 11-11 결정 4A).
 * 한국어는 서버 글을 그대로 둔다. `t` 는 `vacation` 네임스페이스다. 종류 이름은 서버 영어 필드를 그대로 쓰므로 여기서 다루지 않는다.
 */
export const grantTimeText = (grantTime: number | null | undefined, serverText: string, language: string, t: T): string => {
  if (!language.startsWith('en') || typeof grantTime !== 'number' || !Number.isFinite(grantTime)) return serverText
  const { days, hours, minutes } = splitGrantTime(grantTime)
  const parts = [
    days > 0 ? t('grantText.day', { count: days }) : '',
    hours > 0 ? t('req.form.hoursValue', { count: hours }) : '',
    minutes > 0 ? t('req.form.minutesValue', { count: minutes }) : '',
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : t('grantText.day', { count: 0 })
}
