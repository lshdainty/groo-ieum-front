import { getDay, isToday } from "date-fns";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import { useCalendar } from "@/features/calendar/model/calendar-context";
import {
  calculateMonthEventPositions,
  getCalendarCells,
} from "@/features/calendar/lib/helpers";
import { formatDayText } from "@/shared/lib/date-text";
import { cn } from "@/shared/lib/cn";

import type { IEvent } from "@/features/calendar/model/interfaces";
import { MonthChip, MonthChipSpacer, MonthMore } from "./month-chip";
import { buildMonthModel, type ChipMetrics } from "./month-model";
import { dayTone } from "./day-tone";
import { useChipMetrics } from "./use-chip-metrics";

/** 한 칸에 놓을 수 있는 줄 수의 상한 — 접는 것은 칩 자리 높이가 정한다(줄이 넘치면 "+N개") */
const MAX_ROWS = 100;

const WEEK_DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_DAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

/** 칸 103 − 위 2 − 날 숫자 26 − 아래 2 = 73, 칩 18 · "+N개" 16 · 사이 2 (글자 100% 의 값 — 실제로는 잰다) */
const PHONE_METRICS: ChipMetrics = { avail: 73, chip: 18, more: 16, gap: 2 };

/** 요일 줄 — 높이 32 · t3 13/18 · fg-neutral-subtle, 일 fg-critical · 토 fg-brand (I-09 8) */
export function WeekdayRow() {
  const { i18n } = useTranslation();
  const weekDays = i18n.language.startsWith("ko") ? WEEK_DAYS_KO : WEEK_DAYS_EN;
  return (
    <div
      aria-hidden
      className="grid h-x8 shrink-0 grid-cols-7 items-center px-[2px] text-center text-t3 text-fg-neutral-subtle"
    >
      {weekDays.map((day, index) => (
        <span
          key={day}
          className={cn(
            index === 0 && "text-fg-critical",
            index === 6 && "text-fg-informative",
          )}
        >
          {day}
        </span>
      ))}
    </div>
  );
}

interface IProps {
  singleDayEvents: IEvent[];
  multiDayEvents: IEvent[];
  /** 칸을 누르면 그날 시트 */
  onDayClick: (date: Date) => void;
}

/**
 * 폰 월 격자 (I-09 8 · 9 · 10) — 요일 줄 + 칸 높이 103 고정(화면이 길면 화면이 스크롤), 칸 위 1px 선, 세로 선 없음.
 * 칸 전체가 그날 시트를 여는 누르는 자리 하나다 — 날 숫자 · 칩 · "+N개" 가 따로 Tab 에 서지 않는다.
 * 오늘은 옅은 원(`bg-neutral-weak`) + 700.
 */
export function CalendarMonthViewPhone({
  singleDayEvents,
  multiDayEvents,
  onDayClick,
}: IProps) {
  const { t } = useTranslation("calendar");
  const { selectedDate, findHolidayByDate } = useCalendar();
  const { metrics, stackRef, chipRef, moreRef } = useChipMetrics(PHONE_METRICS);

  const all = [...multiDayEvents, ...singleDayEvents];

  const cells = getCalendarCells(selectedDate);
  const positions = calculateMonthEventPositions(
    [...multiDayEvents],
    [...singleDayEvents],
    selectedDate,
    MAX_ROWS,
  );
  const model = buildMonthModel(cells, all, positions, metrics);

  return (
    <div data-slot="calendar-month-grid" className="flex flex-col">
      <div
        role="group"
        aria-label={dayjs(selectedDate).format("YYYY-MM")}
        className="relative grid grid-cols-7 px-[2px]"
      >
        {/* 칩 · "+N개" 한 줄의 실제 높이를 재는 보이지 않는 견본 */}
        <div
          aria-hidden
          className="pointer-events-none invisible absolute left-0 top-0 w-full"
        >
          <div
            ref={chipRef}
            className="block min-h-x4_5 px-[3px] py-px text-t2 font-medium"
          >
            &nbsp;
          </div>
          <div ref={moreRef} className="text-t2 font-bold">
            &nbsp;
          </div>
        </div>
        {model.map(({ cell, slots, hidden, total }, index) => {
          const { date, day, currentMonth } = cell;
          const sunday = getDay(date) === 0;
          const saturday = getDay(date) === 6;
          const holidayInfo = findHolidayByDate(dayjs(date).format("YYYY-MM-DD"));
          const today = isToday(date);
          const dateLabel = formatDayText(date);
          return (
            <button
              key={date.toISOString()}
              type="button"
              aria-haspopup="dialog"
              aria-label={
                total > 0
                  ? t("monthView.cellLabel", { date: dateLabel, count: total })
                  : t("monthView.cellLabelEmpty", { date: dateLabel })
              }
              data-today={today ? "" : undefined}
              data-neighbor={currentMonth ? undefined : ""}
              onClick={() => onDayClick(date)}
              // 칸 높이 103 고정(I-09 9) · 위 1px 선 · 칩은 칸 폭을 꽉 채운다(좌우 1)
              className="relative flex h-[103px] min-w-0 select-none flex-col gap-x0_5 px-px pt-x0_5 text-start shadow-[inset_0_1px_0_0_var(--color-stroke-neutral-subtle)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stroke-focus-ring"
            >
              <span className="flex min-w-0 items-center justify-center gap-x0_5">
                <span
                  aria-hidden
                  data-slot="month-day-number"
                  className={cn(
                    // 원 26(글자 14/19 + 7) — 글자가 커지면 원도 따라 커진다
                    "grid size-[calc(var(--text-t4--line-height)+7px)] shrink-0 place-items-center rounded-full text-t4 font-medium tabular-nums",
                    dayTone({ currentMonth, sunday, saturday, holiday: holidayInfo }),
                    today && "bg-bg-neutral-weak font-bold",
                  )}
                >
                  {day}
                </span>
                {holidayInfo && (
                  <span
                    data-slot="month-holiday"
                    className={cn(
                      "min-w-0 truncate text-t1 font-medium",
                      dayTone({ currentMonth, sunday, saturday, holiday: holidayInfo }),
                    )}
                  >
                    {holidayInfo.holiday_name}
                  </span>
                )}
              </span>
              <div
                ref={index === 0 ? stackRef : undefined}
                className="flex min-h-0 flex-1 flex-col gap-x0_5"
              >
                {slots.map((slot, i) =>
                  slot ? (
                    <MonthChip key={i} slot={slot} density="phone" />
                  ) : (
                    <MonthChipSpacer key={i} density="phone" />
                  ),
                )}
                {hidden > 0 && <MonthMore count={hidden} density="phone" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
