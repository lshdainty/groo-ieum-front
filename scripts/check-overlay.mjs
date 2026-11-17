#!/usr/bin/env node
/**
 * 시트 · 딤 · 스낵바 · 히스토리 · 오류 경계를 크로미움에서 확인한다 — groo-damda-front 에서 들인 겹침 수정(#621 · #623 · #626 ·
 * #627 · #628)의 담다 시험(vitest · jsdom)을 이 레포에 맞게 옮긴 것이다.
 *
 * 이 레포에는 단위 테스트 러너가 없어 check-auth-callback 처럼 개발 서버와 Playwright 로 실제 화면을 돈다. 무대는
 * scripts/check-overlay/harness.tsx(개발 서버만 그린다 — 운영 빌드에 들어가지 않는다). 키보드는 크로미움에 없으므로
 * window.visualViewport 를 가짜로 바꿔 끼워 보이는 영역 크기를 준다(담다 시험과 같은 방식, 레이아웃 714).
 * 실기기(iPhone Safari 26)의 그림 — 띠가 실제로 딤 색인지, 도구줄 위에 버튼이 서는지 — 는 여기서 볼 수 없다(QA 몫).
 *
 * 사용: node scripts/check-overlay.mjs [이름 일부 — 그 시험만]
 * Playwright 의 Chromium 이 필요하다 — 처음 한 번 `npx playwright install chromium`.
 */
import { dirname, resolve } from "node:path";
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
