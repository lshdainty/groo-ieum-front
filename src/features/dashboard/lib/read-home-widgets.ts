import { DEFAULT_HOME_WIDGETS, WIDGET_IDS } from './widgets'

/*
 * 홈 배치 읽기(I-23 C 18) — 서버 `users.dashboard`(글)에 지금 저장돼 있는 값을 그대로 읽어 "어떤 위젯을 어떤 차례로 보일지" 를 정한다.
 * 쓰기는 바꾸지 않는다(23-1b 몫). 어떤 값이 와도 던지지 않고 기본 차례로 떨어진다.
 *
 *  ① 값 없음 · 빈 글 · 깨진 JSON · 객체가 아닌 값           → 기본
 *  ② `{"version":2,"widgets":[…]}`                          → widgets 차례 그대로
 *  ③ 옛 모양 `{layouts, activeWidgets}`                     → 켠 위젯을 layouts.lg 의 (y, x) 차례(위 → 아래, 왼 → 오른)로,
 *                                                              lg 에 없는 id 는 activeWidgets 차례로 뒤에. layouts 가 없으면 activeWidgets 차례
 *     activeWidgets 가 없는 옛 값(layouts 만)은 기본 위젯 여섯이 켜진 것으로 본다(옛 화면이 그렇게 읽었다)
 *  ④ 모르는 id · 겹친 id 는 버린다. 켠 위젯이 빈 목록이면 빈 목록(켠 위젯 0)
 */

interface LegacyLayoutItem {
  i: string
  x: number
  y: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** 알려진 id 만, 처음 나온 것만 남긴다 */
const cleanIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of value) {
    if (typeof id !== 'string' || seen.has(id) || !WIDGET_IDS.includes(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

const legacyLargeLayout = (layouts: unknown): LegacyLayoutItem[] => {
  if (!isRecord(layouts) || !Array.isArray(layouts.lg)) return []
  return layouts.lg.filter(
    (item): item is LegacyLayoutItem =>
      isRecord(item) && typeof item.i === 'string' && Number.isFinite(item.x) && Number.isFinite(item.y),
  )
}

/**
 * 저장값이 켜 둔 위젯 전부를 차례대로 — 이 사람이 볼 수 없는 위젯(권한 밖)도 남긴다. 저장할 때(23-1b) 권한 밖 id 를 지우지 않으려고
 * 걸러내기 전의 목록이 따로 필요하다. 화면은 readHomeWidgets 를 쓴다.
 */
export const parseHomeWidgetIds = (raw: string | null | undefined): string[] => {
  if (typeof raw !== 'string' || raw.trim() === '') return [...DEFAULT_HOME_WIDGETS]
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return [...DEFAULT_HOME_WIDGETS]
  }
  if (!isRecord(parsed)) return [...DEFAULT_HOME_WIDGETS]

  // ② 새 모양
  if (parsed.version === 2) {
    return Array.isArray(parsed.widgets) ? cleanIds(parsed.widgets) : [...DEFAULT_HOME_WIDGETS]
  }

  // ③ 옛 모양
  const hasActive = Array.isArray(parsed.activeWidgets)
  const hasLayouts = legacyLargeLayout(parsed.layouts).length > 0
  if (!hasActive && !hasLayouts) return [...DEFAULT_HOME_WIDGETS]
  const active = hasActive ? cleanIds(parsed.activeWidgets) : [...DEFAULT_HOME_WIDGETS]
  const placed = [...legacyLargeLayout(parsed.layouts)]
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((item) => item.i)
    .filter((id, index, all) => active.includes(id) && all.indexOf(id) === index)
  return [...placed, ...active.filter((id) => !placed.includes(id))]
}

/** 홈에 그릴 위젯 id 를 차례대로 — 저장값을 읽은 뒤 이 사람이 볼 수 있는 것(availableIds)만 남긴다 */
export const readHomeWidgets = (raw: string | null | undefined, availableIds: readonly string[]): string[] =>
  parseHomeWidgetIds(raw).filter((id) => availableIds.includes(id))
