import { getDay, isSameDay, isToday } from "date-fns";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import { cn } from "@/shared/lib/cn";
import { formatDayText } from "@/shared/lib/date-text";
import { calculateMonthEventPositions, getCalendarCells } from "@/features/calendar/lib/helpers";
import { useCalendar } from "@/features/calendar/model/calendar-context";
import { DragSelectProvider, useDragSelect } from "@/features/calendar/model/drag-select-context";
import { useCanAddEvent, useCanEditEvent } from "@/features/calendar/model/use-can-edit-event";
import { DraggableEvent } from "@/features/calendar/ui/dnd/draggable-event";
import { DroppableDayCell } from "@/features/calendar/ui/dnd/droppable-day-cell";

import type { IEvent } from "@/features/calendar/model/interfaces";
import { MonthChip, MonthChipSpacer, MonthMore } from "./month-chip";
import { buildMonthModel, type ChipMetrics } from "./month-model";
import { dayTone } from "./day-tone";
import { useChipMetrics } from "./use-chip-metrics";

/** 한 칸에 놓을 수 있는 줄 수의 상한 — 접는 것은 칩 자리 높이가 정한다(줄이 넘치면 "+N개") */
const MAX_ROWS = 100;

const WEEK_DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_DAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

/** 칸 104 − 위 4 − 날 숫자 26 − 아래 2 − 줄 사이 2 = 70, 칩 20 · "+N개" 18 · 사이 2 (글자 100% 의 값 — 실제로는 잰다) */
const DESKTOP_METRICS: ChipMetrics = { avail: 70, chip: 20, more: 18, gap: 2 };

/** 요일 머리 — 높이 36 · t3 13/18 · fg-neutral-subtle · 아래 1px 선. 일 fg-critical · 토 fg-informative */
export function WeekdayHead() {
  const { i18n } = useTranslation();
  const weekDays = i18n.language.startsWith("ko") ? WEEK_DAYS_KO : WEEK_DAYS_EN;
  return (
    <div
      aria-hidden
      className="grid h-x9 grid-cols-7 items-center border-b border-stroke-neutral-subtle text-center text-t3 text-fg-neutral-subtle"
    >
      {weekDays.map((day, index) => (
        <span
          key={day}
          className={cn(index === 0 && "text-fg-critical", index === 6 && "text-fg-informative")}
        >
          {day}
        </span>
      ))}
    </div>
  );
}

/** 칸 높이 104 하나 — 폭으로 갈리지 않는다. 화면 높이로 채우지 않는다 */
const CELL_HEIGHT = "h-[104px]";

interface IProps {
  singleDayEvents: IEvent[];
  multiDayEvents: IEvent[];
  /** 칩을 누르면 그 날을 고르고 그 일정 상세 — `day` 는 칩이 놓인 칸의 날 */
  onEventClick: (event: IEvent, day: Date) => void;
  /** 고른 날을 다시 누름 · 두 날 이상 끌어 놓음 → 그 날(기간)로 일정 폼 */
  onCreate: (start: Date, end?: Date) => void;
}

