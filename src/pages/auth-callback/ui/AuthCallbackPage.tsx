import { sessionApi } from '@/entities/session';
import { getCodeVerifier, getSavedState, clearPkce, wasReauthRequested } from '@/features/auth/lib/pkce';
import { startSsoLogin } from '@/features/auth/lib/sso-redirect';
import { isLoggedOutSsoLoginResponse } from '@/shared/api/failure-codes';
import { clearLogoutMark, setLogoutMark } from '@/shared/lib/logout-mark';
import { loginPathFor, saveReturnPath, takeReturnPath } from '@/shared/lib/return-path';
import { ResultScreen, WaitingScreen } from '@/widgets/outside';
import { isAxiosError } from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// 실패 갈래 — 글은 갈래로 고른다. 서버 글 · axios 영어 글(err.message)은 화면에 그리지 않는다(I-22 G 35)
type CallbackFailure = 'stateMismatch' | 'exchangeFailed' | 'noCode';

/**
 * SSO 인증 콜백 페이지
 * SSO에서 인증 완료 후 리다이렉트되어 JWT 토큰을 처리합니다.
 * SSO 토큰을 HR 토큰으로 교환하여 저장합니다.
 * 기다리는 동안은 흰 면 + 원, 실패하면 결과 화면 + [다시 로그인하기](저절로 넘어가지 않는다 — 사용자가 고른다).
 *
 * 하나만 저절로 다시 간다(보안 점검 CLI-6) — 이음에서 로그아웃한 그 SSO 로그인으로 돌아와 서버가 교환을 거절하면(AUTH_010)
 * 비밀번호를 다시 받도록 prompt=login 으로 SSO 로그인을 한 번 다시 시작한다. 계정 문제가 아니라 다시 인증하면 풀리는 거절이다.
 * 이미 prompt=login 으로 보낸 시도가 또 거절되면 맴돌지 않고 실패 화면을 보여 준다.
 *
 * 그 밖의 교환 실패(이음 회원이 아닌 그루 계정 · 비활성 · 연결 불일치 · SSO 오류 — exchangeFailed)도 같은 표시를 남긴다.
 * 그루 계정(SSO) 로그인이 살아 있어 그냥 다시 시작하면 SSO 가 같은 계정으로 바로 코드를 내주고 같은 실패로 돌아온다 —
 * 비밀번호 칸이 한 번도 안 떠 계정을 바꿀 수 없다. 그래서 [다시 로그인하기] 는 prompt=login 으로 SSO 로그인을 바로 시작하고,
 * 로그인 화면의 [그루 계정으로 로그인] 도 표시를 읽어 prompt=login 이다. 저절로 다시 가지는 않는다 — 고르는 건 사용자다.
 */
