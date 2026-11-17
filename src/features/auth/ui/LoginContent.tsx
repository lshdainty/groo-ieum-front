import { Button } from '@/shared/ds/button';
import { Callout } from '@/shared/ds/callout';
import { usePageTitle } from '@/shared/lib/page-title';
import { safeReturnPath, saveReturnPath } from '@/shared/lib/return-path';
import { startSsoLogin, startSsoLogout } from '@/features/auth/lib/sso-redirect';
import { HrLogo, OutsideShell } from '@/widgets/outside';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

/**
 * 로그인 콘텐츠 컴포넌트
 * 그루 담다와 같은 첫 화면 — 흰 면 가운데 로고(나무 56 + "그루 이음") · 부제 · [그루 계정으로 로그인].
 * SSO(그루 계정)로 리다이렉트하여 인증을 처리합니다.
 *
 * 로그아웃한 뒤(보안 점검 CLI-6) — 이음에서 로그아웃하면 이음만 끝나고 그루 계정(SSO) 로그인은 남는다.
 *   ?out=1    직접 로그아웃하고 왔다 — 안내 + 보조 단추 [그루 계정에서도 로그아웃](SSO 로그아웃을 들렀다 ?out=all 로 돌아온다)
 *   ?out=all  그루 계정에서도 로그아웃하고 돌아왔다 — 안내만(단추는 다시 두지 않는다)
 * 세션 만료로 온 길(?next=)에는 아무 안내도 없다.
 */
const LoginContent = () => {
  const { t } = useTranslation('login');
  const [params] = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);
  // 시작하지 못했을 때의 안내 — 서버 글이 아니라 고정 글, 폼(단추) 위 Callout 하나
  const [failed, setFailed] = useState(false);
  usePageTitle(t('title'));

  const out = params.get('out');
  const signedOut = out === '1';
  const accountSignedOut = out === 'all';

  // SSO로 리다이렉트 (PKCE 인가코드 흐름)
  // code_verifier/state 를 생성·보관하고 code_challenge(S256) 를 인가 요청에 첨부한다(sso-redirect.ts).
  // 직접 로그아웃한 표시가 남아 있으면 prompt=login 이 붙어 비밀번호를 다시 받는다.
  const handleSsoRedirect = async () => {
    setFailed(false);
    setIsRedirecting(true);
    try {
      // 직접 열었던 주소가 있으면(?next=) 로그인을 마친 뒤 그 화면으로 돌아오게 보관한다 — 같은 출처 경로만
      saveReturnPath(safeReturnPath(params.get('next')));
      await startSsoLogin();
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
          {signedOut && (
            <Callout tone='informative'>
              {t('signedOut.done')} {t('signedOut.accountStill')}
            </Callout>
          )}
          {accountSignedOut && <Callout tone='positive'>{t('signedOut.accountDone')}</Callout>}
          <div className='flex flex-col gap-x2'>
            <Button type='button' variant='neutralSolid' size='large' className='w-full' loading={isRedirecting} onClick={handleSsoRedirect}>
              {t('sso.login')}
            </Button>
            {/* 기다릴 일 없이 바로 떠나므로 로딩을 두지 않는다 — 뒤로 가기로 돌아온 화면에 원이 남지 않게 */}
            {signedOut && (
              <Button type='button' variant='neutralWeak' size='large' className='w-full' onClick={startSsoLogout}>
                {t('signedOut.signOutAccount')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </OutsideShell>
  );
};

export { LoginContent };