function MonthGrid({ singleDayEvents, multiDayEvents, onEventClick, onCreate }: IProps) {
  const { t } = useTranslation("calendar");
  const { selectedDate, setSelectedDate, findHolidayByDate } = useCalendar();
  const { startSelection, updateSelection, endSelection, isDateInSelection } = useDragSelect();
  const canCreate = useCanAddEvent();
  const canEdit = useCanEditEvent();
  const { metrics, stackRef, chipRef, moreRef } = useChipMetrics(DESKTOP_METRICS);

  const all = [...multiDayEvents, ...singleDayEvents];
  const cells = getCalendarCells(selectedDate);
  const positions = calculateMonthEventPositions([...multiDayEvents], [...singleDayEvents], selectedDate, MAX_ROWS);
  const model = buildMonthModel(cells, all, positions, metrics);

  const handleMouseDown = (e: React.MouseEvent, date: Date) => {
    if (e.button !== 0) return;
    // 숫자 단추 · 칩 위에서는 끌기를 시작하지 않는다
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest('[role="button"]')) return;
    startSelection(date);
  };

  return (
    <div data-slot="calendar-month-body" onMouseUp={endSelection} onMouseLeave={endSelection}>
      <WeekdayHead />
      <div role="group" aria-label={dayjs(selectedDate).format("YYYY-MM")} className="relative grid grid-cols-7">
        {/* 칩 · "+N개" 한 줄의 실제 높이를 재는 보이지 않는 견본 */}
        <div aria-hidden className="pointer-events-none invisible absolute left-0 top-0 w-full">
          <div ref={chipRef} className="block min-h-x5 px-x1_5 py-x0_5 text-t2 font-medium">
            &nbsp;
          </div>
          <div ref={moreRef} className="pt-x0_5 text-t2 font-bold">
            &nbsp;
          </div>
        </div>
        {model.map(({ cell, slots, hidden, total }, index) => {
          const { date, day, currentMonth } = cell;
          const sunday = getDay(date) === 0;
          const saturday = getDay(date) === 6;
          const holidayInfo = findHolidayByDate(dayjs(date).format("YYYY-MM-DD"));
          const today = isToday(date);
          const selected = isSameDay(date, selectedDate);
          const dragging = isDateInSelection(date);
          const dateLabel = formatDayText(date);
          const lastRow = index >= model.length - 7;
          return (
            <DroppableDayCell key={date.toISOString()} cell={cell} className="min-w-0">
              <div
                data-slot="month-cell"
                data-selected={selected ? "" : undefined}
                onMouseDown={(e) => handleMouseDown(e, date)}
                onMouseEnter={() => updateSelection(date)}
                className={cn(
                  "relative flex min-w-0 select-none flex-col pt-x1",
                  CELL_HEIGHT,
                  !lastRow && "border-b border-stroke-neutral-subtle",
                  index % 7 !== 6 && "border-r border-stroke-neutral-subtle",
                  (selected || dragging) && "bg-bg-brand-weak",
                )}
              >
                <div className="mb-x0_5 ml-x1_5 mr-x1 flex min-w-0 items-center gap-x1">
                  <button
                    type="button"
                    aria-pressed={selected}
                    aria-current={today ? "date" : undefined}
                    aria-label={
                      total > 0
                        ? t("monthView.cellLabel", { date: dateLabel, count: total })
                        : t("monthView.cellLabelEmpty", { date: dateLabel })
                    }
                    // 고른 날을 한 번 더 누르면 그 날로 일정 폼, 아니면 그 날 고르기
                    onClick={() => (selected ? canCreate && onCreate(date) : setSelectedDate(date))}
                    data-slot="month-day-number"
                    className={cn(
                      // 원 26(글자 13/18 + 8) — 글자가 커지면 원도 따라 커진다
                      "grid size-[calc(var(--text-t3--line-height)+8px)] shrink-0 place-items-center rounded-full text-t3 font-medium tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus-ring",
                      selected
                        ? "bg-bg-neutral-inverted font-bold text-fg-neutral-inverted"
                        : cn(dayTone({ currentMonth, sunday, saturday, holiday: holidayInfo }), today && "bg-bg-neutral-weak font-bold"),
                    )}
                  >
                    {day}
                  </button>
                  {holidayInfo && (
                    <span
                      data-slot="month-holiday"
                      className={cn("min-w-0 truncate text-t1 font-medium", dayTone({ currentMonth, sunday, saturday, holiday: holidayInfo }))}
                    >
                      {holidayInfo.holiday_name}
                    </span>
                  )}
                </div>
                <div ref={index === 0 ? stackRef : undefined} className="mx-x1 flex min-h-0 flex-1 flex-col gap-x0_5">
                  {slots.map((slot, i) =>
                    slot ? (
                      <DraggableEvent key={i} event={slot.event} disabled={!canEdit(slot.event)}>
                        <MonthChip slot={slot} density="wide" onClick={(ev) => onEventClick(ev, date)} />
                      </DraggableEvent>
                    ) : (
                      <MonthChipSpacer key={i} density="wide" />
                    ),
                  )}
                  {hidden > 0 && <MonthMore count={hidden} density="wide" />}
                </div>
              </div>
            </DroppableDayCell>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 768 이상 월 격자(G 34) — 화면 틀의 ds Card(모서리 16 · 1px · 안 여백 0) 안, 도구 줄 아래 요일 머리 36 + 칸 104.
 * 칸 = 오른쪽 · 아래 1px 선. 날 숫자 원 26 왼쪽 맞춤, 칩 20 · 말줄임 · 시각 없음, "+N개" 는 칩 자리 마지막 줄.
 * 고른 날 = 칸 `bg-brand-weak` + 짙은 원. 누름 = 날 고르기, 고른 날 다시 누름 · 두 날 이상 끌어 놓음 = 그 날(기간)로 일정 폼.
 */
export function CalendarMonthViewDesktop(props: IProps) {
  const { selectedDate, setSelectedDate } = useCalendar();
  const canCreate = useCanAddEvent();
  return (
    <DragSelectProvider selectedDate={selectedDate} canCreate={canCreate} onSelectDay={setSelectedDate} onCreate={props.onCreate}>
      <MonthGrid {...props} />
    </DragSelectProvider>
  );
}
