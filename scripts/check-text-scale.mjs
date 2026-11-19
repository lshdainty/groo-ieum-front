#!/usr/bin/env node
/**
 * 글자 크기 두 갈래(groo-design #260 · #261 · #263 · #264 — DESIGN.md Typography "글자 크기 설정을 따르는 것과 그대로 두는 것" ·
 * "상자 · 아이콘 · 원은 px")를 크로미움에서 확인한다 — groo-damda-front #650 · #651 의 담다 시험(vitest — text-scale.test ·
 * box-px.test · tests/screen-box-px.test · calendar-week-grid.test)을 이 레포에 맞게 옮긴 것이다.
 *
 *   · 그대로 두는 쪽(-static · px) — 배지 · 도넛 가운데 · 쪽 번호 · 사진 위 장수 · 카드 면 글 · 캘린더 월 · 주 · 년 칸 안 글(요일 · 날짜 ·
 *     공휴일 이름 · 칸 안 일정 · "+N개" · 시각 눈금 · 지금 시각) · 원 26 · 년 보기 칸 44 · 원 24 · 홈 미작성 달력 · 그날 목록 깃발 16
 *   · 커지는 쪽(rem) — 버튼 글 · 지표 타일 합계 · 표로 보기 · 툴팁 줄 · 사이드 메뉴 항목 이름 · 년 보기 달 이름 단추 · 홈 달력 제목 · 범례 ·
 *     그날 목록 줄 제목
 * 300% 를 처음부터 준 것과 뜬 뒤 키운 것에서 그대로 두는 쪽은 100% 와 같고(글자 · 상자 크기), 커지는 쪽은 글자가 세 배다.
 *
 * 화면 쪽 rem 숫자 유틸(`size-4` · `h-2` · `[&_svg]:size-4` · `min-h-11` …)이 다시 들어오지 않게 소스도 훑는다 — 숫자 유틸은 rem 이라
 * 글자 300% 에서 아이콘 · 점 · 막대 · 칸이 세 배가 된다(담다 box-px.test · screen-box-px.test 와 같은 식). 걷은 옛 규칙(일곱 칸 200% 상한 ·
 * 년 보기 달 수 판정 · 눈금 줄 높이 재기)의 이름도 0 이어야 한다.
 *
 * 이 레포에는 단위 테스트 러너가 없어 check-narrow 처럼 개발 서버와 Playwright 로 돈다. 무대는 scripts/check-text-scale/harness.tsx.
 * 사용: node scripts/check-text-scale.mjs [이름 일부 — 그 시험만]
 * Playwright 의 Chromium 이 필요하다 — 처음 한 번 `npx playwright install chromium`.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createServer } from "vite";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HARNESS = "/scripts/check-text-scale/harness.html";

// ── 소스 훑기 ──
// 담다 box-px.test · screen-box-px.test 와 같은 식 — 변형 접두(`lg:` · `[&_svg]:` · `before:`)를 붙인 것까지 잡는다. 0 · 분수(w-1/2)는 rem 이 아니다
const REM_SIZE =
  /(?<![\w-])(?:[\w[\]&>_=@()/-]+:)*(?:size|h|w|min-h|min-w|max-h|max-w)-(?!0(?![.\d]))\d+(?:\.\d+)?(?![\w[\]/.-])/g;
// 아이콘 · 점 크기를 rem 임의값으로 — size-[1rem](화면 쪽). 글을 담는 상자를 글에 맞춘 rem 임의값(`w-[9rem]`)은 막지 않는다
const REM_ICON = /(?<![\w-])(?:[\w[\]&>_=@()/-]+:)*size-\[\d+(?:\.\d+)?rem\]/g;
// ds 안은 상자 크기 rem 임의값도 막는다(담다 box-px.test)
const REM_ARBITRARY = /(?<![\w-])(?:[\w[\]&>_=@()/-]+:)*(?:size|w|h|min-w|min-h|max-w|max-h)-\[\d+(?:\.\d+)?rem\]/g;
const SCREEN_DIRS = ["src/app", "src/pages", "src/widgets", "src/features", "src/entities", "src/shared/ui", "src/shared/lib", "src/shared/api", "src/shared/hooks"];
const SKIP = /\.(test|demo|measure)\.|\.test-utils\.|(^|\/)(catalog|spec)\//;
// 걷은 옛 규칙의 이름 — 일곱 칸 200% 상한(#258) · 년 보기 달 수 판정(#257) · 글자 크기를 따르던 눈금 줄 높이(담다 #636 · #638 · #640)
const OLD_NAMES = /WEEK_GRID_TEXT|week-grid-text|WEEK_GRID_LINE_HEIGHT|useYearColumns|use-year-columns|useTickLineHeight|measureTickLineHeight|chartXAxisHeight|chartXTickGap/g;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !SKIP.test(relative(ROOT, p))) out.push(p);
  }
  return out;
}
// 주석은 줄 수를 지키며 지운다 — 어긋난 자리를 줄 번호로 알린다
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).replace(/(^|[^:])\/\/.*$/gm, "$1");
function scan(dirs, re, { keepComments = false } = {}) {
  const bad = [];
  for (const dir of dirs)
    for (const f of walk(join(ROOT, dir))) {
      const text = readFileSync(f, "utf8");
      (keepComments ? text : strip(text)).split("\n").forEach((line, i) => {
        for (const m of line.matchAll(re)) bad.push(`${relative(ROOT, f)}:${i + 1} ${m[0]}`);
      });
    }
  return bad;
}
const hits = (re, s) => [...s.matchAll(re)].map((m) => m[0]);

// ── 브라우저 ──
const server = await createServer({ root: ROOT, logLevel: "error", server: { port: 0 } });
await server.listen();
const base = server.resolvedUrls.local[0].replace(/\/$/, "");
const browser = await chromium.launch();

async function open({ font, live }) {
  const ctx = await browser.newContext({ locale: "ko-KR", viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  // 지금 시각 줄 · 오늘 · 홈 달력의 이번 달을 고정 — 2026-11-18 10:00(브라우저 시각)
  await page.clock.setFixedTime(new Date(2026, 10, 18, 10, 0));
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}${HARNESS}${font !== 1 && !live ? `?font=${font}` : ""}`);
  await page.locator("[data-check=missing] [data-day]").first().waitFor();
  await page.locator("[data-slot=week-event]").first().waitFor();
  await page.waitForTimeout(300);
  if (live) {
    await page.evaluate((f) => {
      document.documentElement.style.fontSize = `${f * 100}%`;
    }, font);
    await page.waitForTimeout(400);
  }
  return { ctx, page, errors };
}

/** 잴 자리 — { 이름: { kind: "static" | "grow", font, w, h } }. 상자 크기를 보는 자리는 box: true */
const measure = (page) =>
  page.evaluate(() => {
    const out = {};
    // mode — "text"(글 크기만) · "box"(상자 크기만 — 글이 없는 칸 · 점 · 아이콘) · "both"(글이 든 원 · 칸)
    const put = (name, kind, el, mode = "text") => {
      if (!el) {
        out[name] = { kind, missing: true };
        return;
      }
      const r = el.getBoundingClientRect();
      out[name] = { kind, mode, font: parseFloat(getComputedStyle(el).fontSize), w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 };
    };
    const q = (sel) => document.querySelector(sel);
    // data-measure 를 단 ds 자리
    for (const el of document.querySelectorAll("[data-measure]")) {
      const [kind, name] = el.getAttribute("data-measure").split(":");
      put(name, kind, el, name.startsWith("스켈레톤") ? "box" : "text");
    }
    put("도넛 가운데 라벨", "static", q("[data-slot=chart-donut-center-label]"));
    put("도넛 가운데 값", "static", q("[data-slot=chart-donut-center-amount]"));
    put("지표 타일 합계", "grow", q("[data-slot=chart-legend-total]"));
    put("지표 타일 이름", "grow", q("[data-slot=chart-legend-name]"));
    put("표로 보기 칸", "grow", q("[data-slot=chart-data-table] td"));
    put("표로 보기 제목", "grow", q("[data-slot=chart-data-table] caption"));
    put("툴팁 줄", "grow", q("[data-slot=chart-tooltip-row]"));

    // 캘린더 월 — 폰 · 넓은
    for (const where of ["phone", "desktop"]) {
      const root = q(`[data-check=${where}]`);
      const head = root.querySelector(".grid-cols-7");
      put(`${where} 요일`, "static", head?.querySelector("span"));
      const today = [...root.querySelectorAll("[data-slot=month-day-number]")].find((el) => el.textContent.trim() === "18");
      put(`${where} 날짜 숫자 · 원 26`, "static", today, "both");
      put(`${where} 공휴일 이름`, "static", root.querySelector("[data-slot=month-holiday]"));
      put(`${where} 칸 안 일정`, "static", root.querySelector("[data-slot=month-chip]"));
      put(`${where} "+N개"`, "static", root.querySelector("[data-slot=month-more]"));
    }
    // 주 보기
    {
      const root = q("[data-check=week]");
      const headCell = [...root.querySelectorAll(".grid-cols-7 > div")].find((el) => el.textContent.includes("18"));
      put("주 요일 · 날짜", "static", headCell?.querySelector("div"));
      put("주 공휴일 이름", "static", headCell?.querySelectorAll(":scope > div")[1]);
      const hourLabel = [...root.querySelectorAll("span.text-fg-neutral-subtle")].find((el) => /\d/.test(el.textContent));
      put("주 시각 눈금", "static", hourLabel);
      put("주 일정", "static", root.querySelector("[data-slot=week-event]"));
      // 시각 칸 폭 72 — 머리 왼쪽 빈 칸
      put("주 시각 칸 폭 72", "static", root.querySelector(".border-b > div:first-child"), "box");
      const dot = root.querySelector(".bg-bg-brand-solid.rounded-full");
      put("주 지금 시각 점 12", "static", dot, "box");
      put("주 지금 시각 글 · 폭 64", "static", dot?.nextElementSibling, "both");
    }
    // 년 보기 작은 달
    {
      const root = q("[data-check=year]");
      const rows = root.querySelectorAll(".grid-cols-7");
      put("년 요일", "static", rows[0]?.children[0]);
      const cell = [...(rows[1]?.children ?? [])].find((el) => el.textContent.startsWith("18"));
      put("년 날짜 칸 44", "static", cell, "box");
      put("년 날짜 원 24", "static", cell?.querySelector("div"), "both");
      put('년 "+N"', "static", cell?.querySelector(".text-fg-neutral-muted"));
      put("년 달 이름 단추", "grow", root.querySelector("button"));
    }
    // 그날 목록
    {
      const root = q("[data-check=day-list]");
      put("그날 목록 깃발 16", "static", root.querySelector("[data-slot=day-holiday] svg"), "box");
      put("그날 목록 줄 제목", "grow", [...root.querySelectorAll("[data-slot=day-holiday] *")].find((el) => el.childElementCount === 0 && el.textContent === "시험 공휴일"));
    }
    // 홈 업무 미작성 달력
    {
      const root = q("[data-check=missing]");
      put("홈 달력 요일", "static", root.querySelector("th"));
      put("홈 달력 날짜 · 원 30", "static", root.querySelector("[data-day='18'] > span"), "both");
      put("홈 달력 제목", "grow", root.querySelector("[data-missing-title]"));
      put("홈 달력 범례", "grow", root.querySelector("[data-missing-legend] span:last-child"));
    }
    return out;
  });

