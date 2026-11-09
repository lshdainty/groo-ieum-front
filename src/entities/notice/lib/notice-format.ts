import dayjs from 'dayjs'

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']

const isKo = (lang: string): boolean => lang.startsWith('ko')

/**
 * 목록의 날짜 — "{M}월 {D}일", 올해가 아니면 "{yyyy}년 {M}월 {D}일"(DESIGN.hr 날짜 규칙). 영어는 "Oct 6" · "Oct 6, 2025".
 * `now` 는 하네스가 시계를 고정할 때를 위해 받는다.
 */
export function formatNoticeDay(iso: string, lang: string, now: Date = new Date()): string {
  const d = dayjs(iso)
  const sameYear = d.year() === now.getFullYear()
  if (isKo(lang)) return sameYear ? `${d.month() + 1}월 ${d.date()}일` : `${d.year()}년 ${d.month() + 1}월 ${d.date()}일`
  return new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) }).format(d.toDate())
}

/** 상세의 작성 시각 — "{M}월 {D}일 ({요일}) {오전/오후} {h}:{mm}". 영어는 "Tue, Oct 6, 3:20 PM" */
export function formatNoticeDateTime(iso: string, lang: string): string {
  const d = dayjs(iso)
  if (isKo(lang)) {
    const hour = d.hour()
    const h12 = hour % 12 === 0 ? 12 : hour % 12
    return `${d.month() + 1}월 ${d.date()}일 (${WEEKDAY_KO[d.day()]}) ${hour < 12 ? '오전' : '오후'} ${h12}:${String(d.minute()).padStart(2, '0')}`
  }
  return new Intl.DateTimeFormat(lang, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(d.toDate())
}
