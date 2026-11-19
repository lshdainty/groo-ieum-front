#!/usr/bin/env node
/**
 * 차트 축 · 점을 크로미움에서 확인한다 — groo-damda-front #625(한 축은 한 단위 · 눈금 간격 1 · 2 · 5 · 가로 눈금 글자 사이 최소 8 ·
 * 연도는 보이는 눈금에)와 58ea54c5(늘 찍는 점 dots)의 담다 시험(vitest — chart.test · axisWidth.test) 판정을 이 레포에 맞게 옮긴
 * 것이다. 눈금 글은 글자 크기 설정을 따르지 않는다(11px · 줄 15 — groo-design #260, 담다 #650 · #651). 이음 화면은 월별 쓴 휴가(MonthVacationStatsContent)를 실제 폭 · 글자 크기로 그려 잰다.
 *
 * 이 레포에는 단위 테스트 러너가 없어 check-narrow 처럼 개발 서버와 Playwright 로 돈다. 셈 함수는 무대
 * scripts/check-chart/harness.tsx 가 window.__chart 에 건다(개발 서버만 그린다 — 운영 빌드에 들어가지 않는다).
 * 담다 시험은 jsdom 이라 글 폭을 글자 수로 어림하지만, 여기서는 실제 글 폭으로 재므로 솎인 눈금 목록 대신 "겹치지 않음 ·
 * 끝 눈금이 남음 · 보이는 눈금에 연도" 를 본다.
 *
 * 사용: node scripts/check-chart.mjs [이름 일부 — 그 시험만]
 * Playwright 의 Chromium 이 필요하다 — 처음 한 번 `npx playwright install chromium`.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createServer } from "vite";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HARNESS = "/scripts/check-chart/harness.html";
const MINUS = "−";

const server = await createServer({ root: ROOT, logLevel: "error", server: { port: 0 } });
await server.listen();
const base = server.resolvedUrls.local[0].replace(/\/$/, "");
const browser = await chromium.launch();

async function open(scene, { width = 390, query = "", timezoneId, now } = {}) {
  const ctx = await browser.newContext({ locale: "ko-KR", viewport: { width, height: 800 }, ...(timezoneId ? { timezoneId } : {}) });
  const page = await ctx.newPage();
  // 브라우저 시계를 정한 때로 — 회사 날짜와 브라우저 날짜가 다른 경우(해 넘김)
  if (now) await page.clock.setFixedTime(now);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}${HARNESS}?scene=${scene}${query}`);
  await page.locator("#root > *").first().waitFor({ timeout: 15000 });
  await page.waitForTimeout(200);
  return { ctx, page, errors };
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const expectEq = (p, what, got, want) => {
  if (!same(got, want)) p.push(`${what}: ${JSON.stringify(got)} ≠ ${JSON.stringify(want)}`);
};

/** 셈 함수 판정 — 무대(lib)를 열고 window.__chart 로 부른 결과를 돌려받아 견준다 */
const libCase = (name, fn, check) => ({
  name,
  async run() {
    const { ctx, page, errors } = await open("lib");
    let got;
    try {
      got = await page.evaluate(fn);
    } finally {
      await ctx.close();
    }
    const p = [...errors];
    check(got, p);
    return p;
  },
});

// 눈금 글을 값으로 되돌린다 — 억 · 만 · 쉼표 정수
const back = (l) =>
  l.replace(MINUS, "-").endsWith("억")
    ? Number(l.replace(MINUS, "-").slice(0, -1)) * 100_000_000
    : l.endsWith("만")
      ? Number(l.replace(MINUS, "-").slice(0, -1).replace(/,/g, "")) * 10_000
      : Number(l.replace(MINUS, "-").replace(/,/g, ""));

// 1 · 2 · 5 × 10ⁿ 인가
const is125 = (step) => {
  if (!(step > 0)) return false;
  const pow = Math.pow(10, Math.floor(Math.log10(step) + 1e-9));
  return [1, 2, 5].some((m) => Math.abs(step / pow - m) < 1e-9);
};

/** 가로 · 세로 눈금 글의 자리(보이는 것만) */
const ticksOf = (page) =>
  page.evaluate(() => {
    const read = (sel) =>
      [...document.querySelectorAll(`${sel} .recharts-cartesian-axis-tick-value`)]
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { text: el.textContent, left: r.left, right: r.right, top: r.top, bottom: r.bottom, center: (r.left + r.right) / 2, fontSize: getComputedStyle(el).fontSize };
        })
        .filter((t) => t.text);
    const box = document.querySelector("[data-slot=chart]")?.getBoundingClientRect();
    return {
      x: read(".recharts-xAxis-tick-labels"),
      y: read(".recharts-yAxis-tick-labels"),
      box: box ? { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width } : null,
    };
  });

// 글이 차트 상자 밖으로 나간 만큼(가로 · 세로축 글 모두) — 0 이면 잘리지 않는다
const clipOf = (ticks, box) => {
  const p = [];
  for (const t of [...ticks.x, ...ticks.y]) {
    if (t.left < box.left - 0.5) p.push(`"${t.text}" 왼쪽 ${(box.left - t.left).toFixed(1)} 잘림`);
    if (t.right > box.right + 0.5) p.push(`"${t.text}" 오른쪽 ${(t.right - box.right).toFixed(1)} 잘림`);
  }
  return [...new Set(p)];
};

// 가로 눈금 글끼리 사이 — 가장 좁은 것
const minGap = (xs) => {
  const sorted = [...xs].sort((a, b) => a.left - b.left);
  let gap = Infinity;
  for (let i = 1; i < sorted.length; i++) gap = Math.min(gap, sorted[i].left - sorted[i - 1].right);
  return gap;
};

