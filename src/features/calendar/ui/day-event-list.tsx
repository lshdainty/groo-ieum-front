import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";
import { Flag } from "lucide-react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { List, ListButtonItem, ListItem } from "@/shared/ds/list";
import { eventLineDetail, isAllDayEvent, personName, typeName } from "@/features/calendar/lib/event-text";
import { eventTone } from "@/features/calendar/lib/helpers";
import { eventKey } from "@/features/calendar/model/use-calendar-screen";
import type { IEvent } from "@/features/calendar/model/interfaces";

/** "2/3일째 · " — 하루짜리 일정이거나 날을 안 주면 빈 글 */
const dayOfText = (e: IEvent, day: Date | undefined, t: TFunction): string => {
  if (!day) return "";
  const first = startOfDay(parseISO(e.startDate));
  const last = startOfDay(parseISO(e.endDate));
  const total = differenceInCalendarDays(last, first) + 1;
  if (total <= 1) return "";
  return `${t("dayOf", { n: differenceInCalendarDays(startOfDay(day), first) + 1, m: total })} · `;
};

/** 줄 설명 — 목록 보기의 이어지는 종일 일정은 기간을 다시 쓰지 않고 "{n}/{m}일째 · {종류}" */
const lineDetail = (e: IEvent, day: Date | undefined, t: TFunction): string => {
  const prefix = dayOfText(e, day, t);
  return prefix && isAllDayEvent(e) ? prefix + typeName(e, t) : prefix + eventLineDetail(e, t);
};

export interface DayHoliday {
  name: string;
}

/**
 * 그날 일정 줄 목록(G 33) — 그날 시트(폰) · 그날 패널(1280) · 그날 목록 카드(768 ~ 1279)가 같은 줄을 쓴다.
 * 앞 색 막대 3(종류 색 — 칩과 같은 `chart-{색}`) · 제목 사람 이름(줄바꿈) · 설명 "{종류} · {시각}"(종일 "종일").
 * 공휴일이 맨 위 보기만 하는 줄. 줄 사이 선 · 꺾쇠 없음. 일정 줄은 누르는 줄이다.
 */
export function DayEventList({
  events,
  holiday,
  label,
  day,
  onTapEvent,
  className,
}: {
  events: IEvent[];
  holiday?: DayHoliday | null;
  /** 목록 이름(보조 기술) — 보통 날짜 */
  label: string;
  /** 주면 이어지는 일정 줄에 "{n}/{m}일째" 를 앞에 붙인다(목록 보기) */
  day?: Date;
  onTapEvent: (event: IEvent, el: HTMLElement) => void;
  className?: string;
}) {
  const { t } = useTranslation("calendar");
  return (
    <List className={className} aria-label={label}>
      {holiday && (
        <ListItem
          data-slot="day-holiday"
          title={holiday.name}
          detail={t("holiday")}
          prefix={<Bar color="var(--color-chart-red)" icon={<Flag aria-hidden className="size-4" />} />}
        />
      )}
      {events.map((e) => (
        <ListButtonItem
          key={eventKey(e)}
          title={personName(e, t)}
          detail={lineDetail(e, day, t)}
          prefix={<Bar color={eventTone(e).color} />}
          data-event-key={eventKey(e)}
          onClick={(ev) => onTapEvent(e, ev.currentTarget)}
        />
      ))}
    </List>
  );
}

/** 앞 색 막대 — 너비 3 · 줄 높이를 채운다(칩 색과 같은 `chart-{색}`). 공휴일 줄만 아이콘을 함께 둔다 */
function Bar({ color, icon }: { color: string; icon?: React.ReactNode }) {
  return (
    <span aria-hidden data-slot="event-bar" className="flex items-center gap-x2">
      <span className="block h-x8 w-[3px] shrink-0 rounded-full" style={{ background: color }} />
      {icon && <span style={{ color }}>{icon}</span>}
    </span>
  );
}
