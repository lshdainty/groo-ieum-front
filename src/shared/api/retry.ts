import { isAxiosError } from 'axios';

import { endChain, mayRetryWithinBudget } from './request-budget';

/**
 * React Query 전역 재시도 판정.
 *
 * 전에는 retry 를 지정하지 않아 v5 기본값(3번, 4xx 포함)이었다. 4xx 는 다시 물어도 같은 답이다 — 없는 것은 여전히 없고, 권한은
 * 여전히 없다. 재시도가 의미 있는 건 서버가 잠깐 흔들렸거나(5xx) 네트워크가 끊겼을 때뿐이라 그 둘만 남긴다.
 *
 * 불러오기 요청 제한(skeleton.md "요청 제한 10초 · 다시 시도는 그 안에서") — 시간 제한이 걸린 읽기는 처음 요청부터
 * 합쳐 10초 안에서 2번까지, 1초 · 2초 뒤에 다시 한다(request-budget.ts). 10초를 넘기게 되면 하지 않는다.
 * 제한이 걸리지 않는 읽기(엑셀 내려받기 같은 blob)는 한 번만 다시 한다. 쓰기(mutation)는 다시 보내지 않는다.
 * 세션 확인(/login/check)은 자기 쿼리에서 retry: false 로 막는다.
 */
export function retryOnlyServerErrors(
  failureCount: number,
  error: unknown,
): boolean {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  if (status != null && status >= 400 && status < 500) {
    // 다시 하지 않고 끝난 불러오기 — 기억을 지운다(곧 다시 불러오면 새로 10초)
    endChain(isAxiosError(error) ? error.config : undefined);
    return false;
  }
  const bounded = mayRetryWithinBudget(
    failureCount,
    isAxiosError(error) ? error.config : undefined,
  );
  if (bounded !== undefined) return bounded;
  return failureCount < 1;
}

export { retryDelay } from './request-budget';
