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
    // 스켈레톤 — 글 자리(올 글의 줄 높이 — 커진다). 사용자 역할 지정 자리: 이름 t8 · 메일 t4 · 부서 값 t4, 틀(저장 단추 · 칸 라벨)은 실제 부품
    {
      const root = q("[data-check=skeleton]");
      const sk = [...root.querySelectorAll("[data-slot=skeleton]")];
      put("스켈레톤 글 자리 이름 t8", "grow", sk[0], "box");
      put("스켈레톤 글 자리 메일 t4", "grow", sk[1], "box");
      put("스켈레톤 글 자리 부서 값 t4", "grow", sk[2], "box");
      put("스켈레톤 틀 저장 단추", "grow", [...root.querySelectorAll("button")].find((b) => !b.closest("[data-skeleton-rows]")));
    }
    // 휴가 신청 결재 단계 — 원 24 · 안의 순번은 원(틀)의 일부라 그대로(#260 — 고리 · 도장 가운데 글과 같다), 체크 아이콘 16
    {
      const root = q("[data-check=steps]");
      put("결재 단계 원 24 · 순번", "static", root.querySelector("[data-step='2'] span[aria-hidden]"), "both");
      put("결재 단계 체크 16", "static", root.querySelector("[data-step='1'] svg"), "box");
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
          // 글 자리 스켈레톤(box)은 높이가 올 글의 줄 높이를 따라 세 배, 나머지는 글자가 세 배
          if (a.mode === "box") {
            if (Math.abs(b.h - a.h * font) > 1) p.push(`${name} 높이 ${a.h} → ${b.h}(세 배 ${a.h * font} 이어야)`);
          } else if (Math.abs(b.font - a.font * font) > 0.5) p.push(`${name} 글 ${a.font} → ${b.font}(세 배 ${a.font * font} 이어야)`);
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
        "결재 단계 원 24 · 순번": [24, 24],
        "결재 단계 체크 16": [16, 16],
        "스켈레톤 글 자리 이름 t8": [128, 30],
        "스켈레톤 글 자리 메일 t4": [192, 19],
        "스켈레톤 t1-static": [40, 15],
        "스켈레톤 t1": [40, 15],
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
        "년 요일": 12, "년 날짜 원 24": 12, "년 \"+N\"": 11, "홈 달력 요일": 12, "홈 달력 날짜 · 원 30": 13, "결재 단계 원 24 · 순번": 12,
      };
      for (const [name, px] of Object.entries(sizes)) if (m[name]?.font !== px) p.push(`${name} 글 ${m[name]?.font}(${px} 이어야)`);
      return p;
    },
  },

  // ── 표 쪽 넘김 줄은 최소 높이 40(groo-design #268 — 담다 table-pagination.test "한 줄 최소 40") ──
  ...[false, true].map((live) => ({
    name: `표 쪽 넘김 줄 · 300% ${live ? "뜬 뒤" : "처음부터"} — 100% 는 40, 큰 글자에서는 고르기 · 글을 따라 줄이 높아져 안의 것이 줄 밖으로 넘치지 않는다`,
    async run() {
      const read = (page) =>
        page.evaluate(() => {
          const root = document.querySelector("[data-check=table-pagination] [data-slot=table-pagination]");
          if (!root) return null;
          const r = root.getBoundingClientRect();
          const kids = [...root.children].map((el) => el.getBoundingClientRect());
          return { h: r.height, over: Math.max(0, ...kids.map((k) => Math.max(r.top - k.top, k.bottom - r.bottom))), tallest: Math.max(...kids.map((k) => k.height)) };
        });
      const one = await open({ font: 1 });
      const at100 = await read(one.page);
      await one.ctx.close();
      const big = await open({ font: 3, live });
      const at300 = await read(big.page);
      await big.ctx.close();
      const p = [...one.errors, ...big.errors];
      if (!at100 || !at300) return [...p, "쪽 넘김 줄이 없다"];
      if (at100.h !== 40) p.push(`100% 줄 높이 ${at100.h}(40 이어야)`);
      if (!(at300.tallest > 40)) p.push(`300% 에서 줄 안의 가장 높은 것 ${at300.tallest} — 글이 커지지 않아 시험이 아무것도 재지 않는다`);
      if (at300.over > 0.5) p.push(`300% 에서 줄 안의 것이 줄 밖으로 ${at300.over.toFixed(1)} 넘친다(줄 높이 ${at300.h} — 고정 높이면 넘친다)`);
      return p;
    },
  })),

  // ── 나무 꺾쇠 · 체크는 이름 첫 줄 가운데(groo-design #263 레시피 — 이음 ds tree-view) ──
  ...[false, true].map((live) => ({
    name: `나무 · 300% ${live ? "뜬 뒤" : "처음부터"} — 꺾쇠 16 · 체크 18 은 크기 그대로, 이름 첫 줄 가운데와의 거리가 100% 와 같다`,
    async run() {
      const read = (page) =>
        page.evaluate(() => {
          const row = document.querySelector("[data-check=tree] [data-slot=tree-view-row]");
          const label = row.querySelector("[data-slot=tree-view-label]");
          const range = document.createRange();
          range.selectNodeContents(label);
          const rects = [...range.getClientRects()].filter((r) => r.width > 0);
          const lh = parseFloat(getComputedStyle(label).lineHeight);
          const firstCenter = label.getBoundingClientRect().top + lh / 2;
          const at = (sel) => {
            const r = row.querySelector(sel).getBoundingClientRect();
            return { off: (r.top + r.bottom) / 2 - firstCenter, w: Math.round(r.width), h: Math.round(r.height) };
          };
          return { lines: new Set(rects.map((r) => Math.round(r.top))).size, chevron: at("[data-slot=tree-view-chevron] svg"), check: at("[data-slot=tree-view-check] svg") };
        });
      const one = await open({ font: 1 });
      const a = await read(one.page);
      await one.ctx.close();
      const big = await open({ font: 3, live });
      const b = await read(big.page);
      await big.ctx.close();
      const p = [...one.errors, ...big.errors];
      if (b.lines < 2) p.push(`300% 에서 이름이 ${b.lines} 줄`);
      for (const k of ["chevron", "check"]) {
        if (Math.abs(a[k].off - b[k].off) > 0.5) p.push(`${k} 가운데 − 이름 첫 줄 가운데 ${a[k].off.toFixed(1)} → ${b[k].off.toFixed(1)}`);
        if (a[k].w !== b[k].w || a[k].h !== b[k].h) p.push(`${k} 크기 ${a[k].w}×${a[k].h} → ${b[k].w}×${b[k].h}`);
      }
      return p;
    },
  })),

  // ── 블록 스켈레톤(skeleton.md "틀은 먼저, 데이터 자리만 스켈레톤" · "크기 — 글은 글줄 높이") ──
  // 데이터를 담는 줄 · 상자는 블록 하나로 덮지 않고 실제와 같은 부품(List 줄 · Select Box 상자 · 조직도 상자 · 지표 타일)에 글 줄만 둔다 —
  // 100% 에서 실제와 높이가 같고, 300%(처음부터 · 뜬 뒤)에서도 실제와 함께 커진다. 틀 부품(검색칸 · 단추 · 칸 라벨)은 스켈레톤이 아니라 실제 부품이다
  ...[false, true].map((live) => ({
    name: `블록 스켈레톤 · 300% ${live ? "뜬 뒤" : "처음부터"} — 목록 줄 · 값 줄 · 고르기 상자(라디오 · 체크) · 조직도 상자 · 지표 타일이 100% 에서 실제와 같은 높이, 300% 에서도 실제와 함께 커진다`,
    async run() {
      const read = (page) =>
        page.evaluate(() => {
          const pick = {
            list: (el) => el.querySelector("[data-slot=list] > *"),
            "list-suffix": (el) => el.querySelector("[data-slot=list] > *"),
            radio: (el) => el.querySelector("[data-slot=select-box-group] > *"),
            check: (el) => el.querySelector("[data-slot=select-box-group] > *"),
            org: (el) => el.querySelector("[data-org-box], [data-org-box-skeleton]"),
            tiles: (el) => el.querySelector("[data-slot=chart-legend-total]")?.closest("button"),
          };
          const out = {};
          for (const box of document.querySelectorAll("[data-pair]")) {
            const pair = box.getAttribute("data-pair");
            const el = pick[pair](box);
            out[pair] ??= {};
            out[pair][box.getAttribute("data-side")] = el ? Math.round(el.getBoundingClientRect().height * 10) / 10 : null;
          }
          return out;
        });
      const one = await open({ font: 1 });
      const a = await read(one.page);
      await one.ctx.close();
      const big = await open({ font: 3, live });
      const b = await read(big.page);
      await big.ctx.close();
      const p = [...one.errors, ...big.errors];
      for (const [pair, x] of Object.entries(a)) {
        const y = b[pair];
        if (x.sk == null || x.real == null || y.sk == null || y.real == null) {
          p.push(`${pair} 자리가 없다 ${JSON.stringify({ x, y })}`);
          continue;
        }
        if (Math.abs(x.sk - x.real) > 0.5) p.push(`${pair} 100% 기다림 ${x.sk} ≠ 실제 ${x.real}`);
        if (Math.abs(y.sk - y.real) > 1) p.push(`${pair} 300% 기다림 ${y.sk} ≠ 실제 ${y.real}`);
        if (!(y.sk > x.sk + 1)) p.push(`${pair} 300% 에서 기다림 자리가 커지지 않는다 ${x.sk} → ${y.sk}`);
      }
      return p;
    },
  })),
  {
    name: "틀 부품 자리에 Skeleton 없음 — 사용자 목록 머리 · 검색칸(막힘) · 역할 지정 칸 라벨 · 설명 · 저장 단추(막힘)는 실제 부품",
    async run() {
      const { ctx, page, errors } = await open({ font: 1 });
      const m = await page.evaluate(() => {
        const list = document.querySelector("[data-pair=list][data-side=sk]");
        const input = list.querySelector("input");
        const head = list.querySelector("h3");
        const role = document.querySelector("[data-check=skeleton]");
        const save = [...role.querySelectorAll("button")].find((b) => !b.closest("[data-skeleton-rows]"));
        const label = role.querySelector("[data-slot=field-header]");
        return {
          input: input ? { disabled: input.disabled, skeleton: !!input.closest("[data-slot=skeleton]") } : null,
          head: head ? { text: head.textContent, skeleton: !!head.querySelector("[data-slot=skeleton]") } : null,
          save: save ? { disabled: save.disabled, text: save.textContent, skeleton: !!save.querySelector("[data-slot=skeleton]") } : null,
          label: label?.textContent ?? null,
          fieldSkeletonOutsideRows: [...role.querySelectorAll("[data-slot=field] [data-slot=skeleton]")].filter((el) => !el.closest("[data-skeleton-rows]")).length,
        };
      });
      await ctx.close();
      const p = [...errors];
      if (!m.input || !m.input.disabled || m.input.skeleton) p.push(`검색칸 ${JSON.stringify(m.input)}`);
      if (!m.head || m.head.skeleton || !m.head.text.trim()) p.push(`목록 머리 ${JSON.stringify(m.head)}`);
      if (!m.save || !m.save.disabled || m.save.skeleton || !m.save.text.trim()) p.push(`저장 단추 ${JSON.stringify(m.save)}`);
      if (!m.label) p.push("역할 칸 라벨이 없다");
      if (m.fieldSkeletonOutsideRows) p.push(`역할 칸 머리에 스켈레톤 ${m.fieldSkeletonOutsideRows} 개`);
      return p;
    },
  },
  {
    name: "블록 스켈레톤이 다시 들어오지 않는다 — 높이 40 이상 · 폭을 준 Skeleton 은 글 없는 그림 자리(차트 그림)만",
    run() {
      // 허용 — 글이 없는 그림 자리(차트 그리는 자리 높이 200)
      const ALLOW = [
        /features\/vacation-history\/ui\/VacationSections\.tsx:.*h-\[200px\]/,
        /features\/dashboard\/ui\/widgets\/MonthStatsWidget\.tsx:.*h-\[200px\]/,
        // groo-design #266(skeleton.md "예외 — 달력 보기는 격자째 기다립니다") — 년 보기는 달 이름 · 요일 · 날짜까지 열두 달 상자째
        // 기다린다. 틀만 그리고 칸을 비우면 "일정 없음" 으로 읽힌다. 상자는 px 라 큰 글자에서도 그대로다
        /features\/calendar\/ui\/year-view\/calendar-year-view-skeleton\.tsx:.*h-\[200px\]/,
      ];
      const BLOCK = /<Skeleton\b[^>]*className=['"][^'"]*\bh-\[(\d+)px\][^'"]*['"][^>]*>/g;
      const bad = [];
      for (const dir of ["src/app", "src/pages", "src/widgets", "src/features", "src/shared/ui"])
        for (const f of walk(join(ROOT, dir)))
          readFileSync(f, "utf8").split("\n").forEach((line, i) => {
            for (const m of line.matchAll(BLOCK)) {
              if (Number(m[1]) < 40) continue;
              const at = `${relative(ROOT, f)}:${i + 1} ${m[0]}`;
              if (!ALLOW.some((re) => re.test(at))) bad.push(at);
            }
          });
      return bad;
    },
  },
  {
    name: "달력 격자 스켈레톤(groo-design #266) — 칸 안 날짜 · 요일 자리는 -static · px, 달력 위 머리는 스켈레톤 밖에서 실제로 그린다",
    run() {
      const bad = [];
      const read = (f) => strip(readFileSync(join(ROOT, f), "utf8"));
      // 격자 스켈레톤 — 글 자리는 `tN-static`(rem 줄 높이 `tN` 이면 큰 글자에서 칸 안 자리가 커진다), 머리 부품은 들이지 않는다
      const GRID = [
        "src/features/calendar/ui/month-view/month-skeleton-desktop.tsx",
        "src/features/calendar/ui/month-view/month-skeleton-phone.tsx",
        "src/features/calendar/ui/week-and-day-view/calendar-week-view-skeleton.tsx",
        "src/features/calendar/ui/year-view/calendar-year-view-skeleton.tsx",
      ];
      const missing = read("src/features/dashboard/ui/widgets/MissingWorkHistoryWidget.tsx");
      const parts = GRID.map((f) => [f, read(f)]);
      parts.push(["MissingWorkHistoryWidget.tsx MissingSkeleton", missing.slice(missing.indexOf("const MissingSkeleton"))]);
      for (const [f, src] of parts) {
        for (const m of src.matchAll(/<Skeleton\b[^>]*\btext=['"](t\d+[^'"]*)['"]/g)) if (!m[1].endsWith("-static")) bad.push(`${f} text="${m[1]}" — 칸 안 자리는 -static`);
        for (const m of src.matchAll(REM_ARBITRARY)) bad.push(`${f} ${m[0]} — 칸 안 자리는 px`);
        if (/calendar-toolbar|CalendarToolbar/.test(src)) bad.push(`${f} — 달력 머리를 스켈레톤 안에 들였다`);
      }
      // 머리(달 이름 단추 · 이전 · 다음 · 보기 고르기)는 기다리는 갈래 앞에서 늘 그린다
      const desk = read("src/features/calendar/ui/CalendarDesktop.tsx");
      if (!/\{toolbar\}\s*\{isLoading \?/.test(desk)) bad.push("CalendarDesktop.tsx — 월 보기 머리({toolbar})가 기다리는 갈래 앞에 없다");
      if (!/\{toolbar\}\s*<div className='min-h-0 flex-1'>/.test(desk)) bad.push("CalendarDesktop.tsx — 주 · 년 보기 머리({toolbar})가 몸 앞에 없다");
      const phone = read("src/features/calendar/ui/CalendarPhone.tsx");
      if (!/<CalendarToolbar desktop=\{false\}[^>]*\/>[\s\S]*?\{isLoading \?/.test(phone)) bad.push("CalendarPhone.tsx — 머리가 기다리는 갈래 앞에 없다");
      const head = missing.slice(0, missing.indexOf("<WidgetBoundary"));
      if (!/<Button\b/.test(head)) bad.push("MissingWorkHistoryWidget.tsx — 이전 · 다음 달 단추가 기다림 경계 앞에 없다");
      return bad;
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