const cases = [
  // ── 한 축은 한 단위(담다 chart.test formatAxisWon) ──
  libCase(
    "formatAxisWon — 한 축은 한 단위(억 · 만 · 쉼표 정수), 소수 한 자리, 빼기 U+2212",
    () => {
      const { formatAxisWon: f } = window.__chart;
      const axis = (ticks) => ticks.map((v) => f(v, ticks));
      return {
        man: axis([0, 5000, 10000, 15000]),
        man2: axis([0, 10000, 20000, 30000]),
        won: axis([0, 2500, 5000, 7500]),
        neg: axis([-10000, -5000, 0, 5000]),
        eok: axis([0, 50_000_000, 100_000_000, 150_000_000]),
        eok2: axis([0, 20_000_000, 40_000_000, 60_000_000, 80_000_000, 100_000_000]),
        manBig: axis([-30_000_000, 0, 10_000_000]),
        jo: axis([0, 500_000_000_000, 1_000_000_000_000]),
        one: [f(12000, [0, 12000]), f(123456789, [0, 123456789]), f(4000000, [0, 4000000]), f(Number.NaN, [0, 10000]), f(-500, [-500, 0])],
      };
    },
    (g, p) => {
      expectEq(p, "1.5만", g.man, ["0", "0.5만", "1만", "1.5만"]);
      expectEq(p, "3만", g.man2, ["0", "1만", "2만", "3만"]);
      expectEq(p, "7,500", g.won, ["0", "2,500", "5,000", "7,500"]);
      expectEq(p, "음수 쪽", g.neg, [`${MINUS}1만`, `${MINUS}0.5만`, "0", "0.5만"]);
      expectEq(p, "1.5억", g.eok, ["0", "0.5억", "1억", "1.5억"]);
      expectEq(p, "1억", g.eok2, ["0", "0.2억", "0.4억", "0.6억", "0.8억", "1억"]);
      expectEq(p, "3,000만", g.manBig, [`${MINUS}3,000만`, "0", "1,000만"]);
      expectEq(p, "조", g.jo, ["0", "0.5조", "1조"]);
      expectEq(p, "한 값", g.one, ["1.2만", "1.2억", "400만", "", `${MINUS}500`]);
    },
  ),

  // ── 눈금 = 폭을 잰 눈금 · 1 · 2 · 5 간격(담다 axisWidth.test) ──
  libCase(
    "niceValueAxis — 간격 1 · 2 · 5 × 10ⁿ, 글자가 눈금값 그대로 · 한 단위, 폭은 그리는 글자로 잰다",
    () => {
      const { niceValueAxis, formatAxisWon, measureTickWidth } = window.__chart;
      const drawn = (values) => {
        const a = niceValueAxis(values, formatAxisWon);
        return a.ticks.map(a.tickFormatter);
      };
      const each = [7_500, 8_000, 10_000, 15_000, 22_500, 30_000, 150_000_000].map((max) => {
        const a = niceValueAxis([0, max], formatAxisWon);
        const labels = a.ticks.map(a.tickFormatter);
        return { max, ticks: a.ticks, labels, top: a.domain[1], width: a.width, measured: measureTickWidth(labels) };
      });
      const seen = [];
      const probe = niceValueAxis([0, 28_000], (v, ticks) => {
        seen.push(ticks);
        return String(v);
      });
      probe.tickFormatter(10_000);
      const empty = niceValueAxis([], String);
      return {
        each,
        home: drawn([28_000, 12_000, 0]),
        tenK: drawn([0, 10_000]),
        eightK: drawn([0, 8_000]),
        eok: drawn([0, 150_000_000]),
        mixed: drawn([50_000_000, 80_000_000, 100_000_000]),
        neg: drawn([-25_000, 60_000]),
        negBig: drawn([-30_000_000, 10_000_000]),
        zero: drawn([0, 0]),
        none: drawn([]),
        ticksPassed: seen.length > 0 && seen.every((t) => JSON.stringify(t) === JSON.stringify(probe.ticks)),
        emptyDomain: empty.domain,
      };
    },
    (g, p) => {
      for (const e of g.each) {
        e.ticks.forEach((v, i) => {
          if (back(e.labels[i]) !== v) p.push(`최대 ${e.max}: 눈금 ${v} 의 글 "${e.labels[i]}"`);
        });
        const units = new Set(e.labels.filter((l) => l !== "0").map((l) => l.replace(/[^억만]/g, "")));
        if (units.size !== 1) p.push(`최대 ${e.max}: 단위가 섞였다 ${e.labels.join(" · ")}`);
        if (!is125(e.ticks[1] - e.ticks[0])) p.push(`최대 ${e.max}: 간격 ${e.ticks[1] - e.ticks[0]}`);
        if (e.top < e.max) p.push(`최대 ${e.max}: 끝 ${e.top}`);
        if (e.width !== e.measured) p.push(`최대 ${e.max}: 폭 ${e.width} ≠ 잰 폭 ${e.measured}`);
      }
      expectEq(p, "홈 2.8만", g.home, ["0", "1만", "2만", "3만"]);
      expectEq(p, "0 ~ 1만", g.tenK, ["0", "0.2만", "0.4만", "0.6만", "0.8만", "1만"]);
      expectEq(p, "0 ~ 8,000", g.eightK, ["0", "2,000", "4,000", "6,000", "8,000"]);
      expectEq(p, "1.5억", g.eok, ["0", "0.5억", "1억", "1.5억"]);
      expectEq(p, "5,000만 ~ 1억", g.mixed, ["0", "0.2억", "0.4억", "0.6억", "0.8억", "1억"]);
      expectEq(p, "음수", g.neg, [`${MINUS}4만`, `${MINUS}2만`, "0", "2만", "4만", "6만"]);
      expectEq(p, "음수 만", g.negBig, [`${MINUS}3,000만`, `${MINUS}2,000만`, `${MINUS}1,000만`, "0", "1,000만"]);
      expectEq(p, "모두 0", g.zero, g.tenK);
      expectEq(p, "값 없음", g.none, g.tenK);
      if (!g.ticksPassed) p.push("글자 함수가 눈금 목록을 받지 않는다");
      expectEq(p, "값 없음 범위", g.emptyDomain, [0, 10_000]);
    },
  ),

  // ── 가로 눈금 솎기 · 연도(담다 chart.test "가로 눈금 — 솎기 · 보이는 눈금의 연도") · 축 기본값 ──
  libCase(
    "가로 눈금 셈 — 간격 = ⌈칸 ÷ ⌊폭 ÷ (글 + 8)⌋⌉, 끝 눈금을 지키고, 연도는 보이는 눈금에 · 축 글자 사이 8 · 글자 11px(글자 크기 설정을 따르지 않는다)",
    () => {
      const { chartXTickInterval: iv, chartXTickLabels: lb, chartXTickFullLabels: full, chartAxisProps, months } = window.__chart;
      return {
        interval: [iv(12, 400, 24), iv(12, 300, 24), iv(12, 120, 24), iv(12, 12 * 29, 24), iv(12, 0, 24)],
        full: full(months(2025, 12, 12)).slice(0, 3),
        allSame: JSON.stringify(lb(months(2025, 12, 12), 1)) === JSON.stringify(full(months(2025, 12, 12))),
        skip2: lb(months(2025, 11, 12), 2),
        first: lb(months(2025, 12, 12), 2).filter((l) => l != null),
        six: lb(months(2024, 12, 13), 6).filter((l) => l != null),
        noYear: lb(["1주", "2주", "3주"].map((label) => ({ label })), 1),
        gap: [chartAxisProps().minTickGap, chartAxisProps({ color: "red" }).minTickGap],
        font: chartAxisProps().tick.fontSize,
      };
    },
    (g, p) => {
      expectEq(p, "간격", g.interval, [1, 2, 4, 2, 12]);
      expectEq(p, "모두 보일 때", g.full, ["12월", "2026. 1.", "2월"]);
      if (!g.allSame) p.push("간격 1 인데 보이는 글이 모두 보일 때 글과 다르다");
      expectEq(p, "두 칸마다", g.skip2, [null, "12월", null, "2026. 2.", null, "4월", null, "6월", null, "8월", null, "10월"]);
      expectEq(p, "첫 보이는 눈금", g.first, ["2026. 1.", "3월", "5월", "7월", "9월", "11월"]);
      expectEq(p, "여섯 칸마다", g.six, ["12월", "2025. 6.", "12월"]);
      expectEq(p, "해 없는 눈금", g.noYear, ["1주", "2주", "3주"]);
      expectEq(p, "글자 사이", g.gap, [8, 8]);
      expectEq(p, "눈금 글자 크기", g.font, "11px");
    },
  ),

  // ── 늘 찍는 점(담다 chart.test "늘 찍는 점(dots)") ──
  libCase(
    "dots 기본값 — 켜면 Area · Line 이 계열 선 색 원(r 3 · 테두리 없음), 기본은 점 없음, 쓰는 쪽 dot 이 이긴다, 가리킨 점 그대로",
    () => ({ ...window.__chart.seriesDots(), SERIES_DOT: window.__chart.SERIES_DOT ?? null }),
    (g, p) => {
      expectEq(p, "SERIES_DOT", g.SERIES_DOT, { r: 3, strokeWidth: 0 });
      expectEq(p, "켬", g.on.map((s) => s.dot), [
        { r: 3, strokeWidth: 0, fill: "var(--color-chart-blue)" },
        { r: 3, strokeWidth: 0, fill: "var(--color-chart-red)" },
        false,
      ]);
      expectEq(p, "끔", g.off.map((s) => s.dot), [false, false, false]);
      if (!g.on.every((s) => s.activeDotSame)) p.push("가리킨 점이 바뀌었다");
    },
  ),
  ...[
    { dots: true, want: 7 },
    { dots: false, want: 0 },
  ].map(({ dots, want }) => ({
    name: `dots ${dots ? "켬" : "끔(기본)"} — ${dots ? "값마다 계열 색 점 r 3 을 그리고 숨김 규칙이 없다" : "숨김 규칙을 달고 점을 그리지 않는다"}`,
    async run() {
      const { ctx, page, errors } = await open("dots", { query: dots ? "&dots=1" : "" });
      await page.locator(".recharts-area").waitFor();
      const m = await page.evaluate(() => {
        const box = document.querySelector("[data-slot=chart]");
        const circles = [...document.querySelectorAll(".recharts-area-dots circle")].filter(
          (c) => getComputedStyle(c.closest(".recharts-area-dots")).display !== "none",
        );
        return {
          cls: box.className,
          hide: window.__chart.CHART_HIDE_DOTS ?? null,
          count: circles.length,
          r: [...new Set(circles.map((c) => c.getAttribute("r")))],
          fill: [...new Set(circles.map((c) => c.getAttribute("fill")))],
        };
      });
      await ctx.close();
      const p = [...errors];
      if (m.count !== want) p.push(`점 ${m.count} ≠ ${want}`);
      if (dots) {
        expectEq(p, "r", m.r, ["3"]);
        expectEq(p, "색", m.fill, ["var(--color-chart-blue)"]);
        if (m.cls.includes("recharts-area-dots]:hidden")) p.push("켠 차트에 숨김 규칙");
      } else if (!m.hide || !m.cls.includes(m.hide)) p.push("끈 차트에 숨김 규칙이 없다");
      return p;
    },
  })),

  // ── 실제 그린 가로축(담다 chart.test "차트에서 — 폭이 좁아 연도 눈금이 빠지면") ──
  ...[400, 260, 1200].map((w) => ({
    name: `가로축 ${w} — 글자 사이 8 이상 · 끝 눈금(10월)이 남고 · 연도는 보이는 눈금에 한 번${w === 1200 ? " · 모두 보이면 1월에만" : ""}`,
    async run() {
      const { ctx, page, errors } = await open("xaxis", { width: Math.max(w + 40, 390), query: `&w=${w}` });
      const { x } = await ticksOf(page);
      await ctx.close();
      const p = [...errors];
      const texts = x.map((t) => t.text);
      if (x.length && minGap(x) < 8) p.push(`글자 사이 ${minGap(x).toFixed(1)} < 8 (${texts.join(" · ")})`);
      if (texts.at(-1) !== "10월") p.push(`끝 눈금 ${texts.at(-1)}`);
      const years = texts.filter((t) => t.includes("2026"));
      if (years.length !== 1) p.push(`연도 눈금 ${years.length} 개 (${texts.join(" · ")})`);
      if (w === 1200) {
        if (texts.length !== 12) p.push(`넓은데 ${texts.length} 칸만`);
        expectEq(p, "연도", years, ["2026. 1."]);
      } else if (texts.length >= 12) p.push("좁은데 솎지 않았다");
      return p;
    },
  })),
  // 차트 그림 안 글(축 눈금)은 글자 크기 설정을 따르지 않는다(groo-design #260 — DESIGN.md Typography "그대로 두는 것") — 300% 에도 11px
  ...[
    { font: 1, how: "100%" },
    { font: 3, how: "300% 처음부터", atLoad: true },
    { font: 3, how: "300% 뜬 뒤" },
  ].map(({ font, how, atLoad }) => ({
    name: `눈금 글자는 그대로 — ${how} 에서 11px · 줄 높이 15(100% 와 같다)`,
    async run() {
      const { ctx, page, errors } = await open("xaxis", { width: 1300, query: `&w=1200${atLoad ? `&font=${font}` : ""}` });
      if (!atLoad && font !== 1) {
        await page.waitForTimeout(200);
        await page.evaluate((f) => {
          document.documentElement.style.fontSize = `${f * 100}%`;
        }, font);
        await page.waitForTimeout(300);
      }
      const { x } = await ticksOf(page);
      // 세로축 폭을 재는 숨은 글도 같은 글꼴 — AXIS_TICK_FONT_SIZE 를 계산된 크기로 푼다
      const measure = await page.evaluate(() => {
        const el = document.createElement("span");
        el.style.fontSize = window.__chart.AXIS_TICK_FONT_SIZE;
        el.style.lineHeight = "var(--text-t1-static--line-height)";
        document.body.appendChild(el);
        const cs = getComputedStyle(el);
        const out = { size: cs.fontSize, line: cs.lineHeight, root: getComputedStyle(document.documentElement).fontSize, tickLine: window.__chart.CHART_TICK_LINE };
        el.remove();
        return out;
      });
      await ctx.close();
      const p = [...errors];
      expectEq(p, "눈금 글자 크기", [...new Set(x.map((t) => t.fontSize))], ["11px"]);
      expectEq(p, "세로축 폭을 재는 글", [measure.size, measure.line, measure.tickLine], ["11px", "15px", 15]);
      if (font !== 1 && measure.root !== `${16 * font}px`) p.push(`문서 글자가 ${measure.root} — 키우지 않았다`);
      return p;
    },
  })),

  // ── 이음 화면 — 월별 쓴 휴가 ──
  libCase(
    "dayTicks(월별 쓴 휴가 세로축) — 정수 일, 간격 1 · 2 · 5 × 10ⁿ, 끝 ≥ 최대",
    () => [0.5, 1.5, 3, 4, 5, 7, 9, 10, 13, 25, 60, 130].map((max) => ({ max, ticks: window.__chart.dayTicks(max) })),
    (g, p) => {
      for (const { max, ticks } of g) {
        const step = ticks[1] - ticks[0];
        if (ticks[0] !== 0) p.push(`${max}: 0 에서 시작하지 않는다`);
        if (!ticks.every(Number.isInteger)) p.push(`${max}: 정수가 아니다 ${ticks}`);
        if (!ticks.every((v, i) => i === 0 || v - ticks[i - 1] === step)) p.push(`${max}: 간격이 고르지 않다 ${ticks}`);
        if (!is125(step)) p.push(`${max}: 간격 ${step} (${ticks})`);
        if (ticks.at(-1) < max) p.push(`${max}: 끝 ${ticks.at(-1)}`);
      }
      const of = (max) => g.find((x) => x.max === max).ticks;
      expectEq(p, "13", of(13), [0, 5, 10, 15]);
      expectEq(p, "1.5", of(1.5), [0, 1, 2]);
      expectEq(p, "7", of(7), [0, 2, 4, 6, 8]);
    },
  ),
  ...[
    { width: 390 },
    { width: 320 },
    { width: 200 },
    { width: 390, font: 2 },
  ].map(({ width, font }) => ({
    name: `월별 쓴 휴가 ${width}${font ? " · 글자 200%" : ""} — 달 눈금이 겹치지 않고 12월이 남고, 세로축은 0 · 5 · 10 · 15일`,
    async run() {
      const { ctx, page, errors } = await open("month", { width, query: font ? `&font=${font}` : "" });
      await page.locator(".recharts-bar-rectangle").first().waitFor();
      await page.waitForTimeout(200);
      const ticks = await ticksOf(page);
      const { x, y } = ticks;
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      await ctx.close();
      const p = [...errors, ...clipOf(ticks, ticks.box)];
      const texts = x.map((t) => t.text);
      if (minGap(x) < 8) p.push(`달 눈금 사이 ${minGap(x).toFixed(1)} < 8 (${texts.join(" · ")})`);
      if (texts.at(-1) !== "12월") p.push(`끝 눈금 ${texts.at(-1)}`);
      if (width === 390 && !font && texts.length !== 12 && texts.length < 6) p.push(`390 에서 ${texts.length} 칸만`);
      expectEq(p, "세로축", y.map((t) => t.text).sort((a, b) => parseFloat(a) - parseFloat(b)), ["0일", "5일", "10일", "15일"]);
      if (overflow > 0) p.push(`페이지가 가로로 ${overflow} 넘친다`);
      return p;
    },
  })),

  // ── QA 조건(2026-11-18) — 올해처럼 1 ~ 11월 · 최대 3일 · 차트 폭 336(390 폭) · 266(320 폭), 글자 200% 는 처음부터 · 떠 있는 동안 키움 ──
  // 끝 눈금은 오늘이 든 달(11월)이다 — 가로축은 오늘에서 끝나 12월은 아직 없다(chart.md "축 · 격자")
  ...[
    { vw: 390, cw: 336 },
    { vw: 320, cw: 266 },
  ].flatMap(({ vw, cw }) =>
    [
      { font: 1, how: "100%" },
      { font: 2, how: "200% 로 처음 그림", atLoad: true },
      { font: 2, how: "떠 있는 동안 200% 로 키움" },
    ].map(({ font, how, atLoad }) => ({
      name: `QA 달마다 쓴 휴가 ${vw}(차트 ${cw}) · ${how} — 끝 눈금 11월이 남고, 글 사이 8 이상, 가로 · 세로 글이 차트 밖으로 잘리지 않는다`,
      async run() {
        const { ctx, page, errors } = await open("month", { width: vw, query: `&qa=1&cw=${cw}${atLoad && font !== 1 ? `&font=${font}` : ""}` });
        await page.locator(".recharts-bar-rectangle").first().waitFor();
        await page.waitForTimeout(200);
        if (!atLoad && font !== 1) {
          await page.evaluate((f) => {
            document.documentElement.style.fontSize = `${f * 100}%`;
          }, font);
          await page.waitForTimeout(500);
        }
        const ticks = await ticksOf(page);
        await ctx.close();
        const p = [...errors, ...clipOf(ticks, ticks.box)];
        const texts = ticks.x.map((t) => t.text);
        if (Math.round(ticks.box.width) !== cw) p.push(`차트 폭 ${ticks.box.width}`);
        if (texts.at(-1) !== "11월") p.push(`끝 눈금 ${texts.at(-1)} (${texts.join(" · ")})`);
        if (minGap(ticks.x) < 8) p.push(`글 사이 ${minGap(ticks.x).toFixed(1)} < 8 (${texts.join(" · ")})`);
        // 끝 글 자리를 비워 두므로(D-1, chart.md "끝 글 자리는 비워 둡니다") 건너뛴 간격이 끝까지 고르다 — 끝 글을 옮기거나 앞 글을 빼지 않는다
        const steps = ticks.x.slice(1).map((t, i) => t.center - ticks.x[i].center);
        if (steps.length && Math.max(...steps) - Math.min(...steps) > 1.5)
          p.push(`간격이 고르지 않다 ${steps.map((d) => d.toFixed(1)).join(" · ")} (${texts.join(" · ")})`);
        const months = texts.map((t) => parseInt(t, 10));
        const monthSteps = new Set(months.slice(1).map((m, i) => m - months[i]));
        if (monthSteps.size > 1) p.push(`건너뛰는 달 수가 고르지 않다 (${texts.join(" · ")})`);
        const sizes = [...new Set([...ticks.x, ...ticks.y].map((t) => t.fontSize))];
        // 눈금 글은 글자 크기 설정을 따르지 않는다(groo-design #260) — 200% 에도 11px
        expectEq(p, "눈금 글자 크기", sizes, ["11px"]);
        expectEq(p, "세로축", ticks.y.map((t) => t.text).sort((a, b) => parseFloat(a) - parseFloat(b)), ["0일", "1일", "2일", "3일"]);
        return p;
      },
    })),
  ),

  // ── 세로 눈금이 겹치면 칸 수를 줄인다(E — groo-design #247 · #248, chart.md "세로 눈금이 겹치면 수를 줄입니다") ──
  // 눈금 글은 글자 크기 설정을 따르지 않아(groo-design #260) 줄 높이는 늘 15 — 칸 수는 높이 · 여백으로만 센다(글자 크기가 바뀌어도 같다)
  libCase(
    "세로 칸 수 — 그리는 높이 = 높이 − max(위, 8) − 아래 − 27, 칸 = ⌊그리는 높이 ÷ 15⌋(0 이상) · dayTicks 가 그 칸 안으로 줄인다 · 준 눈금은 interval 0",
    () => {
      const { chartValueIntervals: iv, dayTicks: d, niceValueAxis, formatAxisWon } = window.__chart;
      return {
        intervals: [iv(200), iv(140, { top: 8, bottom: 0 }), iv(120), iv(40)],
        // d(3, 1) — 한 칸 겨냥까지 내려도 넘치면 그 축을 쓴다(담다 niceValueAxis 와 같다 — 0 · 2 · 4)
        days: [d(4), d(4, 3), d(4, 2), d(13), d(13, 2), d(3, 1), d(25, 2), d(0.5, 1)],
        nice: niceValueAxis([0, 28_000], formatAxisWon, 2).ticks,
        niceInterval: niceValueAxis([0, 28_000], formatAxisWon).interval,
        // 글자 크기 판을 받던 옛 이름은 걷혔다(참조 0)
        gone: ["useTickLineHeight", "measureTickLineHeight", "measureTickLineHeightAt", "chartXAxisHeight", "chartXTickGap"].filter((k) => k in window.__chart),
      };
    },
    (g, p) => {
      // 기본 위 8 · 아래 5: 200 − 8 − 5 − 27 = 160 → 10 · 폰 띠 140(위 8 · 아래 0): 105 → 7 · 120: 80 → 5 · 아주 낮으면 0
      expectEq(p, "칸 수", g.intervals, [10, 7, 5, 0]);
      expectEq(p, "dayTicks", g.days, [[0, 1, 2, 3, 4], [0, 2, 4], [0, 2, 4], [0, 5, 10, 15], [0, 10, 20], [0, 2, 4], [0, 20, 40], [0, 1]]);
      expectEq(p, "niceValueAxis 두 칸", g.nice, [0, 20_000, 40_000]);
      expectEq(p, "niceValueAxis interval", g.niceInterval, 0);
      expectEq(p, "걷힌 이름", g.gone, []);
    },
  ),
  ...[
    { vw: 320, cw: 266, font: 1, how: "100%" },
    { vw: 320, cw: 266, font: 2, how: "200% 로 처음 그림", atLoad: true },
    { vw: 320, cw: 266, font: 3, how: "300% 로 처음 그림", atLoad: true },
    { vw: 390, cw: 336, font: 3, how: "300% 로 처음 그림", atLoad: true },
    { vw: 320, cw: 266, font: 3, how: "떠 있는 동안 300% 로 키움" },
    { vw: 390, cw: 336, font: 3, how: "떠 있는 동안 300% 로 키움" },
  ].map(({ vw, cw, font, how, atLoad }) => ({
    name: `세로 눈금 ${vw}(차트 ${cw}) · ${how} · 최대 4일 — 100% 와 같은 0 ~ 4일 다섯 눈금 · 11px, 하나도 빠지지 않고 겹치지 않는다`,
    async run() {
      const { ctx, page, errors } = await open("month", { width: vw, query: `&qa=1&cw=${cw}&peak=4${atLoad ? `&font=${font}` : ""}` });
      await page.locator(".recharts-bar-rectangle").first().waitFor();
      await page.waitForTimeout(200);
      if (!atLoad && font !== 1) {
        await page.evaluate((f) => {
          document.documentElement.style.fontSize = `${f * 100}%`;
        }, font);
        await page.waitForTimeout(500);
      }
      const ticks = await ticksOf(page);
      await ctx.close();
      const p = [...errors, ...clipOf(ticks, ticks.box)];
      const ys = [...ticks.y].sort((a, b) => a.top - b.top);
      const texts = ys.map((t) => t.text).reverse();
      expectEq(p, "세로 눈금", texts, ["0일", "1일", "2일", "3일", "4일"]);
      expectEq(p, "눈금 글자 크기", [...new Set(ys.map((t) => t.fontSize))], ["11px"]);
      for (let i = 1; i < ys.length; i++)
        if (ys[i].top < ys[i - 1].bottom - 0.5) p.push(`"${ys[i - 1].text}" · "${ys[i].text}" 가 ${(ys[i - 1].bottom - ys[i].top).toFixed(1)} 겹친다`);
      return p;
    },
  })),

  // ── 달마다 휴가 — 쓴 휴가 · 예정 두 계열(groo-design #249, chart.md "미리 잡는 일정의 값은 예외") ──
  ...[
    { c: "this-dec", tiles: ["쓴 휴가", "예정"], used: [2, 4, 7, 10, 11], expect: [11, 12] },
    { c: "this-nodec", tiles: ["쓴 휴가", "예정"], used: [2, 4, 7, 10, 11], expect: [11] },
    { c: "last", tiles: ["쓴 휴가"], used: [2, 4, 7, 10, 11, 12], expect: [] },
    { c: "next", tiles: ["예정"], used: [], expect: [1, 4, 12] },
  ].map(({ c, tiles, used, expect }) => ({
    name: `달마다 휴가 ${c} — 열두 달 · 타일 ${tiles.join(" · ")} · 쓴 휴가 채움 ${used.join(",") || "없음"} · 예정(옅은 바탕 + 1px 테두리) ${expect.join(",") || "없음"} · 나머지 빈 칸 · 제목`,
    async run() {
      const { ctx, page, errors } = await open("vacation", { width: 1280, query: `&case=${c}` });
      await page.locator("[data-slot=chart] .recharts-xAxis-tick-labels text").first().waitFor();
      await page.waitForTimeout(300);
      const m = await page.evaluate(() => {
        const labels = [...document.querySelectorAll(".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value")]
          .filter((e) => e.textContent)
          .map((e) => {
            const r = e.getBoundingClientRect();
            return { month: parseInt(e.textContent, 10), x: (r.left + r.right) / 2 };
          });
        const monthAt = (x) => labels.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a)).month;
        const rects = [...document.querySelectorAll(".recharts-bar-rectangle path")]
          .map((p) => {
            const r = p.getBoundingClientRect();
            return {
              fill: p.getAttribute("fill"),
              stroke: p.getAttribute("stroke"),
              strokeWidth: p.getAttribute("stroke-width"),
              rounded: /A/.test(p.getAttribute("d") ?? ""),
              top: r.top,
              bottom: r.bottom,
              height: r.height,
              month: monthAt((r.left + r.right) / 2),
            };
          });
        return {
          months: labels.map((l) => l.month),
          // 0 막대(높이 0)도 빈 칸이어야 한다 — 그려진 path 가 있으면 테두리가 바닥에 선으로 보인다
          ghosts: rects.filter((r) => r.height <= 0.5).map((r) => `${r.month}월 ${r.fill}`),
          rects: rects.filter((r) => r.height > 0.5),
          tiles: [...document.querySelectorAll("[data-slot=chart-legend-tile] [data-slot=chart-legend-name]")].map((e) => e.textContent.trim()),
          name: document.querySelector("[data-slot=chart]")?.getAttribute("aria-label") ?? "",
          title: document.querySelector("[data-check=title]")?.textContent ?? "",
        };
      });
      await ctx.close();
      const p = [...errors];
      expectEq(p, "가로축 열두 달", m.months, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      if (m.ghosts.length) p.push(`빈 칸에 0 막대가 그려졌다 — ${m.ghosts.join(", ")}`);
      expectEq(p, "타일", m.tiles, tiles);
      const usedRects = m.rects.filter((r) => r.fill === "var(--color-chart-blue)");
      const expectRects = m.rects.filter((r) => r.fill === "var(--color-chart-blue-subtle)");
      if (usedRects.length + expectRects.length !== m.rects.length) p.push(`다른 색 막대 ${m.rects.map((r) => r.fill).join(",")}`);
      expectEq(p, "쓴 휴가 막대 달", usedRects.map((r) => r.month).sort((a, b) => a - b), used);
      expectEq(p, "예정 막대 달", expectRects.map((r) => r.month).sort((a, b) => a - b), expect);
      for (const r of expectRects)
        if (r.stroke !== "var(--color-chart-blue)" || r.strokeWidth !== "1") p.push(`${r.month}월 예정 테두리 ${r.stroke} ${r.strokeWidth}`);
      for (const r of usedRects) if (r.stroke && r.stroke !== "none") p.push(`${r.month}월 쓴 휴가에 테두리 ${r.stroke}`);
      // 한 칸에 둘이면 쓴 휴가 아래 · 예정 위 — 맨 위 막대만 둥글다
      for (const e of expectRects) {
        const u = usedRects.find((r) => r.month === e.month);
        if (!e.rounded) p.push(`${e.month}월 예정 위 모서리가 없다`);
        if (!u) continue;
        if (Math.abs(e.bottom - u.top) > 1.5) p.push(`${e.month}월 예정(아래 ${e.bottom.toFixed(1)})이 쓴 휴가(위 ${u.top.toFixed(1)}) 위에 쌓이지 않았다`);
        if (u.rounded) p.push(`${e.month}월 예정 아래 쓴 휴가가 둥글다`);
      }
      for (const u of usedRects) if (!expectRects.some((e) => e.month === u.month) && !u.rounded) p.push(`${u.month}월 쓴 휴가 위 모서리가 없다`);
      if (m.title !== "달마다 휴가") p.push(`카드 제목 "${m.title}"`);
      const year = new Date().getFullYear() + { "this-dec": 0, "this-nodec": 0, last: -1, next: 1 }[c];
      if (!m.name.startsWith(`${year}년 달마다 휴가, `)) p.push(`차트 이름 "${m.name}"`);
      for (const tile of tiles) if (!m.name.includes(tile)) p.push(`차트 이름에 ${tile} 가 없다 — "${m.name}"`);
      return p;
    },
  })),
  {
    name: "달마다 휴가 툴팁 — 오늘이 든 달(11월)은 쓴 휴가 · 예정을 함께(\"11월 · 쓴 휴가 1일 · 예정 0.5일\")",
    async run() {
      const { ctx, page, errors } = await open("vacation", { width: 1280, query: "&case=this-dec" });
      await page.locator(".recharts-bar-rectangle path").first().waitFor();
      await page.waitForTimeout(300);
      const at = await page.evaluate(() => {
        const label = [...document.querySelectorAll(".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value")].find((e) => e.textContent === "11월");
        const plot = document.querySelector(".recharts-cartesian-grid")?.getBoundingClientRect();
        const r = label.getBoundingClientRect();
        return { x: (r.left + r.right) / 2, y: plot ? plot.top + plot.height / 2 : r.top - 40 };
      });
      await page.mouse.move(at.x, at.y);
      await page.waitForTimeout(300);
      const text = await page.locator("[data-slot=chart-tooltip]").innerText().catch(() => "");
      await ctx.close();
      const p = [...errors];
      const flat = text.replace(/\s+/g, " ").trim();
      for (const want of ["11월", "쓴 휴가 1일", "예정 0.5일"]) if (!flat.includes(want)) p.push(`툴팁에 "${want}" 가 없다 — "${flat}"`);
      if (flat.indexOf("쓴 휴가") > flat.indexOf("예정")) p.push(`쓴 휴가가 예정보다 먼저가 아니다 — "${flat}"`);
      return p;
    },
  },

  // ── 같은 시계 — 해 고르기도 회사 기준 오늘(groo-design #251). 브라우저 날짜와 회사 날짜가 다른 해 넘김 ──
  {
    name: "회사 오늘(companyToday) — 브라우저 LA 2026-12-31 20:00 · 회사 서울이면 2027-01-01, 타임존 없거나 모르면 브라우저 날짜",
    async run() {
      const { ctx, page, errors } = await open("lib", { timezoneId: "America/Los_Angeles", now: new Date("2026-12-31T20:00:00-08:00") });
      const g = await page.evaluate(() => {
        const { companyToday } = window.__chart;
        return [companyToday("Asia/Seoul"), companyToday(null), companyToday("Mars/Olympus"), companyToday("America/Los_Angeles")];
      });
      await ctx.close();
      const p = [...errors];
      expectEq(p, "회사 서울", g[0], { year: 2027, month: 1, day: 1 });
      expectEq(p, "타임존 없음", g[1], { year: 2026, month: 12, day: 31 });
      expectEq(p, "모르는 타임존", g[2], { year: 2026, month: 12, day: 31 });
      expectEq(p, "회사 LA", g[3], { year: 2026, month: 12, day: 31 });
      return p;
    },
  },
  ...[
    // 브라우저는 12월 31일(LA), 회사는 1월 1일(서울) — 회사로는 2027 이 올해 · 2026 이 지난해
    { tz: "Asia/Seoul", browser: "America/Los_Angeles", now: "2026-12-31T20:00:00-08:00", y: 2027, tiles: ["쓴 휴가", "예정"] },
    { tz: "Asia/Seoul", browser: "America/Los_Angeles", now: "2026-12-31T20:00:00-08:00", y: 2026, tiles: ["쓴 휴가"] },
    // 브라우저는 1월 1일(서울), 회사는 12월 31일(LA) — 회사로는 2026 이 올해 · 2027 이 다음 해
    { tz: "America/Los_Angeles", browser: "Asia/Seoul", now: "2027-01-01T09:00:00+09:00", y: 2027, tiles: ["예정"] },
    { tz: "America/Los_Angeles", browser: "Asia/Seoul", now: "2027-01-01T09:00:00+09:00", y: 2026, tiles: ["쓴 휴가", "예정"] },
  ].map(({ tz, browser: browserTz, now, y, tiles }) => ({
    name: `해 고르기는 회사 오늘 — 회사 ${tz} · 브라우저 ${browserTz} ${now.slice(0, 10)} 에 ${y}년이면 타일 ${tiles.join(" · ")}`,
    async run() {
      const { ctx, page, errors } = await open("vacation", { width: 1280, query: `&case=this-dec&tz=${tz}&y=${y}`, timezoneId: browserTz, now: new Date(now) });
      await page.locator("[data-slot=chart-legend-tile]").first().waitFor();
      const got = await page.evaluate(() =>
        [...document.querySelectorAll("[data-slot=chart-legend-tile] [data-slot=chart-legend-name]")].map((e) => e.textContent.trim()),
      );
      await ctx.close();
      const p = [...errors];
      expectEq(p, "타일", got, tiles);
      return p;
    },
  })),

  // ── 예정 표식 — 타일 점 · 툴팁 색 네모도 막대처럼 옅은 바탕 + 1px 계열 색 테두리(groo-design #251) ──
  {
    name: "예정 표식 — 타일 점 · 툴팁 색 네모가 옅은 바탕(chart-blue-subtle) + 1px chart-blue 테두리, 쓴 휴가는 채움",
    async run() {
      const { ctx, page, errors } = await open("vacation", { width: 1280, query: "&case=this-dec" });
      await page.locator(".recharts-bar-rectangle path").first().waitFor();
      await page.waitForTimeout(300);
      const resolve = () =>
        page.evaluate(() => {
          const probe = (value) => {
            const el = document.createElement("i");
            el.style.backgroundColor = value;
            document.body.appendChild(el);
            const got = getComputedStyle(el).backgroundColor;
            el.remove();
            return got;
          };
          return { blue: probe("var(--color-chart-blue)"), subtle: probe("var(--color-chart-blue-subtle)") };
        });
      const mark = (sel) =>
        page.evaluate((s) =>
          [...document.querySelectorAll(s)].map((el) => {
            const cs = getComputedStyle(el);
            return { marker: el.getAttribute("data-marker"), bg: cs.backgroundColor, width: cs.borderTopWidth, style: cs.borderTopStyle, color: cs.borderTopColor, size: el.getBoundingClientRect().width };
          }), sel);
      const colors = await resolve();
      const dots = await mark("[data-slot=chart-legend-dot]");
      const at = await page.evaluate(() => {
        const label = [...document.querySelectorAll(".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value")].find((e) => e.textContent === "11월");
        const plot = document.querySelector(".recharts-cartesian-grid")?.getBoundingClientRect();
        const r = label.getBoundingClientRect();
        return { x: (r.left + r.right) / 2, y: plot ? plot.top + plot.height / 2 : r.top - 40 };
      });
      await page.mouse.move(at.x, at.y);
      await page.waitForTimeout(300);
      const swatches = await mark("[data-slot=chart-tooltip-swatch]");
      await ctx.close();
      const p = [...errors];
      const check = (where, list) => {
        if (list.length !== 2) return p.push(`${where} ${list.length} 개`);
        const [used, plan] = list;
        if (used.marker != null || used.width !== "0px" || used.bg !== colors.blue) p.push(`${where} 쓴 휴가가 채움이 아니다 ${JSON.stringify(used)}`);
        if (plan.marker !== "outline") p.push(`${where} 예정 data-marker ${plan.marker}`);
        if (plan.bg !== colors.subtle) p.push(`${where} 예정 바탕 ${plan.bg} ≠ ${colors.subtle}`);
        if (plan.width !== "1px" || plan.style !== "solid" || plan.color !== colors.blue) p.push(`${where} 예정 테두리 ${plan.width} ${plan.style} ${plan.color}`);
        if (Math.abs(plan.size - 8) > 0.5) p.push(`${where} 예정 표식 크기 ${plan.size}`);
      };
      check("타일 점", dots);
      check("툴팁 색 네모", swatches);
      return p;
    },
  },

  // ── 세로축 끝 글의 자리(groo-design #250 · 담다 #640) — 위 여백 max(위, ⌈줄 ÷ 2⌉) · 가로 눈금 줄 시작 max(8, ⌈줄 ÷ 2⌉ + 4) ──
  ...[
    { vw: 320, cw: 266, font: 3, atLoad: true },
    { vw: 320, cw: 266, font: 3, atLoad: false },
    { vw: 390, cw: 336, font: 3, atLoad: true },
    { vw: 390, cw: 336, font: 2, atLoad: false },
  ].map(({ vw, cw, font, atLoad }) => ({
    name: `세로축 끝 글 자리 ${vw}(차트 ${cw}) · ${font * 100}% ${atLoad ? "처음부터" : "뜬 뒤"} — 맨 위 세로 글이 차트 상자 안, 맨 아래 세로 글과 첫 가로 글이 겹치지 않음`,
    async run() {
      const { ctx, page, errors } = await open("month", { width: vw, query: `&qa=1&cw=${cw}&peak=4${atLoad ? `&font=${font}` : ""}` });
      await page.locator(".recharts-bar-rectangle").first().waitFor();
      await page.waitForTimeout(200);
      if (!atLoad) {
        await page.evaluate((f) => {
          document.documentElement.style.fontSize = `${f * 100}%`;
        }, font);
        await page.waitForTimeout(500);
      }
      const ticks = await ticksOf(page);
      await ctx.close();
      const p = [...errors, ...clipOf(ticks, ticks.box)];
      const top = Math.min(...ticks.y.map((t) => t.top));
      const boxTop = await Promise.resolve(ticks.box.top);
      if (top < boxTop - 0.5) p.push(`맨 위 세로 글이 차트 상자 위로 ${(boxTop - top).toFixed(1)} 나간다`);
      // 맨 아래 세로 글과 첫 가로 글 — 글 상자(글꼴의 위아래 끝까지)가 겹치지 않는다. 세로로는 글 상자끼리 거의 맞닿을 수 있지만
      // (가로 글은 대문자 높이로 맞춰 서서 글꼴 위 끝이 시작선보다 조금 위로 나온다) 세로 글은 세로축 칸, 가로 글은 그리는 자리 아래라 옆으로 갈린다
      const bottomY = ticks.y.reduce((a, b) => (b.bottom > a.bottom ? b : a));
      const firstX = ticks.x.reduce((a, b) => (b.left < a.left ? b : a));
      const overlapX = Math.min(bottomY.right, firstX.right) - Math.max(bottomY.left, firstX.left);
      const overlapY = Math.min(bottomY.bottom, firstX.bottom) - Math.max(bottomY.top, firstX.top);
      if (overlapX > 0.5 && overlapY > 0.5) p.push(`맨 아래 세로 글("${bottomY.text}")과 첫 가로 글("${firstX.text}")이 겹친다(${overlapX.toFixed(1)} × ${overlapY.toFixed(1)})`);
      // 가로 눈금 글은 맨 아래 세로 글의 줄 상자(줄 높이 절반이 아래로)보다 아래에서 시작한다 — 가로 글 위 끝(글꼴) ≥ 세로 글 가운데 + 줄 높이 ÷ 2 − 대문자 위 여유
      const xStartBelowYCenter = firstX.top - (bottomY.top + bottomY.bottom) / 2;
      if (xStartBelowYCenter < 0) p.push(`첫 가로 글이 맨 아래 세로 글 가운데보다 위에서 시작한다(${xStartBelowYCenter.toFixed(1)})`);
      return p;
    },
  })),
];

const only = process.argv[2];
const picked = only ? cases.filter((c) => c.name.includes(only)) : cases;

let failed = 0;
try {
  for (const c of picked) {
    let problems;
    try {
      problems = await c.run();
    } catch (e) {
      problems = [String(e?.message ?? e).split("\n")[0]];
    }
    console.log(`${problems.length ? "✗" : "✓"} ${c.name}${problems.length ? ` — ${problems.join(", ")}` : ""}`);
    if (problems.length) failed += 1;
  }
} finally {
  await browser.close();
  await server.close();
}

if (failed) {
  console.error(`\n${failed}건 실패`);
  process.exit(1);
}
console.log(`\n${picked.length}건 통과`);