const cases = [
  // ── 300% 두 갈래 — 처음부터 · 뜬 뒤 ──
  ...[
    { font: 3, live: false },
    { font: 3, live: true },
  ].map(({ font, live }) => ({
    name: `${font * 100}% ${live ? "뜬 뒤" : "처음부터"} — 그대로 두는 쪽(배지 · 도넛 가운데 · 쪽 번호 · 장수 · 카드 면 · 캘린더 칸 안 글 · 원 · 칸 · 아이콘)은 100% 와 같고, 커지는 쪽은 세 배`,
    async run() {
      const one = await open({ font: 1 });
      const at100 = await measure(one.page);
      await one.ctx.close();
      const big = await open({ font, live });
      const atBig = await measure(big.page);
      const root = await big.page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
      await big.ctx.close();
      const p = [...one.errors, ...big.errors];
      if (root !== `${16 * font}px`) p.push(`문서 글자 ${root} — 키우지 않았다`);
      let statics = 0;
      let grows = 0;
      for (const [name, a] of Object.entries(at100)) {
        const b = atBig[name];
        if (a.missing || b?.missing) {
          p.push(`${name} 자리가 없다`);
          continue;
        }
        if (a.kind === "static") {
          statics += 1;
          if (a.mode !== "box" && a.font !== b.font) p.push(`${name} 글 ${a.font} → ${b.font}`);
          if (a.mode !== "text" && (a.w !== b.w || a.h !== b.h)) p.push(`${name} 상자 ${a.w}×${a.h} → ${b.w}×${b.h}`);
        } else {
          grows += 1;
          if (Math.abs(b.font - a.font * font) > 0.5) p.push(`${name} 글 ${a.font} → ${b.font}(세 배 ${a.font * font} 이어야)`);
        }
      }
      if (statics < 30 || grows < 10) p.push(`잰 자리 그대로 ${statics} · 커짐 ${grows} — 무대가 덜 그려졌다`);
      return p;
    },
  })),
  {
    name: "100% 의 스펙 값 — 캘린더 날짜 원 26 · 년 보기 칸 44 · 원 24 · 홈 달력 원 30 · 주 시각 칸 72 · 지금 시각 점 12 · 글 64 · 깃발 16",
    async run() {
      const { ctx, page, errors } = await open({ font: 1 });
      const m = await measure(page);
      await ctx.close();
      const p = [...errors];
      const want = {
        "phone 날짜 숫자 · 원 26": [26, 26],
        "desktop 날짜 숫자 · 원 26": [26, 26],
        "년 날짜 칸 44": [null, 44],
        "년 날짜 원 24": [24, 24],
        "홈 달력 날짜 · 원 30": [30, 30],
        "주 시각 칸 폭 72": [72, null],
        "주 지금 시각 점 12": [12, 12],
        "주 지금 시각 글 · 폭 64": [64, null],
        "그날 목록 깃발 16": [16, 16],
      };
      for (const [name, [w, h]] of Object.entries(want)) {
        const x = m[name];
        if (!x || x.missing) {
          p.push(`${name} 자리가 없다`);
          continue;
        }
        if (w != null && x.w !== w) p.push(`${name} 폭 ${x.w}`);
        if (h != null && x.h !== h) p.push(`${name} 높이 ${x.h}`);
      }
      // 칸 안 글 크기 — 공휴일 이름 t1-static 11 · 칩 · "+N개" · 주 보기 t2-static 12 · 요일 t3-static 13 · 폰 날짜 t4-static 14
      const sizes = {
        "phone 요일": 13, "desktop 요일": 13, "phone 날짜 숫자 · 원 26": 14, "desktop 날짜 숫자 · 원 26": 13,
        "phone 공휴일 이름": 11, "desktop 공휴일 이름": 11, "phone 칸 안 일정": 12, "phone \"+N개\"": 12,
        "주 요일 · 날짜": 12, "주 공휴일 이름": 12, "주 시각 눈금": 12, "주 일정": 12, "주 지금 시각 글 · 폭 64": 12,
        "년 요일": 12, "년 날짜 원 24": 12, "년 \"+N\"": 11, "홈 달력 요일": 12, "홈 달력 날짜 · 원 30": 13,
      };
      for (const [name, px] of Object.entries(sizes)) if (m[name]?.font !== px) p.push(`${name} 글 ${m[name]?.font}(${px} 이어야)`);
      return p;
    },
  },

  // ── 소스 — 화면 · ds 의 rem 숫자 유틸, 걷은 옛 이름 ──
  {
    name: "화면 쪽(앱 · 화면 · 기능 · 엔티티 · 옛 공용 부품) 상자 · 아이콘 · 색 점 · 칸에 rem 숫자 유틸이 없다(size-4 → size-[16px])",
    run: () => [...scan(SCREEN_DIRS, REM_SIZE), ...scan(SCREEN_DIRS, REM_ICON)],
  },
  {
    name: "ds 부품(데모 · 견본 · 카탈로그 · 스펙 제외)의 상자 · 아이콘 크기에 rem 숫자 유틸 · rem 임의값이 없다",
    run: () => [...scan(["src/shared/ds"], REM_SIZE), ...scan(["src/shared/ds"], REM_ARBITRARY)],
  },
  {
    name: "걷은 옛 규칙의 이름이 src 에 0 — WEEK_GRID_TEXT · week-grid-text · useYearColumns · useTickLineHeight · measureTickLineHeight · chartXAxisHeight · chartXTickGap",
    run: () => scan(["src"], OLD_NAMES, { keepComments: true }),
  },
  {
    name: "훑는 식이 실제로 잡는다 — 아이콘 · 점 · 막대 · 변형 접두 · 최소 높이, px · 토큰 · 분수 · 0 · 글 줄 기준은 잡지 않는다",
    run() {
      const p = [];
      const got = hits(REM_SIZE, 'className="size-4 shrink-0" "[&_svg]:size-4" "lg:size-5" "h-2 w-full" "before:size-11" "min-h-11" "w-18" "h-3.5"');
      const want = ["size-4", "[&_svg]:size-4", "lg:size-5", "h-2", "before:size-11", "min-h-11", "w-18", "h-3.5"];
      if (JSON.stringify(got) !== JSON.stringify(want)) p.push(`잡은 것 ${JSON.stringify(got)}`);
      const none = hits(REM_SIZE, "size-[16px] h-[8px] w-x4 w-1/2 min-w-0 h-(--text-t1--line-height) w-full size-[26px] w-[72px]");
      if (none.length) p.push(`잡지 말아야 할 것 ${JSON.stringify(none)}`);
      if (hits(REM_ICON, "size-[1rem]").length !== 1) p.push("size-[1rem] 을 잡지 못한다");
      if (hits(REM_ARBITRARY, "w-[2.375rem] min-h-[5.875rem]").length !== 2) p.push("상자 rem 임의값을 잡지 못한다");
      return p;
    },
  },
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
