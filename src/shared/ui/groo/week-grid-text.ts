/**
 * 일곱 칸 격자(캘린더 월 · 주 · 년 보기 작은 달, 홈 업무 미작성 달력)의 요일 머리 · 날짜 숫자 글 — 글자 크기 200% 에서 멈춘다
 * (groo-design #258 DESIGN.md Layout › 지원 폭: 그보다 크면 칸 폭(화면 폭 ÷ 7)에 두 자리 숫자도 들지 않는다, WCAG 1.4.4 의 200% 는 지킨다).
 * 글자 · 줄 높이를 `min(rem 토큰, static 토큰 × 2)` 로 멈춘다 — 담다 ds date-picker 의 요일 글(WEEKDAY_TEXT)과 같은 셈이다. 제목 · 일정
 * 이름 같은 다른 글은 그대로 커진다. 담다 ds 가 이 상한을 공용으로 내보내면 그것으로 바꾼다.
 * (Tailwind 는 소스의 글자 그대로를 읽으므로 단계마다 다 적는다)
 */
export const WEEK_GRID_TEXT = {
  t2: 'text-[length:min(var(--text-t2),calc(var(--text-t2-static)_*_2))] leading-[min(var(--text-t2--line-height),calc(var(--text-t2-static--line-height)_*_2))]',
  t3: 'text-[length:min(var(--text-t3),calc(var(--text-t3-static)_*_2))] leading-[min(var(--text-t3--line-height),calc(var(--text-t3-static--line-height)_*_2))]',
  t4: 'text-[length:min(var(--text-t4),calc(var(--text-t4-static)_*_2))] leading-[min(var(--text-t4--line-height),calc(var(--text-t4-static--line-height)_*_2))]',
} as const
