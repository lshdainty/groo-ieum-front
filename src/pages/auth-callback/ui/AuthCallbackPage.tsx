import { sessionApi } from '@/entities/session';
import { getCodeVerifier, getSavedState, clearPkce } from '@/features/auth/lib/pkce';
import { loginPathFor, takeReturnPath } from '@/shared/lib/return-path';
import { ResultScreen, WaitingScreen } from '@/widgets/outside';
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
 */
const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const [failure, setFailure] = useState<CallbackFailure | null>(null);
  // 실패했을 때 [다시 로그인하기] 가 열려던 화면을 이어 가도록 꺼내 둔다
  const [returnTo, setReturnTo] = useState<string | null>(null);
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
        // verifier 없거나 state(CSRF) 불일치 시 거부
        if (!verifier || (savedState && returnedState && savedState !== returnedState)) {
          clearPkce();
          fail('stateMismatch');
          return;
        }
        try {
          const redirectUri = `${window.location.origin}/auth/callback`;
          await sessionApi.exchangeCode({ code, codeVerifier: verifier, redirectUri });
          clearPkce();
          window.history.replaceState({}, '', window.location.pathname);
          // 로그인하려던 화면이 있으면 그리로(같은 출처 경로만), 없으면 대시보드
          navigate(takeReturnPath() ?? '/dashboard', { replace: true });
        } catch (err) {
          console.error('Code exchange failed:', err);
          clearPkce();
          fail('exchangeFailed');
        }
        return;
      }

      // code 가 없으면 인증 실패 처리
      fail('noCode');
    };

    handleCallback();
  }, [navigate]);

  if (failure) {
    return (
      <ResultScreen
        kind='failure'
        title={t('callback.failedTitle')}
        description={t(`callback.${failure}`)}
        action={{ label: t('callback.retry'), onClick: () => navigate(loginPathFor(returnTo), { replace: true }) }}
      />
    );
  }

  return <WaitingScreen label={t('callback.finishing')} />;
};

export { AuthCallbackPage };
