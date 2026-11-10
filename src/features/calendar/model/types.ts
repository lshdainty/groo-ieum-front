export type TCalendarView = 'day' | 'week' | 'month' | 'year' | 'agenda';
export type TEventColor = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'pink' | 'gray' | 'teal';

export type TCalendarType = {
  id: string
  name: string
  nameKey: string
  type: 'vacation' | 'schedule'
  isDate: boolean
  color: TEventColor
}

/** 일정이 휴가 사용 기록인지 일정(스케줄)인지 — 서버 응답 `domain_type` 이 정한다. 둘의 id 는 서로 다른 표의 행 번호라 겹칠 수 있다 */
export type TEventKind = 'vacation' | 'schedule'

export type TBadgeVariant = 'dot' | 'colored' | 'mixed';
export type TWorkingHours = { [key: number]: { from: number; to: number } };
export type TVisibleHours = { from: number; to: number };

export const calendarTypes: TCalendarType[] = [
  {
    id: 'DAYOFF',
    name: '연차',
    nameKey: 'types.dayoff',
    type: 'vacation',
    isDate: true,
    color: 'purple'
  },
  {
    id: 'MORNINGOFF',
    name: '오전반차',
    nameKey: 'types.morningoff',
    type: 'vacation',
    isDate: false,
    color: 'blue'
  },
  {
    id: 'AFTERNOONOFF',
    name: '오후반차',
    nameKey: 'types.afternoonoff',
    type: 'vacation',
    isDate: false,
    color: 'pink'
  },
  {
    id: 'ONETIMEOFF',
    name: '1시간 휴가',
    nameKey: 'types.onetimeoff',
    type: 'vacation',
    isDate: false,
    color: 'yellow'
  },
  {
    id: 'TWOTIMEOFF',
    name: '2시간 휴가',
    nameKey: 'types.twotimeoff',
    type: 'vacation',
    isDate: false,
    color: 'yellow'
  },
  {
    id: 'THREETIMEOFF',
    name: '3시간 휴가',
    nameKey: 'types.threetimeoff',
    type: 'vacation',
    isDate: false,
    color: 'yellow'
  },
  {
    id: 'FIVETIMEOFF',
    name: '5시간 휴가',
    nameKey: 'types.fivetimeoff',
    type: 'vacation',
    isDate: false,
    color: 'yellow'
  },
  {
    id: 'SIXTIMEOFF',
    name: '6시간 휴가',
    nameKey: 'types.sixtimeoff',
    type: 'vacation',
    isDate: false,
    color: 'yellow'
  },
  {
    id: 'SEVENTIMEOFF',
    name: '7시간 휴가',
    nameKey: 'types.seventimeoff',
    type: 'vacation',
    isDate: false,
    color: 'yellow'
  },
  {
    id: 'HALFTIMEOFF',
    name: '30분 휴가',
    nameKey: 'types.halftimeoff',
    type: 'vacation',
    isDate: false,
    color: 'yellow'
  },
  {
    id: 'BUSINESSTRIP',
    name: '출장',
    nameKey: 'types.businesstrip',
    type: 'schedule',
    isDate: true,
    color: 'green'
  },
  {
    id: 'EDUCATION',
    name: '교육',
    nameKey: 'types.education',
    type: 'schedule',
    isDate: true,
    color: 'red'
  },
  {
    id: 'BIRTHDAY',
    name: '생일',
    nameKey: 'types.birthday',
    type: 'schedule',
    isDate: true,
    color: 'orange'
  },
  {
    id: 'BIRTHPARTY',
    name: '생일파티',
    nameKey: 'types.birthparty',
    type: 'schedule',
    isDate: true,
    color: 'orange'
  },
  {
    id: 'HEALTHCHECKHALF',
    name: '건강검진(반차)',
    nameKey: 'types.healthcheckhalf',
    type: 'vacation',
    isDate: false,
    color: 'gray'
  },
  {
    id: 'DEFENSE',
    name: '민방위',
    nameKey: 'types.defense',
    type: 'vacation',
    isDate: true,
    color: 'teal'
  },
  {
    id: 'DEFENSEHALF',
    name: '민방위(반차)',
    nameKey: 'types.defensehalf',
    type: 'vacation',
    isDate: false,
    color: 'teal'
  }
]

/** 종류 색 이름 → 차트 색 이름(v110 · 바탕 `chart-{색}-weak` · 글 `chart-{색}-contrast`). 차트 팔레트에 없는 purple · teal 은 가까운 색으로 읽는다 */
export const CHART_HUE: Record<TEventColor, string> = {
  blue: 'blue',
  green: 'green',
  red: 'red',
  yellow: 'yellow',
  purple: 'violet',
  orange: 'orange',
  pink: 'pink',
  gray: 'gray',
  teal: 'indigo',
}

/** 시각 종류가 쓰는 시간(분) — 끝 시각은 시작에서 셈한다(서버는 끝 시각을 그대로 받는다). 종일 종류 · 알 수 없는 종류는 없음 */
export const TIMED_MINUTES: Record<string, number> = {
  MORNINGOFF: 240,
  AFTERNOONOFF: 240,
  HEALTHCHECKHALF: 240,
  DEFENSEHALF: 240,
  HALFTIMEOFF: 30,
  ONETIMEOFF: 60,
  TWOTIMEOFF: 120,
  THREETIMEOFF: 180,
  FIVETIMEOFF: 300,
  SIXTIMEOFF: 360,
  SEVENTIMEOFF: 420,
}
