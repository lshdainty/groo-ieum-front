import { Button } from '@/shared/ds/button';
import { Callout } from '@/shared/ds/callout';
import { Field } from '@/shared/ds/field';
import { Input } from '@/shared/ds/input';
import { useSnackbar } from '@/shared/ds/snackbar';
import { PASSWORD_RULES } from '@/shared/lib';
import { usePageTitle } from '@/shared/lib/page-title';
import { claimFailure } from '@/shared/api/failure';
import { useUser } from '@/entities/session';
import { useChangePasswordMutation } from '@/entities/user';
import { HrLogo, OutsideShell } from '@/widgets/outside';
import { isAxiosError } from 'axios';
import { Check } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

type FieldName = 'current' | 'next' | 'confirm';
type Errors = Partial<Record<FieldName, string>>;
type Failure = 'invalid' | 'later';

// 규칙 한 줄 — 앞 체크 14 + 글 t4, 맞으면 fg-positive · 아직이면 fg-neutral-subtle. 규칙 줄 사이 4
const RuleLine = ({ ok, children }: { ok: boolean; children: string }) => (
  <li className={`flex items-center gap-x1_5 text-t4 ${ok ? 'text-fg-positive' : 'text-fg-neutral-subtle'}`}>
    <Check aria-hidden className='size-[14px] shrink-0' />
    <span>{children}</span>
  </li>
);

/**
 * 실패의 까닭은 응답 code 로 고른다 — 서버 글 · axios 영어 글은 그리지 않는다.
 * USER_003 = 그루 계정이 바꾸기를 거절한 모든 까닭(hr-back 이 이 코드 하나로 넘긴다) → 임시 비밀번호를 다시 확인.
 * 그 밖(SSO_001 · 5xx · 응답 없음) → 잠시 뒤 다시.
 */
const failureOf = (error: unknown): Failure => {
  if (!isAxiosError(error)) return 'later';
  const code = (error.response?.data as { code?: unknown } | undefined)?.code;
  return code === 'USER_003' ? 'invalid' : 'later';
};

/**
 * 비밀번호 강제 변경 — 그루 계정 폼 모양: 흰 면 · 로고 · 제목 · 설명 · 칸 셋 · [비밀번호 바꾸기] · [로그아웃].
 * 칸 오류는 칸 아래, 요청 실패는 폼 맨 위 Callout 하나. 확인 칸은 떠날 때만 검사하고(입력 중 글자마다 보이지 않는다),
 * 오류가 붙은 칸은 고치는 동안 다시 검사한다.
 */
