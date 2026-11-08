import loginBG from '@/shared/assets/img/login_bg.jpg';
import Logo from '@/shared/assets/img/groo.svg';
import LogoDark from '@/shared/assets/img/groo_dark.svg';
import { Button } from '@/shared/ui/shadcn/button';
import { Card, CardContent } from '@/shared/ui/shadcn/card';
import { Spinner } from '@/shared/ui/shadcn/spinner';
import { useTheme } from '@/shared/ui/shadcn/themeProvider';
import { config } from '@/shared/config'
import { cn } from '@/shared/lib'
import { generateCodeVerifier, codeChallenge, generateState, savePkce } from '@/features/auth/lib/pkce';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface LoginContentProps extends React.ComponentProps<'div'> {}

/**
 * 로그인 콘텐츠 컴포넌트
 * SSO로 리다이렉트하여 인증을 처리합니다.
 */
const LoginContent = ({ className, ...props }: LoginContentProps) => {
  return (
    <div className='bg-muted flex min-h-svh flex-col items-center justify-center p-6 min-[48rem]:p-10'>
      <div className='w-full max-w-[24rem] min-[48rem]:max-w-6xl'>
        <div className={cn('flex flex-col gap-6 h-[700px]', className)} {...props}>
          <Card className='overflow-hidden p-0 h-full'>
            <CardContent className='grid p-0 min-[48rem]:grid-cols-[2fr_1fr] h-full'>
              <div className='bg-muted relative hidden min-[48rem]:block'>
                <img
                  src={loginBG}
                  alt='Image'
                  className='absolute inset-0 h-full w-full object-cover'
                />
              </div>
              <div className='p-6 min-[48rem]:p-8 h-full flex justify-center'>
                <div className='flex flex-col justify-center gap-6 w-full'>
                  <LoginForm />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

/**
 * 로그인 폼 컴포넌트
 * SSO로 리다이렉트하는 버튼을 표시합니다.
 */
const LoginForm = () => {
  const { t } = useTranslation('login');
  const { theme } = useTheme();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // SSO로 리다이렉트 (PKCE 인가코드 흐름)
  // code_verifier/state 를 생성·보관하고 code_challenge(S256) 를 인가 요청에 첨부한다.
  const handleSsoRedirect = async () => {
    setIsRedirecting(true);
    const verifier = generateCodeVerifier();
    const state = generateState();
    savePkce(verifier, state);
    const challenge = await codeChallenge(verifier);
    const callbackUrl = `${window.location.origin}/auth/callback`;
    const params = new URLSearchParams({
      redirect_uri: callbackUrl,
      client_id: 'hr',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state,
    });
    window.location.href = `${config.ssoUrl}/login?${params.toString()}`;
  };

  // 자동 리다이렉트 (선택적 - 필요시 활성화)
  useEffect(() => {
    // 자동 리다이렉트를 원하면 아래 주석 해제
    // handleSsoRedirect();
  }, []);

  return (
    <div className='w-full'>
      <div className='flex flex-col justify-center gap-6'>
        <div className='flex flex-col items-center text-center'>
          <img src={theme == 'light' ? Logo : LogoDark} alt='logo' />
        </div>
        <div className='text-center'>
          <p className='text-muted-foreground mb-6'>
            {t('sso.description', '로그인하려면 아래 버튼을 클릭하세요.')}
          </p>
          <Button
            type='button'
            className='w-full'
            size='lg'
            onClick={handleSsoRedirect}
            disabled={isRedirecting}
          >
            {isRedirecting && <Spinner className='mr-2' />}
            {isRedirecting ? t('sso.redirecting', '로그인 페이지로 이동 중...') : t('sso.login', '로그인')}
          </Button>
        </div>
        <div className='text-center text-sm text-muted-foreground'>
          <p>{t('sso.notice', '통합 인증 시스템(SSO)을 통해 로그인합니다.')}</p>
        </div>
      </div>
    </div>
  );
};

export { LoginContent };
