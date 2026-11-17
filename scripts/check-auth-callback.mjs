#!/usr/bin/env node
/**
 * 로그인 콜백(/auth/callback)이 state(CSRF) 검사를 지키는지 크로미움에서 확인한다(보안 점검 CLI-5).
 *
 * 이 레포에는 단위 테스트 러너가 없어 ds:check 처럼 개발 서버와 Playwright 로 실제 화면을 돈다.
 *   - 로그인 시작 때 저장해 둔 state 와 주소의 state 가 둘 다 있고 같을 때만 code 를 교환한다.
 *     주소에 state 가 없거나 · 비었거나 · 저장값이 없거나 · 다르면 교환 요청 없이 실패 화면을 띄운다.
 *   - 교환이 실패해도 콘솔에 오류를 찍지 않는다 — axios 오류에는 요청 본문(인가 code)이 실려 있다.
 * 교환이 실제로 성공하는지는 보지 않는다(백엔드가 없다) — 교환 요청이 나가는지만 본다.
 *
 * SSO 로그인 주소의 prompt=login(비밀번호 다시 받기)도 본다 — 교환 응답은 page.route 로 꾸민다.
 *   - 이음을 쓸 수 없는 계정으로 교환이 거절되면(PERMISSION_001 등) [다시 로그인하기] 가 prompt=login 으로 SSO 로그인을
 *     시작하고, 그 뒤 로그인 화면의 [그루 계정으로 로그인] 도 prompt=login 이다 — 살아 있는 SSO 로그인이 같은 계정으로
 *     되돌려 보내는 반복을 끊고 계정을 바꿀 수 있게. 저절로 SSO 로 떠나지는 않는다.
 *   - 표시가 없는 평소 로그인에는 prompt 를 붙이지 않는다.
 *   - AUTH_010(이음에서 로그아웃한 SSO 로그인)은 지금처럼 prompt=login 으로 한 번 저절로 다시 시작한다.
 *
 * 사용: npm run check:auth-callback
 * Playwright 의 Chromium 이 필요하다 — 처음 한 번 `npx playwright install chromium`.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createServer } from "vite";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CODE = "cli5-attacker-code";
const SAVED = { pkce_code_verifier: "cli5-verifier", pkce_state: "cli5-state" };

const cases = [
  { name: "state 가 같으면 교환한다", storage: SAVED, search: `?code=${CODE}&state=cli5-state`, exchange: true },
  { name: "주소에 state 가 없으면 거절한다", storage: SAVED, search: `?code=${CODE}`, exchange: false },
  { name: "주소의 state 가 비면 거절한다", storage: SAVED, search: `?code=${CODE}&state=`, exchange: false },
  {
    name: "저장한 state 가 없으면 거절한다",
    storage: { pkce_code_verifier: SAVED.pkce_code_verifier },
    search: `?code=${CODE}&state=cli5-state`,
    exchange: false,
  },
  { name: "state 가 다르면 거절한다", storage: SAVED, search: `?code=${CODE}&state=evil`, exchange: false },
  {
    name: "verifier 가 없으면 거절한다",
    storage: { pkce_state: SAVED.pkce_state },
    search: `?code=${CODE}&state=cli5-state`,
    exchange: false,
  },
];

// ── SSO 로그인 주소의 prompt=login ──
// SSO 로 떠나는 최상위 이동(code_challenge 가 붙은 주소)을 가로채 적고 빈 화면으로 돌려준다 — 주소의 SSO 호스트와 상관없이.
const watchSsoLogins = async (page) => {
  const logins = [];
  await page.route(
    (url) => url.searchParams.has("code_challenge"),
    (route) => {
      logins.push(new URL(route.request().url()));
      return route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>sso</title>" });
    },
  );
  return logins;
};

// 인가코드 교환 응답을 꾸민다 — 상태 · code 는 이음 백엔드(TokenExchangeService)가 주는 그대로
const fakeExchange = (page, status, code) =>
  page.route(
    (url) => url.pathname.endsWith("/auth/exchange-code"),
    (route) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ success: false, code }) }),
  );

// SSO 에서 code 를 받아 콜백으로 돌아온 상태 — 로그인 시작이 남긴 PKCE 를 채우고 들어간다
const enterCallback = async (page, extra = {}) => {
  await page.goto(`${base}/login`);
  await page.evaluate((s) => {
    sessionStorage.clear();
    localStorage.clear();
    for (const [k, v] of Object.entries(s)) sessionStorage.setItem(k, v);
  }, { ...SAVED, ...extra });
  await page.goto(`${base}/auth/callback?code=${CODE}&state=cli5-state`);
};

const waitFor = async (check, timeout = 15000) => {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    if (await check()) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
};

// 이음을 쓸 수 없는 계정으로 교환이 거절됐다 — 실패 화면이 뜨고, 저절로 SSO 로 떠나지 않아야 한다
const rejectedAccount = async (page, status, code, problems) => {
  const logins = await watchSsoLogins(page);
  await fakeExchange(page, status, code);
  await enterCallback(page);
  await page.getByRole("button", { name: "다시 로그인하기" }).waitFor({ timeout: 15000 });
  if (logins.length) problems.push("실패 화면에서 저절로 SSO 로 떠났다");
  return logins;
};

const promptCases = [
  {
    name: "이음 회원 아님(403 PERMISSION_001) → [다시 로그인하기] 가 prompt=login 으로 SSO 로그인을 시작한다",
    run: async (page) => {
      const problems = [];
      const logins = await rejectedAccount(page, 403, "PERMISSION_001", problems);
      await page.getByRole("button", { name: "다시 로그인하기" }).click();
      if (!(await waitFor(async () => logins.length > 0))) problems.push("SSO 로그인으로 떠나지 않았다");
      else if (logins[0].searchParams.get("prompt") !== "login") problems.push(`prompt=login 이 없다: ${logins[0].search}`);
      return problems;
    },
  },
  {
    name: "이음 행 없음(404 USER_001) → [다시 로그인하기] 도 prompt=login",
    run: async (page) => {
      const problems = [];
      const logins = await rejectedAccount(page, 404, "USER_001", problems);
      await page.getByRole("button", { name: "다시 로그인하기" }).click();
      if (!(await waitFor(async () => logins.length > 0))) problems.push("SSO 로그인으로 떠나지 않았다");
      else if (logins[0].searchParams.get("prompt") !== "login") problems.push(`prompt=login 이 없다: ${logins[0].search}`);
      return problems;
    },
  },
  {
    name: "회원 아님으로 거절된 뒤 로그인 화면의 [그루 계정으로 로그인] 도 prompt=login",
    run: async (page) => {
      const problems = [];
      const logins = await rejectedAccount(page, 403, "PERMISSION_001", problems);
      await page.goto(`${base}/login`);
      await page.getByRole("button", { name: "그루 계정으로 로그인" }).click();
      if (!(await waitFor(async () => logins.length > 0))) problems.push("SSO 로그인으로 떠나지 않았다");
      else if (logins[0].searchParams.get("prompt") !== "login") problems.push(`prompt=login 이 없다: ${logins[0].search}`);
      return problems;
    },
  },
  {
    name: "평소 로그인(표시 없음)에는 prompt 를 붙이지 않는다",
    run: async (page) => {
      const problems = [];
      const logins = await watchSsoLogins(page);
      await page.goto(`${base}/login`);
      await page.evaluate(() => {
        sessionStorage.clear();
        localStorage.clear();
      });
      await page.reload();
      await page.getByRole("button", { name: "그루 계정으로 로그인" }).click();
      if (!(await waitFor(async () => logins.length > 0))) problems.push("SSO 로그인으로 떠나지 않았다");
      else if (logins[0].searchParams.has("prompt")) problems.push(`prompt 가 붙었다: ${logins[0].search}`);
      return problems;
    },
  },
  {
    name: "AUTH_010 은 그대로 prompt=login 으로 한 번 저절로 다시 시작한다",
    run: async (page) => {
      const problems = [];
      const logins = await watchSsoLogins(page);
      await fakeExchange(page, 401, "AUTH_010");
      await enterCallback(page);
      if (!(await waitFor(async () => logins.length > 0))) problems.push("다시 시작하지 않았다");
      else if (logins[0].searchParams.get("prompt") !== "login") problems.push(`prompt=login 이 없다: ${logins[0].search}`);
      return problems;
    },
  },
  {
    name: "prompt=login 으로 보낸 시도가 또 회원 아님이면 실패 화면에 머문다(맴돌지 않는다)",
    run: async (page) => {
      const problems = [];
      const logins = await watchSsoLogins(page);
      await fakeExchange(page, 403, "PERMISSION_001");
      await enterCallback(page, { pkce_reauth: "1" });
      await page.getByRole("button", { name: "다시 로그인하기" }).waitFor({ timeout: 15000 });
      await new Promise((r) => setTimeout(r, 500));
      if (logins.length) problems.push("저절로 SSO 로 다시 떠났다");
      return problems;
    },
  },
];

const server = await createServer({ root: ROOT, logLevel: "error", server: { port: 0 } });
await server.listen();
const base = server.resolvedUrls.local[0].replace(/\/$/, "");
const browser = await chromium.launch();
let failed = 0;

try {
  for (const c of cases) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const logs = [];
    let exchanged = 0;
    page.on("console", (m) => {
      if (m.type() === "error" || m.type() === "warning" || m.type() === "log") logs.push(m.text());
    });
    page.on("request", (r) => {
      if ((r.postData() ?? "").includes(CODE)) exchanged += 1;
    });

    // 같은 출처에서 sessionStorage 를 채운 뒤 콜백으로 들어간다(로그인 시작이 하는 일)
    await page.goto(`${base}/login`);
    await page.evaluate((s) => {
      sessionStorage.clear();
      for (const [k, v] of Object.entries(s)) sessionStorage.setItem(k, v);
    }, c.storage);
    await page.goto(`${base}/auth/callback${c.search}`);
    // 실패 화면(ResultScreen)의 [다시 로그인하기] 가 뜰 때까지 기다린다 — 교환 갈래는 백엔드가 없어 실패로 끝난다
    await page.getByRole("button").first().waitFor({ timeout: 15000 });

    const leftover = await page.evaluate(() => [
      sessionStorage.getItem("pkce_code_verifier"),
      sessionStorage.getItem("pkce_state"),
    ]);
    const problems = [];
    if (c.exchange && exchanged === 0) problems.push("교환 요청이 나가지 않았다");
    if (!c.exchange && exchanged > 0) problems.push("거절해야 하는데 교환 요청이 나갔다");
    if (logs.some((l) => l.includes(CODE) || l.includes("exchange"))) problems.push("콘솔에 교환 오류가 찍혔다");
    if (leftover.some((v) => v !== null)) problems.push("PKCE 값이 남았다");

    console.log(`${problems.length ? "✗" : "✓"} ${c.name}${problems.length ? ` — ${problems.join(", ")}` : ""}`);
    if (problems.length) failed += 1;
    await ctx.close();
  }

  for (const c of promptCases) {
    // 단추를 이름(한국어)으로 찾는다 — 언어는 브라우저 언어를 따른다
    const ctx = await browser.newContext({ locale: "ko-KR" });
    const page = await ctx.newPage();
    const problems = await c.run(page, ctx).catch((e) => [`실행 오류: ${e.message}`]);
    console.log(`${problems.length ? "✗" : "✓"} ${c.name}${problems.length ? ` — ${problems.join(", ")}` : ""}`);
    if (problems.length) failed += 1;
    await ctx.close();
  }
} finally {
  await browser.close();
  await server.close();
}

if (failed) {
  console.error(`\n${failed}건 실패`);
  process.exit(1);
}
console.log(`\n${cases.length + promptCases.length}건 통과`);
