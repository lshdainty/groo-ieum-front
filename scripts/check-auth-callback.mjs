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
} finally {
  await browser.close();
  await server.close();
}

if (failed) {
  console.error(`\n${failed}건 실패`);
  process.exit(1);
}
console.log(`\n${cases.length}건 통과`);