const PasswordChangeContent = () => {
  const { t } = useTranslation('user');
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const { refreshUser, logout } = useUser();
  const changePasswordMutation = useChangePasswordMutation();
  usePageTitle(t('pwForce.docTitle'));

  const [values, setValues] = useState<Record<FieldName, string>>({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<Failure | null>(null);
  const [pending, setPending] = useState(false);

  const check = (name: FieldName, v: Record<FieldName, string>): string | undefined => {
    if (name === 'current') return v.current ? undefined : t('pwForce.error.currentRequired');
    if (name === 'next') {
      if (!v.next) return t('pwForce.error.newRequired');
      const [lengthRule, specialRule] = PASSWORD_RULES;
      if (!lengthRule.test(v.next)) return t('pwForce.error.tooShort');
      if (!specialRule.test(v.next)) return t('pwForce.error.noSpecial');
      // 서버도 현재와 같은 비밀번호를 거부한다 — 두 값이 폼에 있으니 왕복 전에 거른다
      if (v.current && v.next === v.current) return t('pwForce.error.same');
      return undefined;
    }
    if (!v.confirm) return t('pwForce.error.confirmRequired');
    return v.confirm === v.next ? undefined : t('pwForce.error.mismatch');
  };

  const change = (name: FieldName, value: string) => {
    const nextValues = { ...values, [name]: value };
    setValues(nextValues);
    // 오류가 붙은 칸만 다시 검사한다 — 새 비밀번호가 바뀌면 확인 칸의 "서로 달라요" 도 다시 본다
    setErrors((prev) => {
      const out: Errors = { ...prev };
      (['current', 'next', 'confirm'] as FieldName[]).forEach((n) => {
        if (prev[n]) out[n] = check(n, nextValues);
      });
      return out;
    });
  };

  // 확인 칸은 떠날 때 — 비어 있으면 아직 안 쓴 것이라 제출 때 말한다
  const leaveConfirm = () => {
    if (!values.confirm) return;
    setErrors((prev) => ({ ...prev, confirm: check('confirm', values) }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setFailure(null);
    const next: Errors = {
      current: check('current', values),
      next: check('next', values),
      confirm: check('confirm', values),
    };
    setErrors(next);
    if (next.current || next.next || next.confirm) return;

    setPending(true);
    try {
      await changePasswordMutation.mutateAsync({
        current_password: values.current,
        new_password: values.next,
        new_password_confirm: values.confirm,
      });
      snackbar.show({ message: t('pwForce.done') });
      await refreshUser();
      navigate('/dashboard');
    } catch (error) {
      // 값은 남긴다. 고정 글로 직접 알리므로 쓰기 실패 그물(Snackbar)이 같은 실패를 다시 알리지 않게 가져간다
      claimFailure(error);
      setFailure(failureOf(error));
      setPending(false);
    }
  };

  return (
    <OutsideShell>
      <div className='flex w-full max-w-[384px] flex-col'>
        <HrLogo />
        <h1 className='m-0 mt-x8 break-keep text-center text-t8 font-bold text-fg-neutral [overflow-wrap:break-word] min-[48rem]:text-screen-title'>
          {t('pwForce.title')}
        </h1>
        <p className='m-0 mt-x2 break-keep text-center text-t5 font-normal text-fg-neutral-muted [overflow-wrap:break-word]'>
          {t('pwForce.description')}
        </p>
        <form noValidate onSubmit={onSubmit} className='mt-x6 flex flex-col'>
          {failure && (
            <Callout tone='critical' role='alert' className='mb-x4'>
              {t(`pwForce.failed.${failure}`)}
            </Callout>
          )}
          <div className='flex flex-col gap-x6'>
            <Field id='current-password' label={t('pwForce.current')} invalid={!!errors.current} errorMessage={errors.current}>
              <Input
                type='password'
                value={values.current}
                onChange={(e) => change('current', e.target.value)}
                placeholder={t('pwForce.currentPlaceholder')}
                autoComplete='current-password'
              />
            </Field>
            <div className='flex flex-col gap-x2'>
              <Field id='new-password' label={t('pwForce.new')} invalid={!!errors.next} errorMessage={errors.next}>
                <Input
                  type='password'
                  value={values.next}
                  onChange={(e) => change('next', e.target.value)}
                  autoComplete='new-password'
                />
              </Field>
              {/* 입력 중 실시간 규칙 — 서버 정책과 1:1(PASSWORD_RULES). 비었을 땐 두지 않는다 */}
              {values.next && (
                <ul aria-live='polite' className='m-0 flex list-none flex-col gap-x1 p-0'>
                  {PASSWORD_RULES.map((rule) => (
                    <RuleLine key={rule.key} ok={rule.test(values.next)}>
                      {t(rule.labelKey)}
                    </RuleLine>
                  ))}
                </ul>
              )}
            </div>
            <Field id='confirm-password' label={t('pwForce.confirm')} invalid={!!errors.confirm} errorMessage={errors.confirm}>
              <Input
                type='password'
                value={values.confirm}
                onChange={(e) => change('confirm', e.target.value)}
                onBlur={leaveConfirm}
                placeholder={t('pwForce.confirmPlaceholder')}
                autoComplete='new-password'
              />
            </Field>
          </div>
          <Button type='submit' variant='neutralSolid' size='large' className='mt-x8 w-full' loading={pending}>
            {t('pwForce.submit')}
          </Button>
          <Button type='button' variant='ghost' size='small' ghostColor='neutralMuted' className='mt-x4 self-center' onClick={logout}>
            {t('pwForce.logout')}
          </Button>
        </form>
      </div>
    </OutsideShell>
  );
};

export { PasswordChangeContent };
