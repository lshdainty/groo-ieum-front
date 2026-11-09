import { Button } from '@/shared/ds/button';
import { Callout } from '@/shared/ds/callout';
import { usePageTitle } from '@/shared/lib/page-title';
import { safeReturnPath, saveReturnPath } from '@/shared/lib/return-path';
import { config } from '@/shared/config'
import { generateCodeVerifier, codeChallenge, generateState, savePkce } from '@/features/auth/lib/pkce';
import { HrLogo, OutsideShell } from '@/widgets/outside';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

/**
 * 로그인 콘텐츠 컴포넌트
 * 그루 담다와 같은 첫 화면 — 흰 면 가운데 로고(나무 56 + "그루 이음") · 부제 · [그루 계정으로 로그인].
 * SSO(그루 계정)로 리다이렉트하여 인증을 처리합니다.
 */
const LoginContent = () => {
  const { t } = useTranslation('login');
  const [params] = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);
  // 시작하지 못했을 때의 안내 — 서버 글이 아니라 고정 글, 폼(단추) 위 Callout 하나
  const [failed, setFailed] = useState(false);
  usePageTitle(t('title'));

  // SSO로 리다이렉트 (PKCE 인가코드 흐름)
  // code_verifier/state 를 생성·보관하고 code_challenge(S256) 를 인가 요청에 첨부한다.
  const handleSsoRedirect = async () => {
    setFailed(false);
    setIsRedirecting(true);
    try {
      // 직접 열었던 주소가 있으면(?next=) 로그인을 마친 뒤 그 화면으로 돌아오게 보관한다 — 같은 출처 경로만
      saveReturnPath(safeReturnPath(params.get('next')));
      const verifier = generateCodeVerifier();
      const state = generateState();
      savePkce(verifier, state);
      const challenge = await codeChallenge(verifier);
      const callbackUrl = `${window.location.origin}/auth/callback`;
      const query = new URLSearchParams({
        redirect_uri: callbackUrl,
        client_id: 'hr',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state,
      });
      window.location.href = `${config.ssoUrl}/login?${query.toString()}`;
    } catch {
      setIsRedirecting(false);
      setFailed(true);
    }
  };

  return (
    <OutsideShell>
      <div className='flex w-full max-w-[384px] flex-col'>
        <HrLogo as='h1' subtitle={t('sso.description')} />
        <div className='mt-x8 flex flex-col gap-x4'>
          {failed && <Callout tone='critical' role='alert'>{t('sso.failed')}</Callout>}
          <Button type='button' variant='neutralSolid' size='large' className='w-full' loading={isRedirecting} onClick={handleSsoRedirect}>
            {t('sso.login')}
          </Button>
        </div>
      </div>
    </OutsideShell>
  );
};

export { LoginContent };
