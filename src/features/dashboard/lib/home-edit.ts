import { DEFAULT_HOME_WIDGETS, WIDGET_IDS } from './widgets'

/*
 * 홈 편집(I-23 C 15 ~ 18)의 순수 부분 — 저장 모양 만들기 · 순서 바꾸기 · 켜고 끄기.
 * 저장 모양: {"version":2,"widgets":[…]} — 켠 위젯을 차례대로, 숨김 = 목록에 없는 것. 다른 키를 두지 않는다.
 * 옛 모양({layouts, activeWidgets})은 readHomeWidgets 가 읽기만 하고, 다음 [저장] 때 이 모양으로 바뀐다.
 */

export interface HomeLayoutV2 {
  version: 2
  widgets: string[]
}

/**
 * 저장할 글 — 편집한 보이는 차례 + 이 사람이 볼 수 없는 위젯(권한 밖) id 를 원래 차례대로 끝에 붙인다(역할이 돌아오면 다시 보인다).
 * stored 는 저장값이 켜 둔 전부(parseHomeWidgetIds — 권한 밖 포함).
 */
export const serializeHomeWidgets = (visible: readonly string[], stored: readonly string[], availableIds: readonly string[]): string => {
  const outside = stored.filter((id) => !availableIds.includes(id) && !visible.includes(id))
  const body: HomeLayoutV2 = { version: 2, widgets: [...visible, ...outside] }
  return JSON.stringify(body)
}

/** 한 칸 옮기기 — 범위를 벗어나면 그대로 */
export const moveWidget = (order: readonly string[], id: string, delta: -1 | 1): string[] => {
  const from = order.indexOf(id)
  const to = from + delta
  if (from < 0 || to < 0 || to >= order.length) return [...order]
  const next = [...order]
  next.splice(from, 1)
  next.splice(to, 0, id)
  return next
}

/** 원하는 자리로 옮기기(끌기) */
export const moveWidgetTo = (order: readonly string[], id: string, to: number): string[] => {
  const from = order.indexOf(id)
  if (from < 0) return [...order]
  const next = [...order]
  next.splice(from, 1)
  next.splice(Math.max(0, Math.min(to, next.length)), 0, id)
  return next
}

/** 켜면 보이는 목록 끝으로, 끄면 숨긴 목록으로 */
export const toggleWidget = (order: readonly string[], id: string, on: boolean): string[] =>
  on ? (order.includes(id) ? [...order] : [...order, id]) : order.filter((x) => x !== id)

/** [처음 모양으로] — 기본 여섯 중 이 사람이 볼 수 있는 것 */
export const defaultVisible = (availableIds: readonly string[]): string[] => DEFAULT_HOME_WIDGETS.filter((id) => availableIds.includes(id))

export const sameOrder = (a: readonly string[], b: readonly string[]): boolean => a.length === b.length && a.every((id, i) => id === b[i])

/** 숨긴 위젯 — 볼 수 있는데 켜지 않은 것, 편집 목록 기준 차례 */
export const hiddenOf = (visible: readonly string[], availableIds: readonly string[]): string[] =>
  WIDGET_IDS.filter((id) => availableIds.includes(id) && !visible.includes(id))
