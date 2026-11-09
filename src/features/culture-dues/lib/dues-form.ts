import dayjs from 'dayjs'

import { parseAmount } from '@/shared/lib/groo/amount'
import type { GetYearDuesResp, PostDuesReq } from '@/entities/dues'

/** 서버 칸 길이 — 이름 `Dues.java` dues_user_name 20 · 내용 dues_detail 1000 */
export const DUES_NAME_MAX = 20
export const DUES_DETAIL_MAX = 1000

export type DuesType = GetYearDuesResp['dues_type']
export type DuesCalc = GetYearDuesResp['dues_calc']
export const DUES_TYPES: readonly DuesType[] = ['OPERATION', 'BIRTH', 'FINE']

/** 분류 글 키(culture 이름공간) — 운영비 · 생일 · 벌금 */
export const DUES_TYPE_KEY = { OPERATION: 'dues.typeOperation', BIRTH: 'dues.typeBirth', FINE: 'dues.typeFine' } as const

/** 폼이 들고 있는 값 — 금액은 쉼표 없는 숫자 글, 날짜는 "YYYY-MM-DD"(비면 ""). 이름 · 내용은 비워도 된다 */
export interface DuesFormValues {
  calc: DuesCalc
  amount: string
  date: string
  type: DuesType
  name: string
  detail: string
}

/** 새 입출금 — 입금 · 운영비 · 오늘 */
export const emptyDuesForm = (today: string = dayjs().format('YYYY-MM-DD')): DuesFormValues => ({
  calc: 'PLUS',
  amount: '',
  date: today,
  type: 'OPERATION',
  name: '',
  detail: '',
})

/** 있는 줄의 값 — 수정 · 복사해서 추가가 같이 쓴다(복사는 날짜도 그 줄 그대로) */
export const duesFormOf = (row: GetYearDuesResp): DuesFormValues => ({
  calc: row.dues_calc,
  amount: String(Math.abs(Math.round(row.dues_amount))),
  date: dayjs(row.dues_date).format('YYYY-MM-DD'),
  type: row.dues_type,
  name: row.dues_user_name ?? '',
  detail: row.dues_detail ?? '',
})

export const duesFormChanged = (a: DuesFormValues, b: DuesFormValues): boolean =>
  a.calc !== b.calc || a.amount !== b.amount || a.date !== b.date || a.type !== b.type || a.name !== b.name || a.detail !== b.detail

/** 칸 오류 — 금액은 0 보다 커야 하고 날짜는 필수. 오류가 없으면 빈 객체 */
export const duesFormErrors = (v: DuesFormValues): { amount?: true; date?: true } => ({
  ...(parseAmount(v.amount) > 0 ? {} : { amount: true as const }),
  ...(v.date ? {} : { date: true as const }),
})

/** 서버 본문 — 키는 지금 그대로(`dues_*`), 금액은 숫자 */
export const duesPayloadOf = (v: DuesFormValues): PostDuesReq => ({
  dues_user_name: v.name.trim(),
  dues_amount: parseAmount(v.amount),
  dues_type: v.type,
  dues_calc: v.calc,
  dues_date: v.date,
  dues_detail: v.detail.trim(),
})