const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const [failure, setFailure] = useState<CallbackFailure | null>(null);
  // 실패했을 때 [다시 로그인하기] 가 열려던 화면을 이어 가도록 꺼내 둔다
  const [returnTo, setReturnTo] = useState<string | null>(null);
  // [다시 로그인하기] 가 SSO 로 떠나는 동안(exchangeFailed) — 단추 로딩
  const [retrying, setRetrying] = useState(false);
  // StrictMode/재렌더로 effect 가 2번 돌아도 일회용 code 를 단 한 번만 교환하도록 가드
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    const fail = (reason: CallbackFailure) => {
      setReturnTo(takeReturnPath());
      setFailure(reason);
    };
    const handleCallback = async () => {
      // 신규: OAuth2 Authorization Code + PKCE (?code=&state=)
      const query = new URLSearchParams(window.location.search);
      const code = query.get('code');
      if (code) {
        const returnedState = query.get('state');
        const savedState = getSavedState();
        const verifier = getCodeVerifier();
        // verifier 가 없거나 state(CSRF) 가 저장값과 다르면 거부한다. 주소에 state 가 없거나
        // 저장해 둔 state 가 없는 것도 불일치다 — 한쪽이 비었다고 검사를 건너뛰면 공격자가
        // state 를 뺀 주소로 자기 code 를 피해자 브라우저에서 교환시킬 수 있다(보안 점검 CLI-5).
        if (!verifier || !savedState || !returnedState || savedState !== returnedState) {
          clearPkce();
          fail('stateMismatch');
          return;
        }
        // 이번 시도를 prompt=login 으로 보냈는가 — clearPkce 가 같이 지우므로 먼저 읽는다
        const reauthRequested = wasReauthRequested();
        try {
          const redirectUri = `${window.location.origin}/auth/callback`;
          await sessionApi.exchangeCode({ code, codeVerifier: verifier, redirectUri });
          clearPkce();
          // 다시 들어왔다 — 직접 로그아웃한 표시를 걷는다(다음 로그인부터는 SSO 로그인을 그대로 쓴다)
          clearLogoutMark();
          window.history.replaceState({}, '', window.location.pathname);
          // 로그인하려던 화면이 있으면 그리로(같은 출처 경로만), 없으면 대시보드
          navigate(takeReturnPath() ?? '/dashboard', { replace: true });
        } catch (error) {
          // 오류를 콘솔에 남기지 않는다 — axios 오류에는 요청 본문(인가 code · code_verifier)이 실려 있다(보안 점검 CLI-5)
          clearPkce();
          // 이음에서 로그아웃한 그 SSO 로그인이다(AUTH_010) — 응답의 code 만 읽는다. 표시를 남기고 비밀번호를 다시 받으러 간다.
          // 복귀 경로는 꺼내지 않고 둔다(다시 돌아온 콜백이 쓴다). 떠나는 동안은 기다림 화면 그대로다.
          if (!reauthRequested && isAxiosError(error) && isLoggedOutSsoLoginResponse(error.response?.data)) {
            setLogoutMark();
            try {
              await startSsoLogin({ reauth: true });
              return;
            } catch {
              // 다시 시작하지 못했다(저장소 · crypto) — 아래 실패 화면으로
              clearPkce();
            }
          }
          // 이음을 쓸 수 없는 계정 등으로 교환이 거절됐다 — 그루 계정 로그인이 살아 있어 그냥 다시 가면 같은 계정으로 돌아온다.
          // 다음 로그인은 비밀번호를 받게(prompt=login) 표시를 남긴다 — 계정을 바꿀 수 있다. 저절로 다시 가지는 않는다.
          setLogoutMark();
          fail('exchangeFailed');
        }
        return;
      }

      // code 가 없으면 인증 실패 처리
      fail('noCode');
    };

    handleCallback();
  }, [navigate]);

  // [다시 로그인하기] — 교환이 거절됐으면(exchangeFailed) 비밀번호를 받는 SSO 로그인(prompt=login)을 바로 시작해 계정을 바꿀 수 있게 한다.
  // 열려던 화면은 다시 보관해 둔다(실패 때 꺼냈다). 시작하지 못하면(저장소 · crypto) 로그인 화면으로 — 거기서도 표시를 읽어 prompt=login 이다.
  // 그 밖의 실패(state 불일치 · code 없음)는 계정 문제가 아니라 로그인 화면으로 간다.
  const handleRetry = async () => {
    if (failure === 'exchangeFailed') {
      setRetrying(true);
      saveReturnPath(returnTo);
      try {
        await startSsoLogin({ reauth: true });
        return;
      } catch {
        clearPkce();
        setRetrying(false);
      }
    }
    navigate(loginPathFor(returnTo), { replace: true });
  };

  if (failure) {
    return (
      <ResultScreen
        kind='failure'
        title={t('callback.failedTitle')}
        description={t(`callback.${failure}`)}
        action={{ label: t('callback.retry'), onClick: handleRetry, loading: retrying }}
      />
    );
  }

  return <WaitingScreen label={t('callback.finishing')} />;
};

export { AuthCallbackPage };
