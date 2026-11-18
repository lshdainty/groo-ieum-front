#!/usr/bin/env node
/**
 * 320 보다 좁은 화면(페이지 확대 — groo-design Layout "지원 폭", #236 · #243)과 Field 머리 줄을 크로미움에서 확인한다 — groo-damda-front
 * #608(Segmented Control · Chart 도넛 · Date Picker 이어지는 달)과 6b0b923f(#623 판 Field 머리)의 담다 시험(vitest · jsdom)을 이 레포에
 * 맞게 옮긴 것이다. jsdom 은 레이아웃이 없어 담다 시험은 클래스 · 흉내 낸 폭을 보지만, 여기서는 실제 창 폭으로 그려 잰다.
 *
 * 이 레포에는 단위 테스트 러너가 없어 check-overlay 처럼 개발 서버와 Playwright 로 돈다. 무대는 scripts/check-narrow/harness.tsx
 * (개발 서버만 그린다 — 운영 빌드에 들어가지 않는다). 실기기(사파리 200% 확대)의 그림은 여기서 볼 수 없다(QA 몫).
 *
 * 사용: node scripts/check-narrow.mjs [이름 일부 — 그 시험만]
 * Playwright 의 Chromium 이 필요하다 — 처음 한 번 `npx playwright install chromium`.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createServer } from "vite";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HARNESS = "/scripts/check-narrow/harness.html";
const HEIGHT = 714;

const server = await createServer({ root: ROOT, logLevel: "error", server: { port: 0 } });
await server.listen();
const base = server.resolvedUrls.local[0].replace(/\/$/, "");
const browser = await chromium.launch();

async function open(scene, { width = 390, query = "" } = {}) {
  const ctx = await browser.newContext({ locale: "ko-KR", viewport: { width, height: HEIGHT } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}${HARNESS}?scene=${scene}${query}`);
  await page.locator("#root > *").first().waitFor();
  await page.waitForTimeout(150);
  return { ctx, page, errors };
}

// 페이지가 가로로 넘치는가 — 320 미만에서도 화면 전체 가로 스크롤은 없어야 한다(Reflow)
const pageOverflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

// Segmented 칸 글 — 낱말(띄어쓰기로 가른 덩어리)이 한 줄 안에 있는가. 낱말 사이에서 꺾이는 것은 괜찮다
const segmentedOf = (page, scope = "body") =>
  page.evaluate((scopeSel) => {
    const tracks = [...document.querySelectorAll(`${scopeSel} [data-slot=segmented-control]`)];
    return tracks.map((track) => {
      const brokenWords = [];
      for (const label of track.querySelectorAll("[data-slot=segmented-control-label]")) {
        const node = [...label.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
        if (!node) continue;
        const text = node.textContent;
        let at = 0;
        for (const word of text.split(" ")) {
          const start = text.indexOf(word, at);
          at = start + word.length;
          if (!word) continue;
          const range = document.createRange();
          range.setStart(node, start);
          range.setEnd(node, start + word.length);
          const tops = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)));
          if (tops.size > 1) brokenWords.push(word);
        }
      }
      const items = [...track.querySelectorAll("[data-slot=segmented-control-item]")];
      const checked = items.find((el) => el.getAttribute("data-state") === "checked");
      return {
        narrow: track.getAttribute("data-narrow"),
        overflowX: getComputedStyle(track).overflowX,
        scrolls: track.scrollWidth > track.clientWidth,
        clipped: track.scrollWidth > track.clientWidth && getComputedStyle(track).overflowX !== "auto",
        pillHidden: track.querySelector("[data-slot=segmented-control-indicator]")?.hidden ?? null,
        labelWrap: getComputedStyle(track.querySelector("[data-slot=segmented-control-label]")).overflowWrap,
        checkedBg: checked ? getComputedStyle(checked).backgroundColor : null,
        brokenWords,
      };
    });
  }, scope);

const TRANSPARENT = "rgba(0, 0, 0, 0)";
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const expectEq = (p, what, got, want) => {
  if (!same(got, want)) p.push(`${what}: ${JSON.stringify(got)} ≠ ${JSON.stringify(want)}`);
};

// 도넛 — 차트 상자 높이 · 맞춤 표시 · 그려진 조각의 바깥 반지름(조각 경로의 첫 호 A rx) · svg 폭
const donutOf = (page, scope = "body") =>
  page.evaluate((scopeSel) => {
    const box = document.querySelector(`${scopeSel} [data-slot=chart]`);
    const d = box?.querySelector(".recharts-pie-sector path")?.getAttribute("d") ?? "";
    const arc = /A\s*([\d.]+)/.exec(d);
    const svg = box?.querySelector("svg.recharts-surface");
    return {
      fit: box?.hasAttribute("data-donut-fit") ?? null,
      height: box?.style.height ?? "",
      outer: arc ? Number(arc[1]) : null,
      boxWidth: box?.getBoundingClientRect().width ?? 0,
      svgWidth: svg?.getBoundingClientRect().width ?? 0,
      svgRight: svg?.getBoundingClientRect().right ?? 0,
      boxRight: box?.getBoundingClientRect().right ?? 0,
    };
  }, scope);

const setSlot = async (page, width) => {
  await page.evaluate((w) => {
    document.querySelector("[data-check=slot]").style.width = `${w}px`;
  }, width);
  await page.waitForTimeout(250);
};

const cases = [
  // ── Segmented Control(담다 segmented-control.test "320 보다 좁은 화면") ──
  ...[320, 360].map((width) => ({
    name: `Segmented ${width} — 그대로다(낱말 단위 줄바꿈 · 미끄러지는 알약 · 좁은 표시 없음)`,
    async run() {
      const { ctx, page, errors } = await open("segmented", { width });
      const [s] = await segmentedOf(page);
      await ctx.close();
      const p = [...errors];
      if (s.narrow != null) p.push(`data-narrow=${s.narrow}`);
      if (s.pillHidden !== false) p.push("알약이 숨었다");
      if (s.labelWrap !== "break-word") p.push(`overflow-wrap ${s.labelWrap}`);
      if (s.overflowX === "auto") p.push("가로 스크롤 칸이 됐다");
      return p;
    },
  })),
  ...[200, 160].map((width) => ({
    name: `Segmented ${width} — 낱말 안에서 꺾지 않고 줄 전체를 가로로 스크롤한다 · 고른 칸이 알약을 칠한다`,
    async run() {
      const { ctx, page, errors } = await open("segmented", { width });
      const [s] = await segmentedOf(page);
      const overflow = await pageOverflow(page);
      await page.getByRole("radio", { name: "전체" }).click();
      const picked = await page.getByRole("radio", { name: "전체" }).getAttribute("aria-checked");
      await ctx.close();
      const p = [...errors];
      if (s.narrow !== "true") p.push(`data-narrow=${s.narrow}`);
      if (s.overflowX !== "auto") p.push(`트랙 overflow-x ${s.overflowX}`);
      if (s.labelWrap !== "normal") p.push(`overflow-wrap ${s.labelWrap}`);
      if (s.brokenWords.length) p.push(`낱말 안에서 꺾임: ${s.brokenWords.join(", ")}`);
      if (s.pillHidden !== true) p.push("미끄러지는 알약이 보인다");
      if (!s.checkedBg || s.checkedBg === TRANSPARENT) p.push("고른 칸에 바탕이 없다");
      if (overflow > 0) p.push(`페이지가 가로로 ${overflow} 넘친다`);
      if (picked !== "true") p.push("좁은 화면에서 고르기가 안 된다");
      return p;
    },
  })),

  // ── Chart 도넛(담다 chart.test "도넛이 자리보다 클 때") ──
  {
    name: "도넛 — 자리가 지름 이상(312 · 180)이면 준 값 그대로, 좁으면(153) 자리 폭에 맞춰 지름 · 두께 · 상자 높이를 줄이고, 넓어지면 돌아간다",
    async run() {
      const { ctx, page, errors } = await open("donut");
      const p = [...errors];
      for (const width of [312, 180]) {
        await setSlot(page, width);
        const d = await donutOf(page);
        if (d.fit) p.push(`${width}: 맞춤이 켜졌다`);
        if (d.height !== "180px") p.push(`${width}: 상자 높이 ${d.height}`);
        if (d.outer !== 90) p.push(`${width}: 바깥 반지름 ${d.outer}`);
      }
      await setSlot(page, 153.6);
      const fitted = await donutOf(page);
      if (!fitted.fit) p.push("153: 맞춤이 안 켜졌다");
      if (fitted.height !== "153px") p.push(`153: 상자 높이 ${fitted.height}`);
      if (fitted.outer !== 76.5) p.push(`153: 바깥 반지름 ${fitted.outer}`);
      if (fitted.svgRight > fitted.boxRight + 0.5) p.push("153: 도넛이 자리 밖으로 나간다");
      // 두께 = 지름 ÷ 10 + 6 → 153 이면 21. 안쪽 반지름은 경로의 두 번째 호
      const innerArc = await page.evaluate(() => {
        const d = document.querySelector(".recharts-pie-sector path")?.getAttribute("d") ?? "";
        const arcs = [...d.matchAll(/A\s*([\d.]+)/g)].map((m) => Number(m[1]));
        return arcs[1] ?? null;
      });
      if (innerArc !== 76.5 - 21) p.push(`153: 안쪽 반지름 ${innerArc}`);
      await setSlot(page, 312);
      const back = await donutOf(page);
      if (back.fit || back.height !== "180px" || back.outer !== 90) p.push(`다시 넓혀도 안 돌아왔다(${back.height} · ${back.outer})`);
      await ctx.close();
      return p;
    },
  },

  // ── Date Picker 이어지는 달(담다 date-picker.test "달은 요일 줄 + 2주보다 낮아지지 않는다") ──
  {
    name: "이어지는 달 — 칸이 낮아도 요일 줄 + 2주에서 멈추고 넘친 만큼은 바깥(시트 본문)이 스크롤한다",
    async run() {
      const { ctx, page, errors } = await open("continuous", { width: 300, query: "&h=120" });
      await page.locator("[data-slot=date-picker-scroll]").waitFor();
      const m = await page.evaluate(() => {
        const scroll = document.querySelector("[data-slot=date-picker-scroll]");
        const box = document.querySelector("[data-check=box]");
        return {
          height: scroll.getBoundingClientRect().height,
          minHeight: parseFloat(getComputedStyle(scroll).minHeight) || 0,
          boxScrolls: box.scrollHeight > box.clientHeight,
        };
      });
      await ctx.close();
      const p = [...errors];
      if (m.minHeight < 144) p.push(`최소 높이 ${m.minHeight} — 요일 줄 + 2주(144 이상)가 아니다`);
      if (m.height + 0.5 < m.minHeight) p.push(`달 높이 ${m.height} < 최소 ${m.minHeight}`);
      if (m.height < 144) p.push(`달이 ${m.height} 로 눌렸다`);
      if (!m.boxScrolls) p.push("바깥 칸이 스크롤하지 않는다");
      return p;
    },
  },

  // ── Field 머리(담다 field.test "머리는 줄바꿈하고 라벨이 반 폭 이상 쥔다") ──
  ...[300, 200].map((width) => ({
    name: `Field 머리 ${width} — 보조 글이 길어도 라벨이 반 폭 이상 쥔다`,
    async run() {
      const { ctx, page, errors } = await open("field", { width });
      const m = await page.evaluate(() => {
        const header = document.querySelector("[data-slot=field-header]");
        const first = header.firstElementChild;
        const cs = getComputedStyle(header);
        const content = header.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        return { label: first.getBoundingClientRect().width, content, overflow: header.scrollWidth - header.clientWidth };
      });
      await ctx.close();
      const p = [...errors];
      if (m.label + 0.5 < m.content / 2) p.push(`라벨 ${m.label.toFixed(1)} < 반 폭 ${(m.content / 2).toFixed(1)}`);
      if (m.overflow > 0) p.push(`머리가 ${m.overflow} 넘친다`);
      return p;
    },
  })),

  // ── 이음 화면 — 같은 ds 를 쓰는 곳(달력 도구 줄 · 부여 시간 칸 · 휴가 유형 도넛) ──
  ...[360, 300, 200].map((width) => ({
    name: `이음 화면 ${width} — 페이지가 가로로 넘치지 않고, Segmented 는 잘리지 않으며, 도넛은 카드 안에 든다`,
    async run() {
      const { ctx, page, errors } = await open("screens", { width });
      await page.waitForTimeout(300);
      const overflow = await pageOverflow(page);
      const tracks = await segmentedOf(page);
      const donut = await donutOf(page, "[data-check=donut-card]");
      await ctx.close();
      const p = [...errors];
      if (overflow > 0) p.push(`페이지가 가로로 ${overflow} 넘친다`);
      tracks.forEach((s, i) => {
        if (s.clipped) p.push(`Segmented ${i + 1} 이 잘린다`);
        if (s.brokenWords.length) p.push(`Segmented ${i + 1} 낱말 안에서 꺾임: ${s.brokenWords.join(", ")}`);
        if (width >= 320 && s.narrow != null) p.push(`Segmented ${i + 1} 이 320 이상에서 좁은 모양`);
      });
      if (tracks.length < 2) p.push(`Segmented ${tracks.length} 개만 그려졌다`);
      if (donut.svgRight > donut.boxRight + 0.5) p.push("도넛이 자리 밖으로 나간다");
      return p;
    },
  })),

  // ── 날짜 고르기 요일 줄 — 영어는 두 글자 Su ~ Sa, 칸에 들지 않을 때만 한 글자 S ~ S, 줄을 바꾸지 않는다(groo-design #250 · 담다 #641) ──
  ...[
    { lang: "en", width: 390, font: 1, want: "two" },
    { lang: "en", width: 320, font: 2, want: "fit" },
    { lang: "en", width: 320, font: 3, want: "narrow" },
    { lang: "ko", width: 320, font: 2, want: "ko" },
  ].map(({ lang, width, font, want }) => ({
    name: `요일 ${lang} ${width} · ${font * 100}% — ${{ two: "Su ~ Sa", fit: "칸에 들면 Su ~ Sa · 안 들면 S ~ S", narrow: "S ~ S", ko: "일 ~ 토" }[want]} 한 줄, 칸 안`,
    async run() {
      const { ctx, page, errors } = await open("weekday", { width, query: `&lang=${lang}&font=${font}` });
      await page.locator("[data-slot=date-picker-weekday]").first().waitFor();
      await page.waitForTimeout(300);
      const m = await page.evaluate(() => {
        const cells = [...document.querySelectorAll("[data-slot=date-picker-weekdays] [data-slot=date-picker-weekday]")];
        return cells.map((cell) => {
          const label = cell.querySelector(":scope > span:first-child");
          const r = label.getBoundingClientRect();
          const c = cell.getBoundingClientRect();
          const lh = parseFloat(getComputedStyle(label).lineHeight) || r.height;
          return { text: label.textContent, lines: Math.round(r.height / lh), inside: r.left >= c.left - 0.5 && r.right <= c.right + 0.5, labelWidth: r.width, cellWidth: c.width };
        });
      });
      await ctx.close();
      const p = [...errors];
      const texts = m.map((x) => x.text);
      const TWO = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
      const NARROW = ["S", "M", "T", "W", "T", "F", "S"];
      const KO = ["일", "월", "화", "수", "목", "금", "토"];
      if (want === "two") expectEq(p, "요일", texts, TWO);
      if (want === "narrow") expectEq(p, "요일", texts, NARROW);
      if (want === "ko") expectEq(p, "요일", texts, KO);
      if (want === "fit" && !same(texts, TWO) && !same(texts, NARROW)) p.push(`요일 ${texts.join(" ")}`);
      for (const x of m) {
        if (x.lines > 1) p.push(`"${x.text}" 가 ${x.lines} 줄`);
        if (!x.inside) p.push(`"${x.text}" 가 칸(${x.cellWidth.toFixed(1)}) 밖으로 나간다(${x.labelWidth.toFixed(1)})`);
      }
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
