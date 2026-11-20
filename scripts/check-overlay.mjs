#!/usr/bin/env node
/**
 * 시트 · 딤 · 스낵바 · 히스토리 · 오류 경계 · 키보드가 뜬 채 닫기를 크로미움에서 확인한다 — groo-damda-front 에서 들인 겹침 수정
 * (#621 · #623 · #626 · #627 · #628 · #630 · #631)의 담다 시험(vitest · jsdom)을 이 레포에 맞게 옮긴 것이다.
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

// ── 키보드가 뜬 채 닫기(담다 #631) ──
// 무대 keyboard — 처음부터 열린 폼 표면(시트, ?dialog 면 1280 대화상자) 하나와 입력 칸. 실제로 닫힌 횟수는 __check.closes.
// 키보드는 가짜 보이는 영역으로 올린다(714 → 384, 가린 높이 330 — 판정 60 을 넘는다)
const KB_UP = 384;
const KB_HALF = 600; // 반쯤 돌아온 resize — 가린 높이 114, 아직 키보드
const KB_WAIT = 400; // KEYBOARD_CLOSE_WAIT_MS

async function openKeyboard({ dialog = false, dirty = false, keyboard = true, ua } = {}) {
  const scene = `keyboard${dialog ? "&dialog" : ""}${dirty ? "&dirty" : ""}`;
  const opened = await open(scene, { width: dialog ? 1280 : 390, ua });
  const { page } = opened;
  await page.locator(`[data-slot=${dialog ? "dialog" : "bottom-sheet"}-close]`).waitFor();
  await page.waitForTimeout(400);
  if (keyboard) {
    await page.evaluate((h) => {
      document.querySelector("[data-check=input]").focus();
      window.__vv(h, 0);
    }, KB_UP);
    await page.waitForTimeout(50);
  }
  return opened;
}
const closesOf = (page) => page.evaluate(() => Number(window.__check.closes));
const kbDown = (page) => page.evaluate((h) => window.__vv(h, 0), LAYOUT);
const inputFocused = (page) =>
  page.evaluate(() => document.activeElement === document.querySelector("[data-check=input]"));
// [×] 에 손가락(또는 마우스) 누름 — 단추 가운데(또는 밖으로 밀어 dx), 이어 click 을 보낼지
const press = (page, slot, { type = "touch", dx = 0, end = "pointerup", click = false } = {}) =>
  page.evaluate(
    ([s, t, d, e, c]) => {
      const el = document.querySelector(`[data-slot=${s}]`);
      const box = el.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      const fire = (name, px) =>
        el.dispatchEvent(
          new PointerEvent(name, {
            bubbles: true,
            cancelable: true,
            pointerId: 7,
            pointerType: t,
            isPrimary: true,
            button: 0,
            clientX: px,
            clientY: y,
          }),
        );
      fire("pointerdown", x);
      fire(e, x + d);
      if (!c) return null;
      const ev = new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1, clientX: x, clientY: y });
      el.dispatchEvent(ev);
      return ev.defaultPrevented;
    },
    [slot, type, dx, end, click],
  );

function KEYBOARD_CASES() {
  return [
    ...[
      ["시트", false, "bottom-sheet-close"],
      ["대화상자(1280 · 태블릿 키보드)", true, "dialog-close"],
    ].map(([label, dialog, slot]) => ({
      name: `키보드가 뜬 채 닫기 — ${label} [×]: 칸의 초점을 빼 키보드를 내리고, 보이는 영역이 돌아온 뒤 닫는다`,
      async run() {
        const { ctx, page, errors } = await openKeyboard({ dialog });
        const before = await inputFocused(page);
        await page.evaluate((s) => document.querySelector(`[data-slot=${s}]`).click(), slot);
        const right = await page.evaluate(() => ({
          closes: Number(window.__check.closes),
          inSurface: !!document.activeElement?.closest("[role=dialog]"),
        }));
        const blurred = !(await inputFocused(page));
        await page.waitForTimeout(150);
        const waiting = await closesOf(page);
        await kbDown(page);
        await page.waitForTimeout(30);
        const after = await closesOf(page);
        await ctx.close();
        const p = [];
        if (!before) p.push("칸에 초점이 없었다(무대)");
        if (right.closes !== 0) p.push("키보드가 떠 있는데 바로 닫았다");
        if (!blurred) p.push("칸에 초점이 남았다(키보드가 안 내려간다)");
        if (!right.inSurface) p.push("초점이 표면 밖으로 나갔다");
        if (waiting !== 0) p.push("보이는 영역이 돌아오기 전에 닫았다");
        if (after !== 1) p.push(`돌아온 뒤 닫힌 횟수 ${after}`);
        if (errors.length) p.push(errors.join(" / "));
        return p;
      },
    })),
    {
      name: `키보드가 뜬 채 닫기 — 보이는 영역이 돌아왔다는 알림이 없어도 상한(${KB_WAIT}ms) 뒤에 닫는다`,
      async run() {
        const { ctx, page } = await openKeyboard();
        await page.locator("[data-slot=bottom-sheet-close]").dispatchEvent("click");
        await page.waitForTimeout(KB_WAIT - 150);
        const early = await closesOf(page);
        await page.waitForTimeout(300);
        const late = await closesOf(page);
        await ctx.close();
        const p = [];
        if (early !== 0) p.push("상한 전에 닫았다");
        if (late !== 1) p.push(`상한 뒤 닫힌 횟수 ${late}`);
        return p;
      },
    },
    {
      name: "키보드가 뜬 채 닫기 — 기다리는 동안 다시 눌러도([×] · Esc · [×]) 한 번만 닫는다",
      async run() {
        const { ctx, page } = await openKeyboard();
        const close = page.locator("[data-slot=bottom-sheet-close]");
        await close.dispatchEvent("click");
        await page.keyboard.press("Escape");
        await close.dispatchEvent("click");
        await page.waitForTimeout(KB_WAIT + 100);
        const closes = await closesOf(page);
        await ctx.close();
        return closes === 1 ? [] : [`닫힌 횟수 ${closes}`];
      },
    },
    {
      name: "키보드가 뜬 채 닫기 — 보이는 영역이 반쯤 돌아온 resize 에는 아직 닫지 않는다",
      async run() {
        const { ctx, page } = await openKeyboard();
        await page.locator("[data-slot=bottom-sheet-close]").dispatchEvent("click");
        await page.evaluate((h) => window.__vv(h, 0), KB_HALF);
        await page.waitForTimeout(30);
        const half = await closesOf(page);
        await kbDown(page);
        await page.waitForTimeout(30);
        const full = await closesOf(page);
        await ctx.close();
        const p = [];
        if (half !== 0) p.push("반쯤 돌아왔는데 닫았다");
        if (full !== 1) p.push(`다 돌아온 뒤 닫힌 횟수 ${full}`);
        return p;
      },
    },
    {
      name: "키보드가 뜬 채 닫기 — 키보드가 없으면 그 자리에서 바로 닫는다(지금 동작 그대로)",
      async run() {
        const { ctx, page } = await openKeyboard({ keyboard: false });
        const closes = await page.evaluate(() => {
          document.querySelector("[data-slot=bottom-sheet-close]").click();
          return Number(window.__check.closes);
        });
        await ctx.close();
        return closes === 1 ? [] : [`같은 틱에 닫힌 횟수 ${closes}`];
      },
    },
    {
      name: "키보드가 뜬 채 닫기 — 초점 칸 없이 키보드만 내려가는 중(도구줄 [완료] 뒤 곧바로 [×])이어도 다 내려간 뒤에 닫는다",
      async run() {
        const { ctx, page } = await openKeyboard();
        await page.evaluate(() => document.querySelector("[data-check=input]").blur());
        await page.locator("[data-slot=bottom-sheet-close]").dispatchEvent("click");
        const waiting = await closesOf(page);
        await kbDown(page);
        await page.waitForTimeout(30);
        const after = await closesOf(page);
        await ctx.close();
        const p = [];
        if (waiting !== 0) p.push("키보드가 내려가는 중인데 바로 닫았다");
        if (after !== 1) p.push(`내려간 뒤 닫힌 횟수 ${after}`);
        return p;
      },
    },
    {
      name: "키보드가 뜬 채 닫기 — 기다리는 동안 시트가 내려가면(언마운트) 늦게 닫지 않는다",
      async run() {
        const { ctx, page, errors } = await openKeyboard();
        await page.locator("[data-slot=bottom-sheet-close]").dispatchEvent("click");
        await page.evaluate(() => window.__check.unmount());
        await kbDown(page);
        await page.waitForTimeout(KB_WAIT + 100);
        const closes = await closesOf(page);
        await ctx.close();
        const p = [];
        if (closes !== 0) p.push(`내려간 뒤 늦게 닫았다(${closes})`);
        if (errors.length) p.push(errors.join(" / "));
        return p;
      },
    },
    // ── 닫기 [×] 를 뗄 때 닫기(release-press) ──
    {
      name: "[×] 뗄 때 — 키보드가 뜬 채 손가락으로 누르면 click 이 오지 않아도(pointerdown · pointerup 만) 닫는다",
      async run() {
        const { ctx, page } = await openKeyboard();
        await press(page, "bottom-sheet-close");
        const blurred = !(await inputFocused(page));
        await kbDown(page);
        await page.waitForTimeout(30);
        const closes = await closesOf(page);
        await ctx.close();
        const p = [];
        if (!blurred) p.push("뗐는데 키보드를 내리지 않았다");
        if (closes !== 1) p.push(`닫힌 횟수 ${closes}`);
        return p;
      },
    },
    {
      name: "[×] 뗄 때 — 이어 온 같은 누름의 click 은 거둔다(닫기는 한 번)",
      async run() {
        const { ctx, page } = await openKeyboard();
        await press(page, "bottom-sheet-close");
        await kbDown(page); // 뗄 때 청한 닫기가 끝난다
        await page.waitForTimeout(30);
        await page.evaluate(() =>
          document
            .querySelector("[data-slot=bottom-sheet-close]")
            ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 })),
        );
        await page.waitForTimeout(KB_WAIT + 100);
        const closes = await closesOf(page);
        await ctx.close();
        return closes === 1 ? [] : [`닫힌 횟수 ${closes}`];
      },
    },
    {
      name: "[×] 뗄 때 — 바뀐 값이 있으면 뗄 때 한 번만 묻고, 이어 온 click 이 다시 청하지 않는다",
      async run() {
        const { ctx, page } = await openKeyboard({ dirty: true });
        await press(page, "bottom-sheet-close", { click: true });
        await kbDown(page);
        await page.waitForTimeout(400);
        const asked = await page.locator('[role=alertdialog][data-state="open"]').count();
        const closes = await closesOf(page);
        await ctx.close();
        const p = [];
        if (asked !== 1) p.push(`확인창 ${asked}개`);
        if (closes !== 0) p.push("묻지 않고 닫았다");
        return p;
      },
    },
    ...[
      ["단추 밖으로 밀고 떼면", { dx: 200 }],
      ["터치가 취소되면(pointercancel — 스크롤 · 끌기)", { end: "pointercancel" }],
      ["마우스는", { type: "mouse" }],
    ].map(([label, opts]) => ({
      name: `[×] 뗄 때 — ${label} 뗄 때 닫지 않는다`,
      async run() {
        const { ctx, page } = await openKeyboard();
        await press(page, "bottom-sheet-close", opts);
        const focused = await inputFocused(page);
        await kbDown(page);
        await page.waitForTimeout(KB_WAIT + 100);
        const closes = await closesOf(page);
        await ctx.close();
        const p = [];
        if (!focused) p.push("칸의 초점을 뺐다(닫기를 청했다)");
        if (closes !== 0) p.push(`닫혔다(${closes})`);
        return p;
      },
    })),
    {
      name: "[×] 뗄 때 — 마우스 · 키보드 없는 터치는 click 그대로다(뗄 때는 닫지 않고 click 에 닫는다)",
      async run() {
        const p = [];
        for (const [label, keyboard, type] of [
          ["마우스", true, "mouse"],
          ["키보드 없는 터치", false, "touch"],
        ]) {
          const { ctx, page } = await openKeyboard({ keyboard });
          await press(page, "bottom-sheet-close", { type });
          const onRelease = await closesOf(page);
          await page.evaluate(() =>
            document
              .querySelector("[data-slot=bottom-sheet-close]")
              .dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 })),
          );
          if (keyboard) await kbDown(page);
          await page.waitForTimeout(30);
          const onClick = await closesOf(page);
          await ctx.close();
          if (onRelease !== 0) p.push(`${label} — 뗄 때 닫았다`);
          if (onClick !== 1) p.push(`${label} — click 에 닫힌 횟수 ${onClick}`);
        }
        return p;
      },
    },
    {
      name: "[×] 뗄 때 — 키보드(Enter · Space)로 누른 click(detail 0)은 그대로 닫는다",
      async run() {
        const p = [];
        for (const key of ["Enter", "Space"]) {
          const { ctx, page } = await openKeyboard();
          await page.evaluate(() => document.querySelector("[data-slot=bottom-sheet-close]").focus());
          await page.keyboard.press(key);
          await kbDown(page);
          await page.waitForTimeout(30);
          const closes = await closesOf(page);
          await ctx.close();
          if (closes !== 1) p.push(`${key} — 닫힌 횟수 ${closes}`);
        }
        return p;
      },
    },
    {
      name: "[×] 뗄 때 — 대화상자(1280 · 태블릿)도 같고, 이어 온 click 은 Radix 닫기로 넘기지 않는다",
      async run() {
        const { ctx, page } = await openKeyboard({ dialog: true });
        const prevented = await press(page, "dialog-close", { click: true });
        const blurred = !(await inputFocused(page));
        await kbDown(page);
        await page.waitForTimeout(KB_WAIT + 100);
        const closes = await closesOf(page);
        await ctx.close();
        const p = [];
        if (!blurred) p.push("뗐는데 키보드를 내리지 않았다");
        if (prevented !== true) p.push("이어 온 click 을 Radix 로 넘겼다");
        if (closes !== 1) p.push(`닫힌 횟수 ${closes}`);
        return p;
      },
    },
    // ── 키보드 경로 히스토리(app-history.test) — 닫힌 뒤 누른 탭이 앞으로 칸을 잘라 뒤로 켜짐 · 앞으로 꺼짐 ──
    ...[
      ["키보드가 다 내려가고 시트가 닫힌 뒤", true],
      ["시트가 닫히는 바로 그 틱(되돌림이 끝나기 전)", false],
    ].map(([when, settledFirst]) => ({
      name: `키보드 경로 히스토리 — ${when} 누른 탭은 한 번에 옮기고, 뒤로 켜짐 · 앞으로 꺼짐(닫은 칸이 앞으로 칸으로 남지 않는다)`,
      async run() {
        const { ctx, page, errors } = await openKeyboard();
        const opened = await page.evaluate(() => ({ len: history.length, flag: history.state?.grooOverlayBack === true }));
        await page.locator("[data-slot=bottom-sheet-close]").dispatchEvent("click");
        const waiting = await page.evaluate(() => history.state?.grooOverlayBack === true);
        if (settledFirst) {
          await kbDown(page);
          await page.waitForTimeout(600);
          await page.evaluate(() => window.__check.navigate("/b"));
        } else {
          // 닫힌 정리가 칸 되돌림(history.go)을 건 바로 그때(popstate 전) — 키보드가 내려가며 iOS 가 보내는 scroll 도 함께
          await page.evaluate((h) => {
            const go = history.go.bind(history);
            history.go = (d) => {
              history.go = go;
              go(d);
              window.__check.navigate("/b");
            };
            window.visualViewport.dispatchEvent(new Event("scroll"));
            window.__vv(h, 0);
            window.dispatchEvent(new Event("scroll"));
          }, LAYOUT);
        }
        await page.waitForTimeout(600);
        const moved = await page.evaluate(() => ({
          len: history.length,
          path: location.pathname,
          shown: document.querySelector("[data-check=path]")?.textContent,
          flag: history.state?.grooOverlayBack === true,
        }));
        const forward = await page.evaluate(() => {
          // 앞으로 칸이 있는지 — navigation API(크로미움)
          return window.navigation ? window.navigation.canGoForward : null;
        });
        await page.goBack();
        await page.waitForTimeout(300);
        const back = await page.evaluate(() => ({ path: location.pathname, flag: history.state?.grooOverlayBack === true }));
        await ctx.close();
        const p = [];
        if (!opened.flag) p.push("열 때 칸을 쌓지 않았다");
        if (!waiting) p.push("키보드가 내려가는 동안 칸을 먼저 되돌렸다");
        if (moved.path !== "/b" || moved.shown !== "/b") p.push(`옮긴 화면이 아니다 ${JSON.stringify(moved)}`);
        if (moved.flag) p.push("닫은 시트 칸에 서 있다");
        if (moved.len !== opened.len) p.push(`히스토리 길이 ${moved.len}(연 때 ${opened.len}) — 닫은 칸이 남았거나 두 번 옮겼다`);
        if (forward === true) p.push("앞으로 가기가 켜져 있다");
        if (back.path !== HARNESS || back.flag) p.push(`뒤로 가기가 ${JSON.stringify(back)}`);
        if (errors.length) p.push(errors.join(" / "));
        return p;
      },
    })),
    {
      name: "키보드 경로 히스토리 — 키보드가 뜬 채 뒤로 가기는 키보드를 내린 뒤 시트를 닫고(칸은 브라우저가 썼다) 화면은 그대로",
      async run() {
        const { ctx, page, errors } = await openKeyboard();
        const opened = await page.evaluate(() => history.length);
        await page.evaluate(() => history.back());
        await page.waitForTimeout(150);
        const waiting = await page.evaluate(() => ({
          closes: Number(window.__check.closes),
          input: document.activeElement === document.querySelector("[data-check=input]"),
        }));
        await kbDown(page);
        await page.waitForTimeout(600);
        const after = await page.evaluate(() => ({
          closes: Number(window.__check.closes),
          len: history.length,
          path: location.pathname,
          flag: history.state?.grooOverlayBack === true,
        }));
        await ctx.close();
        const p = [];
        if (waiting.closes !== 0) p.push("키보드가 내려가기 전에 닫았다");
        if (waiting.input) p.push("칸에 초점이 남았다");
        if (after.closes !== 1) p.push(`닫힌 횟수 ${after.closes}`);
        if (after.path !== HARNESS || after.flag) p.push(`화면이 ${JSON.stringify(after)}`);
        if (after.len !== opened) p.push(`히스토리 길이 ${after.len}(연 때 ${opened})`);
        if (errors.length) p.push(errors.join(" / "));
        return p;
      },
    },
  ];
}

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
  // ── 키보드가 뜬 채 닫기(담다 #631 — close-after-keyboard.test · release-press.test · app-history.test 키보드 경로) ──
  ...KEYBOARD_CASES(),
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

  // ── 머리 단추는 제목 첫 줄 가운데(담다 #652 header-button-position.test · groo-design #263) ──
  // 닫기 · ⋮ · ← 는 px 그대로이고, 글자를 키워 제목 줄이 높아지면 그 절반만큼 따라 내려간다 — 300%(처음부터 · 뜬 뒤)에서 단추 가운데와
  // 제목 첫 줄 가운데의 거리가 100% 와 같고(0.5 이하), 단추 크기도 같다. 이음에만 있는 옆 패널(레시피 셈)도 같다
  ...[
    { surface: "dialog", buttons: ["dialog-close"] },
    { surface: "dialog-back", buttons: ["dialog-close", "dialog-back", "action"] },
    { surface: "sheet", buttons: ["bottom-sheet-close", "bottom-sheet-back"] },
    { surface: "popover", buttons: ["popover-close"] },
    { surface: "bubble", buttons: ["help-bubble-close"] },
    { surface: "panel", buttons: ["side-panel-close"] },
  ].flatMap(({ surface, buttons }) =>
    [false, true].map((live) => ({
      name: `머리 단추 ${surface} · 300% ${live ? "뜬 뒤" : "처음부터"} — ${buttons.join(" · ")} 가 제목 첫 줄 가운데를 따라 내려가고 크기는 그대로`,
      async run() {
        const measure = async (font, live) => {
          const ctx = await browser.newContext({ locale: "ko-KR", viewport: { width: 390, height: LAYOUT } });
          const page = await ctx.newPage();
          const errors = [];
          page.on("pageerror", (e) => errors.push(e.message));
          await page.goto(`${base}${HARNESS}?scene=header&surface=${surface}${font !== 1 && !live ? `&font=${font}` : ""}`);
          await page.locator('[data-slot$="-title"]').first().waitFor();
          await page.waitForTimeout(450);
          if (live) {
            await page.evaluate((f) => {
              document.documentElement.style.fontSize = `${f * 100}%`;
            }, font);
            await page.waitForTimeout(300);
          }
          const m = await page.evaluate((names) => {
            const title = document.querySelector('[data-slot$="-title"]');
            const range = document.createRange();
            range.selectNodeContents(title);
            const lines = [...range.getClientRects()].filter((r) => r.width > 0);
            const first = lines.reduce((a, b) => (b.top < a.top ? b : a));
            const lh = parseFloat(getComputedStyle(title).lineHeight);
            const titleTop = title.getBoundingClientRect().top;
            const titleCenter = titleTop + lh / 2;
            const out = { lines: new Set(lines.map((r) => Math.round(r.top))).size, firstTop: first.top, titleTop };
            for (const n of names) {
              const el = document.querySelector(`[data-slot="${n}"]`) ?? document.querySelector(`[data-check="${n}"]`);
              if (!el) {
                out[n] = null;
                continue;
              }
              const r = el.getBoundingClientRect();
              out[n] = { center: (r.top + r.bottom) / 2 - titleCenter, w: Math.round(r.width), h: Math.round(r.height) };
            }
            return out;
          }, buttons);
          await ctx.close();
          return { m, errors };
        };
        const a = await measure(1, false);
        const b = await measure(3, live);
        const p = [...a.errors, ...b.errors];
        if (b.m.lines < 2) p.push(`300% 에서 제목이 ${b.m.lines} 줄 — 두 줄 이상이어야 판정이 뜻이 있다`);
        for (const n of buttons) {
          const x = a.m[n];
          const y = b.m[n];
          if (!x || !y) {
            p.push(`${n} 가 없다`);
            continue;
          }
          if (Math.abs(x.center - y.center) > 0.5) p.push(`${n} 가운데 − 제목 첫 줄 가운데 ${x.center.toFixed(1)} → ${y.center.toFixed(1)}`);
          if (x.w !== y.w || x.h !== y.h) p.push(`${n} 크기 ${x.w}×${x.h} → ${y.w}×${y.h}`);
        }
        return p;
      },
    })),
  ),

  // ── 버튼 라벨은 한 줄 "…"(담다 #652 button.test · responsive-pair.test · groo-design #263 button.md "글자 크기 설정") ──
  ...[false, true].map((live) => ({
    name: `긴 라벨 · 300% ${live ? "뜬 뒤" : "처음부터"} — 버튼은 자리보다 넓어지지 않고 라벨은 한 줄 "…" · 짝 버튼은 쌓이고(주 버튼 위) "…" · 대화상자 바닥은 주 버튼이 위로 쌓인다`,
    async run() {
      const ctx = await browser.newContext({ locale: "ko-KR", viewport: { width: 390, height: LAYOUT } });
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(`${base}${HARNESS}?scene=label${live ? "" : "&font=3"}`);
      await page.locator("[data-check=foot-main]").waitFor();
      await page.waitForTimeout(450);
      if (live) {
        await page.evaluate(() => {
          document.documentElement.style.fontSize = "300%";
        });
        await page.waitForTimeout(300);
      }
      const m = await page.evaluate(() => {
        const label = (btn) => {
          const span = btn.querySelector("[data-slot=button-label]");
          const r = span?.getBoundingClientRect();
          const lh = span ? parseFloat(getComputedStyle(span).lineHeight) : 0;
          return span
            ? { lines: Math.round(r.height / lh), cut: span.scrollWidth > span.clientWidth + 0.5, ellipsis: getComputedStyle(span).textOverflow, text: btn.textContent }
            : null;
        };
        const rect = (sel) => document.querySelector(sel).getBoundingClientRect();
        const long = document.querySelector("[data-check=long]");
        const pair = document.querySelector("[data-check=pair] [data-slot=responsive-pair]");
        const main = document.querySelector("[data-check=pair-main]");
        const cancel = pair.firstElementChild;
        return {
          long: { label: label(long), w: rect("[data-check=long]").width, slot: rect("[data-check=slot]").width },
          pair: { label: label(main), mainTop: main.getBoundingClientRect().top, cancelTop: cancel.getBoundingClientRect().top, mainW: main.getBoundingClientRect().width, pairW: pair.getBoundingClientRect().width },
          foot: { mainTop: rect("[data-check=foot-main]").top, cancelTop: rect("[data-check=foot-cancel]").top, main: label(document.querySelector("[data-check=foot-main]")) },
          fontSize: getComputedStyle(document.documentElement).fontSize,
        };
      });
      await ctx.close();
      const p = [...errors];
      if (m.fontSize !== "48px") p.push(`문서 글자 ${m.fontSize}`);
      const L = m.long;
      if (!L.label) p.push("긴 라벨에 라벨 span 이 없다");
      else {
        if (L.label.lines !== 1) p.push(`긴 라벨 ${L.label.lines} 줄`);
        if (!L.label.cut || L.label.ellipsis !== "ellipsis") p.push(`긴 라벨이 "…" 로 줄지 않는다(${L.label.ellipsis})`);
        if (L.label.text !== "엑셀 파일로 모든 휴가 내역을 내보내고 메일로 받기") p.push("라벨 글이 DOM 에 그대로가 아니다");
      }
      if (L.w > L.slot + 0.5) p.push(`버튼 ${L.w.toFixed(1)} 이 자리 ${L.slot} 보다 넓다`);
      const P = m.pair;
      if (!(P.mainTop < P.cancelTop)) p.push("짝 버튼이 쌓이지 않았거나 주 버튼이 아래다");
      if (P.mainW > P.pairW + 0.5) p.push(`짝 주 버튼 ${P.mainW.toFixed(1)} 이 짝 폭 ${P.pairW.toFixed(1)} 보다 넓다`);
      if (!P.label || P.label.lines !== 1 || !P.label.cut) p.push(`짝 주 버튼 라벨이 한 줄 "…" 가 아니다 ${JSON.stringify(P.label)}`);
      if (!(m.foot.mainTop < m.foot.cancelTop)) p.push("대화상자 바닥이 쌓이지 않았거나 주 버튼이 아래다");
      if (m.foot.main && m.foot.main.lines !== 1) p.push(`바닥 주 버튼 라벨 ${m.foot.main.lines} 줄`);
      return p;
    },
  })),


  // ── 시트 바닥 왼쪽 [삭제] 는 글자만큼(groo-design #268 — bottom-sheet.md "머리 · 본문 · 바닥" · 코드, 담다 responsive-pair.test) ──
  {
    name: '시트 바닥 [삭제](data-fit="content") — 글 폭이고 주 버튼이 남은 폭, 주 버튼이 들지 않으면 위로 쌓이고 [삭제] 는 아래 왼쪽 글 폭, 혼자면 왼쪽 글 폭',
    async run() {
      const { ctx, page, errors } = await open("fit");
      await page.locator("[data-check=fit-alone] [data-check=del]").waitFor();
      const m = await page.evaluate(() => {
        const box = (el) => {
          const r = el.getBoundingClientRect();
          return { l: r.left, r: r.right, t: r.top, w: r.width };
        };
        const of = (name) => {
          const row = document.querySelector(`[data-check=${name}]`);
          const del = row.querySelector("[data-check=del]");
          const main = row.querySelector("[data-check=main]");
          const cs = getComputedStyle(row);
          return {
            row: { l: row.getBoundingClientRect().left + parseFloat(cs.paddingLeft), r: row.getBoundingClientRect().right - parseFloat(cs.paddingRight) },
            del: box(del),
            // 글 폭 — 버튼이 늘지 않았으면 상자 폭이 내용 폭과 같다(max-content)
            delContent: (() => {
              const c = del.cloneNode(true);
              c.style.cssText = "position:absolute;visibility:hidden;width:max-content;flex:none";
              document.body.appendChild(c);
              const w = c.getBoundingClientRect().width;
              c.remove();
              return w;
            })(),
            main: main ? box(main) : null,
          };
        };
        return { row: of("fit-row"), stack: of("fit-stack"), alone: of("fit-alone") };
      });
      await ctx.close();
      const p = [...errors];
      const near = (a, b) => Math.abs(a - b) <= 0.5;
      for (const [n, x] of Object.entries(m)) {
        if (!near(x.del.w, x.delContent)) p.push(`${n} [삭제] 폭 ${x.del.w.toFixed(1)} — 글 폭 ${x.delContent.toFixed(1)} 이어야`);
        if (!near(x.del.l, x.row.l)) p.push(`${n} [삭제] 가 바닥 왼쪽에 있지 않다(${x.del.l.toFixed(1)} · ${x.row.l.toFixed(1)})`);
      }
      const R = m.row;
      if (!near(R.del.t, R.main.t)) p.push("짧은 [저장] 이 [삭제] 와 한 줄이 아니다");
      if (!near(R.main.l, R.del.r + 8) || !near(R.main.r, R.row.r)) p.push(`[저장] 이 남은 폭을 채우지 않는다(${R.main.l.toFixed(1)}~${R.main.r.toFixed(1)})`);
      const S = m.stack;
      if (!(S.main.t < S.del.t)) p.push("남은 폭에 들지 않는 주 버튼이 위로 쌓이지 않았다");
      if (!near(S.main.l, S.row.l) || !near(S.main.r, S.row.r)) p.push(`쌓인 주 버튼이 폭 전체가 아니다(${S.main.l.toFixed(1)}~${S.main.r.toFixed(1)})`);
      return p;
    },
  },
  {
    name: '화면의 시트 · 반응형 대화상자 바닥에 둔 ghost critical(삭제 · 빼기 · 신청 취소)은 data-fit="content" — 옛 반 폭 덮기(grow-0 · basis-auto 손질)는 0',
    async run() {
      const p = [];
      let seen = 0;
      for (const file of codeFiles(resolve(ROOT, "src"))) {
        if (/[\\/]shared[\\/]ds[\\/]|\.demo\./.test(file)) continue;
        const src = readFileSync(file, "utf8");
        for (const f of src.matchAll(/<(ResponsiveDialogFooter|BottomSheetFooter)(?=[\s>])[\s\S]*?<\/\1>/g)) {
          for (const b of f[0].matchAll(/<Button\b[\s\S]*?>/g)) {
            if (!/ghostColor=['"]critical['"]/.test(b[0])) continue;
            seen += 1;
            if (!/data-fit=['"]content['"]/.test(b[0])) p.push(`${file.slice(ROOT.length + 1)}:${src.slice(0, f.index + b.index).split("\n").length} data-fit 없음`);
          }
        }
        if (/grow-0[^'"]*basis-auto|basis-auto[^'"]*grow-0/.test(src)) p.push(`${file.slice(ROOT.length + 1)} 반 폭을 손으로 덮는 grow-0 · basis-auto`);
      }
      if (seen < 5) p.push(`바닥 ghost critical 을 ${seen} 개만 찾았다 — 찾는 식이 깨졌다`);
      return p;
    },
  },
  {
    // dialog.md "머리 · 본문 · 바닥"(대화상자 바닥은 Button small 36) · button.md 모달 footer(삭제는 왼쪽) · bottom-sheet.md(시트 바닥은 large 48).
    // 크기는 바닥(ResponsiveDialogFooter)이 표면에 맞춰 준다 — 버튼이 size 를 직접 쥐면 1280 이상 대화상자에서도 48 로 남는다(일정 · 업무 보고 폼 · 일정 상세가 이 모양이었다).
    // 대화상자 바닥은 오른쪽 정렬이라 [삭제] 를 왼쪽에 두려면 mr-auto 가 있어야 한다(시트 바닥에서는 주 버튼이 남은 폭을 채워 0 이 된다).
    // 시트에서만 그리는 [삭제](`sheet &&` 로 거른 공휴일 · 공지 · 업무 코드 폼)는 대화상자에 오지 않으니 보지 않는다.
    name: '반응형 대화상자 바닥의 ghost critical 은 size 를 직접 주지 않고(바닥이 정한다 — 대화상자 36 · 시트 48) mr-auto 로 왼쪽에 선다',
    async run() {
      const p = [];
      let seen = 0;
      for (const file of codeFiles(resolve(ROOT, "src"))) {
        if (/[\\/]shared[\\/]ds[\\/]|\.demo\./.test(file)) continue;
        const src = readFileSync(file, "utf8");
        for (const f of src.matchAll(/<ResponsiveDialogFooter(?=[\s>])[\s\S]*?<\/ResponsiveDialogFooter>/g)) {
          for (const b of f[0].matchAll(/<Button\b[\s\S]*?>/g)) {
            if (!/ghostColor=['"]critical['"]/.test(b[0])) continue;
            const before = f[0].slice(0, b.index);
            if (/\bsheet\s*&&/.test(before.slice(before.lastIndexOf("{")))) continue;
            seen += 1;
            const at = `${file.slice(ROOT.length + 1)}:${src.slice(0, f.index + b.index).split("\n").length}`;
            if (/\ssize=/.test(b[0])) p.push(`${at} size 를 직접 줌 — 대화상자에서도 그 크기로 남는다`);
            if (!/className=['"][^'"]*\bmr-auto\b/.test(b[0])) p.push(`${at} mr-auto 없음 — 대화상자 바닥에서 왼쪽에 서지 않는다`);
          }
        }
      }
      if (seen < 4) p.push(`대화상자에 오는 바닥 ghost critical 을 ${seen} 개만 찾았다 — 찾는 식이 깨졌다`);
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
