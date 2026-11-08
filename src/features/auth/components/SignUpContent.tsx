import Logo from '@/shared/assets/img/groo.svg';
import LogoDark from '@/shared/assets/img/groo_dark.svg';
import { Button } from '@/shared/ui/shadcn/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { Spinner } from '@/shared/ui/shadcn/spinner';
import { useTheme } from '@/shared/ui/shadcn/themeProvider';
import { config } from '@/shared/config'
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

/**
 * 회원가입 콘텐츠 컴포넌트
 * SSO로 리다이렉트하여 회원가입을 처리합니다.
 */
const SignUpContent = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useTranslation('login');
  const [isRedirecting, setIsRedirecting] = useState(false);

  // SSO 회원가입 URL 생성
  const getSsoRegisterUrl = () => {
    const ssoUrl = config.ssoUrl;
    // 현재 페이지를 callback URL로 설정
    const callbackUrl = `${window.location.origin}/auth/callback`;
    return `${ssoUrl}/register?redirect_uri=${encodeURIComponent(callbackUrl)}`;
  };

  // SSO로 리다이렉트
  const handleSsoRedirect = () => {
    setIsRedirecting(true);
    window.location.href = getSsoRegisterUrl();
  };

  // 로그인 페이지로 이동
  const handleSwitchToLogin = () => {
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted py-12 px-4 min-[40rem]:px-6 min-[64rem]:px-8">
      <Card className="w-full max-w-[28rem]">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <img
              src={theme === 'light' ? Logo : LogoDark}
              alt="Groo Logo"
              className="h-12"
            />
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {t('signup.title', '회원가입')}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {t('sso.signupDescription', '통합 인증 시스템(SSO)을 통해 회원가입합니다.')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-4">
            <Button
              type="button"
              className="w-full"
              size="lg"
              onClick={handleSsoRedirect}
              disabled={isRedirecting}
            >
              {isRedirecting && <Spinner className="mr-2" />}
              {isRedirecting ? t('sso.redirecting', '회원가입 페이지로 이동 중...') : t('signup.goToSso', '회원가입하기')}
            </Button>
            <div className="text-center text-sm mt-2">
              <span className="text-muted-foreground">{t('signup.hasAccount', '이미 계정이 있으신가요?')}</span>{' '}
              <a
                href="#"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  handleSwitchToLogin();
                }}
              >
                {t('tab.login', '로그인')}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { SignUpContent };
