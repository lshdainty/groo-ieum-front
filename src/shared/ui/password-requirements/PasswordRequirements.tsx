import { PASSWORD_RULES, cn } from '@/shared/lib';
import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PasswordRequirementsProps {
  password: string;
  className?: string;
}

/**
 * 비밀번호 규칙 실시간 체크리스트.
 * 확인 버튼을 누르기 전에도 어떤 조건이 미달인지 바로 보여준다 — 서버 정책과 동일한
 * `PASSWORD_RULES` 를 그대로 쓰므로 정책이 바뀌면 함께 따라간다.
 *
 * 값이 비어 있을 땐 표시하지 않는다(입력 시작 전부터 X 로 겁주지 않도록).
 */
const PasswordRequirements = ({ password, className }: PasswordRequirementsProps) => {
  const { t } = useTranslation('user');

  if (!password) return null;

  return (
    <ul className={cn('space-y-1 pt-0.5', className)} aria-live='polite'>
      {PASSWORD_RULES.map((rule) => {
        const satisfied = rule.test(password);
        const Icon = satisfied ? Check : X;
        return (
          <li
            key={rule.key}
            className={cn(
              'flex items-center gap-1.5 text-xs',
              satisfied ? 'text-fg-positive' : 'text-fg-neutral-muted'
            )}
          >
            <Icon className='h-3.5 w-3.5 shrink-0' aria-hidden />
            <span>{t(rule.labelKey)}</span>
          </li>
        );
      })}
    </ul>
  );
};

export { PasswordRequirements };
