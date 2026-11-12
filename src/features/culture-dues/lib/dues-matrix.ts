import type { GetUsersMonthBirthDuesResp } from '@/entities/dues'
import type { GetUsersResp } from '@/entities/user'

/** 칸 폭 = (본문 폭 − 이름 열 − 칸 사이 44) ÷ 12, 18 ~ 60(E 43). 넘치지 않게 본문 폭에 맞춰 줄어든다 */
export const MATRIX_CELL_MIN = 18
export const MATRIX_CELL_MAX = 60
const CELL_GAP_TOTAL = 44

/** 달 글자를 "{m}월" 로 쓸 수 있는 최소 칸 폭 — 이보다 좁으면 숫자만, 이름 열 머리가 "월" */
export const MONTH_LABEL_MIN = 30

export const matrixCellWidth = (bodyWidth: number, nameColumn: number): number =>
  Math.max(MATRIX_CELL_MIN, Math.min(MATRIX_CELL_MAX, Math.floor((bodyWidth - nameColumn - CELL_GAP_TOTAL) / 12)))

export type Row = { user: GetUsersResp; amounts: number[]; birthMonth: number | null }

export const rowsOf = (users: GetUsersResp[] | undefined, birth: GetUsersMonthBirthDuesResp[] | undefined): Row[] =>
  (users ?? []).map((user) => ({
    user,
    // 응답에 사용자 id 가 없어 이름으로 맞춘다(서버 응답이 바뀌어야 고칠 수 있다 — 지시서 R · 사용자 보고)
    amounts: birth?.find((d) => d.dues_user_name === user.user_name)?.month_birth_dues ?? Array<number>(12).fill(0),
    // 생일 달은 월-일 칸(MM-dd)에서 읽는다 — 직원 목록에는 생년이 오지 않는다(관리자 응답은 둘 다 온다)
    birthMonth: birthMonthOf(user),
  }))

const birthMonthOf = (user: GetUsersResp): number | null => {
  const monthDay = user.user_birth_month_day
  if (monthDay) return parseInt(monthDay.split('-')[0] ?? '', 10) || null
  return user.user_birth ? parseInt(user.user_birth.split('-')[1] ?? '', 10) || null : null
}
