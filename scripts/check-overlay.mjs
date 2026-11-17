#!/usr/bin/env node
/**
 * 시트 · 딤 · 스낵바 · 히스토리 · 오류 경계를 크로미움에서 확인한다 — groo-damda-front 에서 들인 겹침 수정(#621 · #623 · #626 ·
 * #627 · #628 · #630)의 담다 시험(vitest · jsdom)을 이 레포에 맞게 옮긴 것이다.
 *
 * 이 레포에는 단위 테스트 러너가 없어 check-auth-callback 처럼 개발 서버와 Playwright 로 실제 화면을 돈다. 무대는
 * scripts/check-overlay/harness.tsx(개발 서버만 그린다 — 운영 빌드에 들어가지 않는다). 키보드는 크로미움에 없으므로
 * window.visualViewport 를 가짜로 바꿔 끼워 보이는 영역 크기를 준다(담다 시험과 같은 방식, 레이아웃 714).
 * 실기기(iPhone Safari 26)의 그림 — 띠가 실제로 딤 색인지, 도구줄 위에 버튼이 서는지 — 는 여기서 볼 수 없다(QA 몫).
 *
 * 사용: node scripts/check-overlay.mjs [이름 일부 — 그 시험만]
 * Playwright 의 Chromium 이 필요하다 — 처음 한 번 `npx playwright install chromium`.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createServer } from "vite";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HARNESS = "/scripts/check-overlay/harness.html";
const LAYOUT = 714;
const IOS26 =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1";
const IOS26_CHROME =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.96 Mobile/15E148 Safari/604.1";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";

// 키보드 흉내 — 보이는 영역(visualViewport)을 가짜로 바꿔 끼운다. __vv(높이, 밀림)로 키보드를 올리고 내린다
function fakeVisualViewport(layout) {
  const vv = new EventTarget();
  Object.assign(vv, { scale: 1, offsetTop: 0, offsetLeft: 0, pageTop: 0, pageLeft: 0, width: 390, height: layout });
  Object.defineProperty(window, "visualViewport", { configurable: true, get: () => vv });
  window.__vv = (height, offsetTop = 0, scale = 1) => {
    Object.assign(vv, { height, offsetTop, scale });
    vv.dispatchEvent(new Event("resize"));
  };
}

const server = await createServer({ root: ROOT, logLevel: "error", server: { port: 0 } });
await server.listen();
const base = server.resolvedUrls.local[0].replace(/\/$/, "");
const browser = await chromium.launch();

async function open(scene, { ua, width = 390 } = {}) {
  const ctx = await browser.newContext({ locale: "ko-KR", viewport: { width, height: LAYOUT }, ...(ua ? { userAgent: ua } : {}) });
  await ctx.addInitScript(fakeVisualViewport, LAYOUT);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}${HARNESS}?scene=${scene}`);
  return { ctx, page, errors };
}

async function openSheet(page) {
  await page.locator("[data-check=open]").click();
  await page.locator("[data-slot=bottom-sheet-close]").waitFor();
  // 올라오는 모션이 끝날 때까지
  await page.waitForTimeout(400);
}

const sheetSurface = (page) =>
  page.evaluate(() => {
    const el = document.querySelector("[role=dialog]");
    return { bottom: el?.style.bottom ?? "", maxHeight: el?.style.maxHeight ?? "" };
  });

// ── 딤이 열린 동안 body 바탕(src/index.css — 담다 #630) ──
// 계산된 html · body 바탕색과, 같은 자리에서 푼 토큰 값(body 원래 바탕 · 딤 라이트 · 딤 다크)
const bgColors = (page) =>
  page.evaluate(() => {
    const probe = (value) => {
      const el = document.createElement("i");
      el.style.backgroundColor = value;
      document.body.appendChild(el);
      const got = getComputedStyle(el).backgroundColor;
      el.remove();
      return got;
    };
    return {
      html: getComputedStyle(document.documentElement).backgroundColor,
      body: getComputedStyle(document.body).backgroundColor,
      basement: probe("var(--color-bg-layer-basement)"),
      dimLight: probe("var(--overlay-dim-light)"),
      dimDark: probe("var(--overlay-dim-dark)"),
    };
  });
const TRANSPARENT = "rgba(0, 0, 0, 0)";
// 딤이 걸렸는지 — html 은 body 원래 바탕, body 는 그 판의 딤 토큰
const dimmedOf = (c, dark = false) => c.html === c.basement && c.body === (dark ? c.dimDark : c.dimLight);
// 걸리지 않았는지 — html 은 바탕 없음(body 바탕이 캔버스로 번진다), body 는 원래 바탕
const plainOf = (c) => c.html === TRANSPARENT && c.body === c.basement;
const setDim = async (page, next, wait = 0) => {
  await page.evaluate((n) => window.__check.dim(n), next);
  await page.waitForTimeout(wait);
};
const setDark = (page, on) =>
  page.evaluate((v) => {
    document.documentElement.classList.toggle("dark", v);
    if (v) document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
  }, on);
// 이 규칙을 끈 모습(열린 표면은 그대로) — 규칙 전의 html · body 바탕
const RULE_OFF =
  "html { background-color: transparent !important } body { background-color: var(--color-bg-layer-basement) !important }";

// src/index.css 의 딤 바탕 규칙 블록 — `:root:has(` 부터 그 블록이 닫히는 `\n  }` 까지
const indexCss = readFileSync(resolve(ROOT, "src/index.css"), "utf8");
const dimBlock = () => {
  const start = indexCss.indexOf("\n  :root:has(");
  if (start < 0) return null;
  const end = indexCss.indexOf("\n  }\n", start);
  return indexCss.slice(start, end + 4);
};
const cssFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? cssFiles(join(dir, e.name)) : e.name.endsWith(".css") ? [join(dir, e.name)] : [],
  );
const codeFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? codeFiles(join(dir, e.name))
      : /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)
        ? [join(dir, e.name)]
        : [],
  );
// 딤 표면 — [이름, 여는 값, 딤 slot]
const DIM_SURFACES = [
  ["시트", { sheet: true }, "bottom-sheet-overlay"],
  ["Menu Sheet", { menu: true }, "bottom-sheet-overlay"],
  ["대화상자", { dialog: true }, "dialog-overlay"],
  ["확인창", { ask: true }, "alert-dialog-overlay"],
  ["사이드 패널(폰 주 메뉴 서랍)", { panel: true }, "side-panel-overlay"],
];

const cases = [
  {
    name: "UA 판정 — iPhone 사파리 26 이상만 56, 18 · iPhone 크롬 · 맥 사파리 · 안드로이드 · 데스크톱은 0",
    async run() {
      const { ctx, page } = await open("sheet");
      const got = await page.evaluate(
        ([ios26, ios26chrome, android]) => {
          const r = window.__check.keyboardToolbarReserve;
          return [
            r(ios26),
            r(ios26.replace("Version/26.0", "Version/27.2")),
            r(ios26.replace("Version/26.0", "Version/18.6")),
            r(ios26chrome),
            r("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15"),
            r(android),
            r(),
          ];
        },
        [IOS26, IOS26_CHROME, ANDROID_CHROME],
      );
      await ctx.close();
      const want = [56, 56, 0, 0, 0, 0, 0];
      return JSON.stringify(got) === JSON.stringify(want) ? [] : [`${JSON.stringify(got)} ≠ ${JSON.stringify(want)}`];
    },
  },
  {
    name: "딤 — 화면 위아래로 한 화면씩 넘치고(inset-0 없음) 키보드가 떠도 그대로, 띠 덮개(keyboard-band)를 만들지 않는다",
    async run() {
      const { ctx, page } = await open("sheet", { ua: IOS26 });
      const childrenBefore = await page.evaluate(() => document.body.children.length);
      await openSheet(page);
      const read = () =>
        page.evaluate(() => {
          const dim = [...document.querySelectorAll("div")].find((d) => d.className.includes("-top-[100lvh]"));
          if (!dim) return null;
          const r = dim.getBoundingClientRect();
          const hit = document.elementFromPoint(2, 2);
          return {
            cls: dim.className,
            top: Math.round(r.top),
            bottom: Math.round(r.bottom),
            inline: dim.style.top + dim.style.bottom + dim.style.height,
            cornerIsDim: hit === dim,
            bodyChildren: document.body.children.length,
          };
        });
      const before = await read();
      await page.evaluate(() => window.__vv(484, 0));
      await page.waitForTimeout(100);
      const during = await read();
      await page.evaluate((h) => window.__vv(h, 0), LAYOUT);
      await page.waitForTimeout(100);
      const after = await read();
      await ctx.close();
      const p = [];
      if (!before) return ["딤에 넘침 범위 클래스가 없다"];
      if (/(^|\s)inset-0(\s|$)/.test(before.cls)) p.push("딤에 inset-0 이 남았다");
      if (before.top !== -LAYOUT || before.bottom !== LAYOUT * 2) p.push(`딤 범위 ${before.top}~${before.bottom}`);
      if (!before.cornerIsDim) p.push("화면 귀퉁이를 누르면 딤이 아니다");
      if (before.inline) p.push(`딤에 인라인 자리가 박혔다(${before.inline})`);
      if (JSON.stringify(before) !== JSON.stringify(during) || JSON.stringify(before) !== JSON.stringify(after))
        p.push("키보드가 뜨고 내릴 때 딤이 바뀌었다");
      if (during && during.bodyChildren !== before.bodyChildren) p.push("키보드가 뜨자 body 에 덮개가 생겼다");
      if (before.bodyChildren < childrenBefore) p.push("body 자식 수가 이상하다");
      return p;
    },
  },
  ...[
    { state: "(A) 알약 · 도구줄 뜸", visual: 384, top: 274 },
    { state: "(B) 알약 없음 · 도구줄이 보이는 영역 안", visual: 484, top: 0 },
  ].flatMap(({ state, visual, top }) => [
    {
      name: `iPhone 사파리 26 ${state} — 시트 아래 변 = 보이는 영역 아래 끝 + 56, 높이 상한 = (보이는 높이 − 56) × 0.9`,
      async run() {
        const { ctx, page } = await open("sheet", { ua: IOS26 });
        await openSheet(page);
        await page.evaluate(([v, t]) => window.__vv(v, t), [visual, top]);
        await page.waitForTimeout(100);
        const got = await sheetSurface(page);
        await page.evaluate((h) => window.__vv(h, 0), LAYOUT);
        await page.waitForTimeout(100);
        const gone = await sheetSurface(page);
        await ctx.close();
        const want = { bottom: `${LAYOUT - (top + visual) + 56}px`, maxHeight: `${Math.floor((visual - 56) * 0.9)}px` };
        const p = [];
        if (JSON.stringify(got) !== JSON.stringify(want)) p.push(`${JSON.stringify(got)} ≠ ${JSON.stringify(want)}`);
        if (gone.bottom || gone.maxHeight) p.push(`키보드를 내려도 남았다 ${JSON.stringify(gone)}`);
        return p;
      },
    },
    ...[
      ["iPhone 크롬", IOS26_CHROME],
      ["안드로이드 크롬", ANDROID_CHROME],
    ].map(([browserName, ua]) => ({
      name: `${browserName} ${state} — 56 을 붙이지 않는다`,
      async run() {
        const { ctx, page } = await open("sheet", { ua });
        await openSheet(page);
        await page.evaluate(([v, t]) => window.__vv(v, t), [visual, top]);
        await page.waitForTimeout(100);
        const got = await sheetSurface(page);
        await ctx.close();
        const want = { bottom: `${LAYOUT - (top + visual)}px`, maxHeight: `${Math.floor(visual * 0.9)}px` };
        return JSON.stringify(got) === JSON.stringify(want) ? [] : [`${JSON.stringify(got)} ≠ ${JSON.stringify(want)}`];
      },
    })),
  ]),
  {
    name: "body 딤 선언 — html 은 body 원래 바탕 토큰, body 는 딤 토큰(라이트 · 다크) 그대로, 색을 새로 만들지 않는다",
    async run() {
      const block = dimBlock();
      if (!block) return ["src/index.css 에 :root:has( 규칙이 없다"];
      const p = [];
      const decls = [...block.matchAll(/([a-z-]+)\s*:\s*([^;{}]+);/g)].map((m) => `${m[1]}: ${m[2].trim()}`);
      const want = [
        "background-color: var(--color-bg-layer-basement)",
        "background-color: var(--overlay-dim-light)",
        "background-color: var(--overlay-dim-dark)",
      ];
      if (JSON.stringify(decls) !== JSON.stringify(want)) p.push(`선언 ${JSON.stringify(decls)}`);
      // Safari 는 띠에 background-image 를 그리지 않는다(QA 실기기) — 바탕색만 쓴다
      if (/background-image|gradient|#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|color-mix/i.test(block)) p.push("색 리터럴 · 그림 바탕이 있다");
      // 다크 조건은 딤의 dark: 와 같은 .dark(문서 루트) — 이음 변형은 :where(.dark, .dark *)
      if (!indexCss.includes("@custom-variant dark (&:where(.dark, .dark *));")) p.push("이음 dark 변형이 바뀌었다");
      if (!block.includes("& > body:is(.dark, .dark *)")) p.push("다크 규칙의 조건이 딤과 다르다");
      return p;
    },
  },
  {
    name: "html 바탕 조건 — body 원래 바탕은 bg-layer-basement 한 토큰이고, 다른 CSS · 스크립트가 html · body 바탕을 바꾸지 않는다",
    async run() {
      const p = [];
      if (!/\n {2}body \{\s*@apply bg-bg-layer-basement text-fg-neutral;\s*\}/.test(indexCss)) p.push("body 원래 바탕이 bg-layer-basement 가 아니다");
      // 토큰은 라이트(@theme) · 다크([data-theme=dark], .dark) 두 곳에서만 정한다 — html · body 가 같은 값을 받는다
      const defs = cssFiles(resolve(ROOT, "src")).flatMap((f) =>
        [...readFileSync(f, "utf8").matchAll(/--color-bg-layer-basement:\s*([^;]+);/g)].map((m) => m[1]),
      );
      if (JSON.stringify(defs) !== JSON.stringify(["var(--color-gray-200)", "#1a1f2e"])) p.push(`토큰 정의 ${JSON.stringify(defs)}`);
      for (const f of cssFiles(resolve(ROOT, "src"))) {
        const css = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
        for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
          const selector = m[1].trim();
          if (!/(^|[\s,>&])(html|body|:root)\b/.test(selector)) continue;
          if (!/background(-color|-image)?\s*:|@apply[^;]*\bbg-/.test(m[2])) continue;
          // 중첩 규칙은 바깥 블록의 선언 뒤에 이어 읽힌다 — 끝이 `& > body…` 인 것이 이 규칙의 body 부분이다
          const allowed =
            f.endsWith("src/index.css") &&
            (selector === "body" || /(^|;)\s*& > body(:is\(\.dark, \.dark \*\))?$/.test(selector) || selector.startsWith(":root:has("));
          if (!allowed) p.push(`${f.replace(ROOT, "")} ${selector.replace(/\s+/g, " ").slice(0, 60)}`);
        }
      }
      const writers = codeFiles(resolve(ROOT, "src")).filter((f) =>
        /(documentElement|body)\.style\.(background|setProperty\(\s*["']background)/.test(readFileSync(f, "utf8")),
      );
      if (writers.length) p.push(`스크립트가 바탕을 바꾼다 ${writers.join(", ")}`);
      // 실제 화면 — 닫힌 동안 html 은 바탕 없음 · body 는 원래 바탕, 열린 동안 html 은 그 원래 바탕(라이트 · 다크)
      const { ctx, page } = await open("dim");
      for (const dark of [false, true]) {
        await setDark(page, dark);
        const closed = await bgColors(page);
        await setDim(page, { sheet: true }, 400);
        const opened = await bgColors(page);
        await setDim(page, { sheet: false }, 400);
        const mode = dark ? "다크" : "라이트";
        if (!plainOf(closed)) p.push(`${mode} 닫힘 ${JSON.stringify(closed)}`);
        if (opened.html !== closed.body) p.push(`${mode} 열린 html ${opened.html} ≠ body 원래 ${closed.body}`);
      }
      await ctx.close();
      return p;
    },
  },
  ...DIM_SURFACES.map(([label, openState, slot]) => ({
    name: `body 딤 — ${label}: 열면 걸고, 닫힘이 시작되면(data-state=closed) 바로 걷는다`,
    async run() {
      const { ctx, page } = await open("dim");
      const p = [];
      if (!plainOf(await bgColors(page))) p.push("아무것도 안 열었는데 걸렸다");
      await setDim(page, openState, 50);
      const parent = await page.evaluate((s) => document.querySelector(`[data-slot=${s}]`)?.parentElement === document.body, slot);
      if (!parent) p.push("딤이 body 바로 아래가 아니다");
      if (!dimmedOf(await bgColors(page))) p.push("열었는데 걸리지 않았다");
      const off = Object.fromEntries(Object.keys(openState).map((k) => [k, false]));
      await setDim(page, off);
      const state = await page.evaluate((s) => document.querySelector(`[data-slot=${s}]`)?.dataset.state ?? "gone", slot);
      const closing = await bgColors(page);
      await page.waitForTimeout(500);
      const gone = await bgColors(page);
      await ctx.close();
      if (state !== "closed") p.push(`닫히는 딤을 못 봤다(${state})`);
      if (!plainOf(closing)) p.push(`닫히는 동안 남았다 ${JSON.stringify(closing)}`);
      if (!plainOf(gone)) p.push(`닫힌 뒤 남았다 ${JSON.stringify(gone)}`);
      return p;
    },
  })),
  {
    name: "body 딤 — 겹친 표면(시트 위 확인창 · 시트 위 시트)은 위 표면이 닫혀도 남고, 마지막 표면이 닫힐 때 걷는다",
    async run() {
      const { ctx, page } = await open("dim");
      const p = [];
      await setDim(page, { sheet: true, ask: true }, 400);
      if (!dimmedOf(await bgColors(page))) p.push("시트 + 확인창에 걸리지 않았다");
      await setDim(page, { ask: false });
      if (!dimmedOf(await bgColors(page))) p.push("확인창이 닫히기 시작하자 걷혔다");
      await page.waitForTimeout(400);
      if (!dimmedOf(await bgColors(page))) p.push("확인창이 닫힌 뒤 걷혔다(시트가 열려 있다)");
      await setDim(page, { inner: true }, 400);
      const twoSheets = await page.locator("[data-slot=bottom-sheet-overlay]").count();
      await setDim(page, { inner: false }, 500);
      if (twoSheets !== 2) p.push(`시트 위 시트 딤 ${twoSheets}개`);
      if (!dimmedOf(await bgColors(page))) p.push("위 시트가 닫히자 걷혔다");
      await setDim(page, { sheet: false });
      if (!plainOf(await bgColors(page))) p.push("마지막 시트가 닫혀도 남았다");
      await ctx.close();
      return p;
    },
  },
  {
    name: "body 딤 — 다크는 다크 딤 토큰, 라이트로 바꾸면 라이트 딤",
    async run() {
      const { ctx, page } = await open("dim");
      await setDark(page, true);
      await setDim(page, { dialog: true }, 300);
      const dark = await bgColors(page);
      await setDark(page, false);
      const light = await bgColors(page);
      await ctx.close();
      const p = [];
      if (!dimmedOf(dark, true)) p.push(`다크 ${JSON.stringify(dark)}`);
      if (dark.dimDark === dark.dimLight) p.push("다크 딤과 라이트 딤이 같다");
      if (!dimmedOf(light)) p.push(`라이트 ${JSON.stringify(light)}`);
      return p;
    },
  },
  {
    name: "body 딤 — 카탈로그 무대 안의 견본(body 바로 아래가 아니다)은 세지 않는다",
    async run() {
      const { ctx, page } = await open("dim");
      await setDim(page, { stage: true }, 300);
      const inStage = await page.evaluate(() => {
        const dim = document.querySelector("[data-slot=bottom-sheet-overlay]");
        return dim?.dataset.state === "open" && dim.parentElement !== document.body;
      });
      const c = await bgColors(page);
      await ctx.close();
      const p = [];
      if (!inStage) p.push("무대 안 견본 딤을 못 찾았다");
      if (!plainOf(c)) p.push(`견본에 걸렸다 ${JSON.stringify(c)}`);
      return p;
    },
  },
  ...[
    ["시트를", { sheet: true }],
    ["서랍을", { panel: true }],
  ].flatMap(([surface, openState]) =>
    [
      ["화면 높이 틀(h-svh)", ""],
      ["화면보다 짧은 틀 — body 상자 밖", "&short"],
    ].flatMap(([frame, query]) =>
    [false, true].map((dark) => ({
      name: `body 딤 — 키보드 없이 ${surface} 연 모습은 규칙을 끈 모습과 픽셀까지 같다(${frame} · ${dark ? "다크" : "라이트"})`,
      async run() {
        const { ctx, page } = await open(`dim${query}`);
        await setDark(page, dark);
        await setDim(page, openState, 600);
        const shot = () => page.screenshot({ caret: "hide", animations: "disabled" });
        const on = await shot();
        const c = await bgColors(page);
        await page.addStyleTag({ content: RULE_OFF });
        const off = await shot();
        await ctx.close();
        const p = [];
        if (!dimmedOf(c, dark)) p.push(`규칙이 걸리지 않았다 ${JSON.stringify(c)}`);
        if (!on.equals(off)) p.push("규칙을 켜고 끈 모습이 다르다");
        return p;
      },
    })),
  )),
  {
    name: "서랍(Side Panel) 딤 — 시트와 같은 범위로 화면 위아래로 한 화면씩 넘친다(inset-0 없음)",
    async run() {
      const { ctx, page } = await open("dim");
      await setDim(page, { panel: true }, 400);
      const got = await page.evaluate(() => {
        const dim = document.querySelector("[data-slot=side-panel-overlay]");
        const r = dim?.getBoundingClientRect();
        return dim && { cls: dim.className, top: Math.round(r.top), bottom: Math.round(r.bottom), corner: document.elementFromPoint(385, 2) === dim };
      });
      await ctx.close();
      if (!got) return ["서랍 딤이 없다"];
      const p = [];
      if (/(^|\s)inset-0(\s|$)/.test(got.cls)) p.push("딤에 inset-0 이 남았다");
      if (!got.cls.includes("-top-[100lvh]")) p.push("딤에 넘침 범위 클래스가 없다");
      if (got.top !== -LAYOUT || got.bottom !== LAYOUT * 2) p.push(`딤 범위 ${got.top}~${got.bottom}`);
      if (!got.corner) p.push("서랍 밖 귀퉁이를 누르면 딤이 아니다");
      return p;
    },
  },
  {
    name: "서랍 닫힌 직후 — 나가는 딤 · 패널은 누름을 흘리고 body 막기가 풀리며, 다른 자리 첫 탭은 바로 닿는다",
    async run() {
      const { ctx, page } = await open("dim");
      await setDim(page, { panel: true }, 400);
      const close = await page.locator("[data-slot=side-panel-close]").boundingBox();
      const behind = await page.locator("[data-check=behind]").boundingBox();
      const blockedWhileOpen = await page.evaluate(() => document.body.style.pointerEvents);
      await page.mouse.click(close.x + close.width / 2, close.y + close.height / 2);
      const closing = await page.evaluate(() => {
        const dim = document.querySelector("[data-slot=side-panel-overlay]");
        const panel = document.querySelector("[data-slot=side-panel-content]");
        return {
          dimState: dim?.dataset.state,
          dim: dim && getComputedStyle(dim).pointerEvents,
          panel: panel && getComputedStyle(panel).pointerEvents,
          body: document.body.style.pointerEvents,
        };
      });
      // 다른 자리 — 서랍이 나가는 자리 밑(왼쪽 아래)의 뒤 화면 단추를 곧바로 누른다
      await page.mouse.click(behind.x + 40, behind.y + behind.height / 2);
      const clicks = await page.evaluate(() => window.__check.behindClicks);
      await ctx.close();
      const p = [];
      if (blockedWhileOpen !== "none") p.push(`열린 동안 body 막기가 없다(${blockedWhileOpen})`);
      if (closing.dimState !== "closed") p.push(`닫히는 딤을 못 봤다(${closing.dimState})`);
      if (closing.dim !== "none") p.push(`닫히는 딤 pointer-events ${closing.dim}`);
      if (closing.panel !== "none") p.push(`닫히는 패널 pointer-events ${closing.panel}`);
      if (closing.body === "none") p.push("body 막기가 남았다");
      if (clicks !== 1) p.push(`닫자마자 누른 뒤 화면 단추가 ${clicks}번 눌렸다`);
      return p;
    },
  },
  {
    name: "서랍 닫힌 직후 — 닫은 자리 따닥의 두 번째 탭만 삼키고, 그다음 누름은 통과한다",
    async run() {
      const { ctx, page } = await open("dim");
      await page.evaluate(() => {
        window.__docClicks = 0;
        document.addEventListener("click", (e) => {
          if (e.detail > 0) window.__docClicks += 1;
        });
      });
      await setDim(page, { panel: true }, 400);
      const close = await page.locator("[data-slot=side-panel-close]").boundingBox();
      const x = close.x + close.width / 2;
      const y = close.y + close.height / 2;
      await page.mouse.click(x, y);
      const afterClose = await page.evaluate(() => window.__docClicks);
      await page.mouse.click(x, y); // 따닥의 두 번째 — 삼킨다
      const afterSecond = await page.evaluate(() => window.__docClicks);
      await page.mouse.click(x, y); // 그다음 — 통과
      const afterThird = await page.evaluate(() => window.__docClicks);
      await ctx.close();
      const p = [];
      if (afterSecond !== afterClose) p.push("같은 자리 두 번째 탭이 뒤 화면에 닿았다");
      if (afterThird !== afterSecond + 1) p.push("세 번째 탭까지 삼켰다");
      return p;
    },
  },
  {
    name: "닫힌 직후 — 내려가는 딤 · 시트는 누름을 흘리고 body 막기가 풀리며, 다른 자리 첫 탭은 바로 닿는다",
    async run() {
      const { ctx, page } = await open("sheet", { width: 1280 });
      await openSheet(page);
      const close = await page.locator("[data-slot=bottom-sheet-close]").boundingBox();
      const behind = await page.locator("[data-check=behind]").boundingBox();
      await page.mouse.click(close.x + close.width / 2, close.y + close.height / 2);
      const closing = await page.evaluate(() => {
        const dim = [...document.querySelectorAll("div")].find((d) => d.className.includes("-top-[100lvh]"));
        const sheet = document.querySelector("[role=dialog]");
        return {
          dim: dim && getComputedStyle(dim).pointerEvents,
          dimState: dim?.dataset.state,
          sheet: sheet && getComputedStyle(sheet).pointerEvents,
          body: document.body.style.pointerEvents,
        };
      });
      // 다른 자리(아래 뒤 화면 단추)를 곧바로 누른다
      await page.mouse.click(behind.x + 40, behind.y + behind.height / 2);
      const clicks = await page.evaluate(() => window.__check.behindClicks);
      await ctx.close();
      const p = [];
      if (closing.dimState !== "closed") p.push(`닫히는 딤을 못 봤다(${closing.dimState}) — 모션이 너무 빨리 끝났다`);
      if (closing.dim !== "none") p.push(`닫히는 딤 pointer-events ${closing.dim}`);
      if (closing.sheet && closing.sheet !== "none") p.push(`닫히는 시트 pointer-events ${closing.sheet}`);
      if (closing.body === "none") p.push("body 막기가 남았다");
      if (clicks !== 1) p.push(`닫자마자 누른 뒤 화면 단추가 ${clicks}번 눌렸다`);
      return p;
    },
  },
  {
    name: "닫힌 직후 — 닫은 자리 따닥의 두 번째 탭만 삼키고, 그다음 누름 · 키보드 click 은 통과한다",
    async run() {
      const { ctx, page } = await open("sheet", { width: 1280 });
      await page.evaluate(() => {
        window.__docClicks = 0;
        document.addEventListener("click", (e) => {
          if (e.detail > 0) window.__docClicks += 1;
        });
      });
      await openSheet(page);
      const close = await page.locator("[data-slot=bottom-sheet-close]").boundingBox();
      const x = close.x + close.width / 2;
      const y = close.y + close.height / 2;
      await page.mouse.click(x, y);
      const afterClose = await page.evaluate(() => window.__docClicks);
      await page.mouse.click(x, y); // 따닥의 두 번째 — 삼킨다
      const afterSecond = await page.evaluate(() => window.__docClicks);
      await page.mouse.click(x, y); // 그다음 — 통과
      const afterThird = await page.evaluate(() => window.__docClicks);
      await ctx.close();
      const p = [];
      if (afterSecond !== afterClose) p.push("같은 자리 두 번째 탭이 뒤 화면에 닿았다");
      if (afterThird !== afterSecond + 1) p.push("세 번째 탭까지 삼켰다");
      return p;
    },
  },
  // 담다 app-history.test 와 같은 두 때 — ① 닫은 정리가 되돌림을 예약한 같은 틱(history.go 전) ② history.go 가 걸린 뒤(popstate 전).
  // 두 때 모두 같은 곳으로 두 번 옮기라 한다(아직 화면이 그대로라 탭을 한 번 더 누름) — 한 번만 옮겨야 한다.
  ...[
    ["닫은 같은 틱(되돌림 예약 전)", "microtask"],
    ["history.go 가 걸린 뒤(popstate 전)", "go"],
  ].map(([when, hook]) => ({
    name: `히스토리 — 시트를 [×] 로 닫고 ${when} 옮겨도 옮긴 화면 · 닫은 칸 없음 · 뒤로 가기는 앞 화면 · 두 번 눌러도 한 번`,
    async run() {
      const { ctx, page, errors } = await open("sheet");
      const start = await page.evaluate(() => ({ len: history.length, path: location.pathname }));
      await openSheet(page);
      const opened = await page.evaluate(() => ({ len: history.length, flag: history.state?.grooOverlayBack === true }));
      await page.evaluate((hookName) => {
        let fired = false;
        const move = () => {
          if (fired) return;
          fired = true;
          window.__check.navigate("/b");
          window.__check.navigate("/b");
        };
        if (hookName === "go") {
          const go = history.go.bind(history);
          history.go = (d) => {
            go(d);
            move();
          };
        } else {
          const qm = window.queueMicrotask.bind(window);
          window.queueMicrotask = (cb) => {
            qm(cb);
            move();
          };
        }
        document.querySelector("[data-slot=bottom-sheet-close]").click();
      }, hook);
      await page.waitForTimeout(1500);
      const moved = await page.evaluate(() => ({
        len: history.length,
        path: location.pathname,
        shown: document.querySelector("[data-check=path]")?.textContent,
        flag: history.state?.grooOverlayBack === true,
      }));
      await page.goBack();
      await page.waitForTimeout(300);
      const back = await page.evaluate(() => ({ path: location.pathname, flag: history.state?.grooOverlayBack === true }));
      await ctx.close();
      const p = [];
      if (!opened.flag || opened.len !== start.len + 1) p.push(`열 때 칸을 쌓지 않았다 ${JSON.stringify(opened)}`);
      if (moved.path !== "/b" || moved.shown !== "/b") p.push(`옮긴 화면이 아니다 ${JSON.stringify(moved)}`);
      if (moved.flag) p.push("닫은 시트 칸에 서 있다");
      if (moved.len !== start.len + 1) p.push(`히스토리 길이 ${moved.len}(처음 ${start.len}) — 닫은 칸이 남았거나 두 번 옮겼다`);
      if (back.path !== start.path || back.flag) p.push(`뒤로 가기가 ${JSON.stringify(back)}`);
      if (errors.length) p.push(errors.join(" / "));
      return p;
    },
  })),
  {
    name: "히스토리 — 닫고 머문 뒤 앞으로 가기를 눌러도 시트가 되살아나지 않는다",
    async run() {
      const { ctx, page } = await open("sheet");
      await openSheet(page);
      await page.locator("[data-slot=bottom-sheet-close]").click();
      await page.waitForTimeout(600);
      await page.goForward();
      await page.waitForTimeout(400);
      const path = await page.evaluate(() => location.pathname);
      const reopened = await page.locator("[data-slot=bottom-sheet-close]").count();
      await ctx.close();
      const p = [];
      if (reopened) p.push("앞으로 가기로 시트가 다시 열렸다");
      if (path !== HARNESS) p.push(`주소가 바뀌었다(${path})`);
      return p;
    },
  },
  {
    name: "화면 경계 — 그리다 멈추면 흰 화면 대신 \"문제가 생겼어요\" + [다시 시도]",
    async run() {
      const { ctx, page } = await open("boundary-error");
      const shown = await page
        .getByText("문제가 생겼어요")
        .first()
        .waitFor({ timeout: 8000 })
        .then(() => true, () => false);
      const retry = await page.getByRole("button", { name: "다시 시도" }).count();
      await ctx.close();
      return shown && retry ? [] : [`실패 화면 ${shown} · 다시 시도 ${retry}`];
    },
  },
  {
    name: "화면 경계 — 코드 조각 받기 실패는 한 번만 새로 고치고, 또 실패하면 실패 화면",
    async run() {
      const { ctx, page } = await open("boundary-chunk");
      // 첫 실패 → 새로 고침 1회 → 다시 실패(10초 안) → 실패 화면
      const shown = await page
        .getByText("문제가 생겼어요")
        .first()
        .waitFor({ timeout: 8000 })
        .then(() => true, () => false);
      const marked = await page.evaluate(() => sessionStorage.getItem("groo:chunk-reload-at"));
      const navs = await page.evaluate(() => performance.getEntriesByType("navigation")[0]?.type);
      await ctx.close();
      const p = [];
      if (!marked) p.push("새로 고침 표식이 없다");
      if (navs !== "reload") p.push(`새로 고치지 않았다(${navs})`);
      if (!shown) p.push("두 번째 실패에 실패 화면이 안 떴다");
      return p;
    },
  },
  {
    name: "Tooltip — 누른 뒤 스크립트가 옮긴 초점에는 열지 않고, 키보드 초점에는 연다",
    async run() {
      const { ctx, page } = await open("tooltip", { width: 1280 });
      await page.locator("[data-check=press]").click();
      await page.evaluate(() => document.querySelector("[data-check=trigger]").focus());
      await page.waitForTimeout(800);
      const afterPointer = await page.locator("[role=tooltip]").count();
      await page.evaluate(() => document.querySelector("[data-check=press]").focus());
      await page.keyboard.press("Tab");
      await page.waitForTimeout(800);
      const afterKeyboard = await page.locator("[role=tooltip]").count();
      await ctx.close();
      const p = [];
      if (afterPointer) p.push("손가락으로 누른 뒤 옮긴 초점에 말풍선이 열렸다");
      if (!afterKeyboard) p.push("키보드 초점에 말풍선이 안 열렸다");
      return p;
    },
  },
  ...[
    { state: "(A)", visual: 384, top: 274 },
    { state: "(B)", visual: 484, top: 0 },
  ].flatMap(({ state, visual, top }) => [
    ["iPhone 사파리 26", IOS26, 56],
    ["iPhone 크롬", IOS26_CHROME, 0],
    ["안드로이드 크롬", ANDROID_CHROME, 0],
  ].map(([browserName, ua, extra]) => ({
    name: `Snackbar ${browserName} ${state} — 키보드 위 자리 = 보이는 영역 아래 끝${extra ? " 에서 56 위" : ""}`,
    async run() {
      const { ctx, page } = await open("snackbar", { ua });
      const avoid = () =>
        page.evaluate(() =>
          parseFloat(document.querySelector("[data-slot=snackbar-region]")?.style.getPropertyValue("--snackbar-avoid") || "0"),
        );
      const idle = await avoid();
      await page.evaluate(([v, t]) => window.__vv(v, t), [visual, top]);
      await page.waitForTimeout(100);
      const raised = await avoid();
      await page.evaluate((h) => window.__vv(h, 0), LAYOUT);
      await page.waitForTimeout(100);
      const lowered = await avoid();
      await ctx.close();
      const want = LAYOUT - (top + visual) + extra;
      const p = [];
      if (idle !== 0) p.push(`키보드 없을 때 ${idle}`);
      if (raised !== want) p.push(`키보드 위 ${raised} ≠ ${want}`);
      if (lowered !== 0) p.push(`키보드를 내려도 ${lowered}`);
      return p;
    },
  }))),
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
