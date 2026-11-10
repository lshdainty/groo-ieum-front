import { cn } from '@/shared/lib';
import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PasswordMatchProps {
  password: string;
  confirmPassword: string;
  className?: string;
}

/**
 * 새 비밀번호 ↔ 확인 입력의 일치 여부 실시간 표시.
 * 제출을 눌러야 "일치하지 않습니다"를 보게 되던 걸 입력 중에 알 수 있게 한다.
 *
 * 확인 입력이 비어 있을 땐 표시하지 않는다(입력 시작 전부터 불일치로 겁주지 않도록).
 * 불일치는 규칙 미달(= 아직 채우는 중)과 달리 두 값이 어긋난 '충돌'이라
 * 규칙 체크리스트의 muted 대신 destructive 로 분명하게 보여준다.
 */
const PasswordMatch = ({ password, confirmPassword, className }: PasswordMatchProps) => {
  const { t } = useTranslation('user');

  if (!confirmPassword) return null;

  const matched = password === confirmPassword;
  const Icon = matched ? Check : X;

  return (
    <p
      className={cn(
        'flex items-center gap-1.5 text-xs pt-0.5',
        matched ? 'text-fg-positive' : 'text-fg-critical',
        className
      )}
      aria-live='polite'
    >
      <Icon className='h-3.5 w-3.5 shrink-0' aria-hidden />
      <span>{matched ? t('passwordMatched') : t('passwordMismatch')}</span>
    </p>
  );
};

export { PasswordMatch };
