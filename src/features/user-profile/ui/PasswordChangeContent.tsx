import Logo from '@/shared/assets/img/groo.svg';
import LogoDark from '@/shared/assets/img/groo_dark.svg';
import { Button } from '@/shared/ui/shadcn/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { Field, FieldError, FieldLabel } from '@/shared/ui/shadcn/field';
import { Input } from '@/shared/ui/shadcn/input';
import { toast } from '@/shared/ui/shadcn/sonner';
import { Spinner } from '@/shared/ui/shadcn/spinner';
import { useTheme } from '@/shared/ui/shadcn/themeProvider';
import { PasswordRequirements } from '@/shared/ui/password-requirements/PasswordRequirements';
import { PasswordMatch } from '@/shared/ui/password-requirements/PasswordMatch';
import { useUser } from '@/entities/session';
import { useChangePasswordMutation } from '@/entities/user';
import { cn, createNewPasswordSchema } from '@/shared/lib'
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Lock, LogOut, ShieldCheck } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

interface PasswordChangeContentProps extends React.ComponentProps<'div'> {}

const PasswordChangeContent = ({ className, ...props }: PasswordChangeContentProps) => {
  return (
    <div className='bg-muted flex min-h-svh flex-col items-center justify-center p-6 min-[48rem]:p-10'>
      <div className='w-full max-w-[28rem]'>
        <div className={cn('flex flex-col gap-6', className)} {...props}>
          <PasswordChangeForm />
        </div>
      </div>
    </div>
  );
};

const createFormSchema = (t: (key: string) => string) =>
  z.object({
    current_password: z.string().min(1, t('currentPasswordRequired')),
    new_password: createNewPasswordSchema(t),
    confirm_password: z.string().min(1, t('confirmPasswordRequired')),
  }).refine((data) => data.new_password === data.confirm_password, {
    message: t('passwordMismatch'),
    path: ['confirm_password'],
  })
    // 서버도 현재와 동일한 비밀번호를 거부한다 — 두 값 모두 폼이 갖고 있으니 왕복 전에 거른다.
    .refine((data) => !data.current_password || data.new_password !== data.current_password, {
      message: t('passwordSameAsCurrent'),
      path: ['new_password'],
    });

type PasswordChangeFormValues = z.infer<ReturnType<typeof createFormSchema>>;

const PasswordChangeForm = () => {
  const { t } = useTranslation('user');
  const { t: tc } = useTranslation('common');
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { refreshUser, logout } = useUser();
  const changePasswordMutation = useChangePasswordMutation();

  const form = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(createFormSchema(t)),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  // 확인 입력 일치 표시용 — 입력할 때마다 갱신
  const newPassword = useWatch({ control: form.control, name: 'new_password' }) ?? '';

  const onSubmit = (values: PasswordChangeFormValues) => {
    changePasswordMutation.mutate(
      {
        current_password: values.current_password,
        new_password: values.new_password,
        new_password_confirm: values.confirm_password,
      },
      {
        onSuccess: async () => {
          toast.success(t('passwordChangeSuccess'));
          await refreshUser();
          navigate('/dashboard');
        },
        onError: (error) => {
          toast.error(error.message || t('passwordChangeError'));
        },
      }
    );
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <Card>
      <CardHeader className='text-center'>
        <div className='flex justify-center mb-4'>
          <img src={theme === 'light' ? Logo : LogoDark} alt='logo' className='h-8' />
        </div>
        <CardTitle className='text-xl'>{t('passwordChangeRequired')}</CardTitle>
        <CardDescription>{t('passwordChangeRequiredDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className='grid gap-4'>
            <Controller
              control={form.control}
              name='current_password'
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel>
                    <Lock className='h-4 w-4 text-muted-foreground inline-block' />
                    {t('currentPassword')}
                    <span className='text-destructive ml-0.5'>*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    type='password'
                    placeholder={t('currentPasswordPlaceholder')}
                  />
                  <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name='new_password'
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel>
                    <KeyRound className='h-4 w-4 text-muted-foreground inline-block' />
                    {t('newPassword')}
                    <span className='text-destructive ml-0.5'>*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    type='password'
                    placeholder={t('newPasswordPlaceholder')}
                  />
                  <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                  <PasswordRequirements password={field.value} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name='confirm_password'
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel>
                    <ShieldCheck className='h-4 w-4 text-muted-foreground inline-block' />
                    {t('confirmPassword')}
                    <span className='text-destructive ml-0.5'>*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    type='password'
                    placeholder={t('confirmPasswordPlaceholder')}
                  />
                  {/* 불일치는 아래 PasswordMatch 가 입력 중에 이미 보여주므로, 여기선 미입력 에러만 남긴다 */}
                  <FieldError
                    errors={fieldState.error && !field.value ? [fieldState.error] : undefined}
                  />
                  <PasswordMatch password={newPassword} confirmPassword={field.value} />
                </Field>
              )}
            />
            <Button
              type='submit'
              className='w-full'
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending && <Spinner />}
              {changePasswordMutation.isPending ? tc('processing') : t('passwordChange')}
            </Button>
            <div className='after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t'>
              <span className='bg-card text-muted-foreground relative z-10 px-2'>
                {tc('or')}
              </span>
            </div>
            <Button
              type='button'
              variant='outline'
              className='w-full'
              onClick={handleLogout}
            >
              <LogOut className='h-4 w-4' />
              {tc('logout')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export { PasswordChangeContent };
