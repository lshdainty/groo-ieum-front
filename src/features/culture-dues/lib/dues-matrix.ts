/** 칸 폭 = (본문 폭 − 이름 열 − 칸 사이 44) ÷ 12, 18 ~ 60(E 43). 넘치지 않게 본문 폭에 맞춰 줄어든다 */
export const MATRIX_CELL_MIN = 18
export const MATRIX_CELL_MAX = 60
const CELL_GAP_TOTAL = 44

/** 달 글자를 "{m}월" 로 쓸 수 있는 최소 칸 폭 — 이보다 좁으면 숫자만, 이름 열 머리가 "월" */
export const MONTH_LABEL_MIN = 30

export const matrixCellWidth = (bodyWidth: number, nameColumn: number): number =>
  Math.max(MATRIX_CELL_MIN, Math.min(MATRIX_CELL_MAX, Math.floor((bodyWidth - nameColumn - CELL_GAP_TOTAL) / 12)))
