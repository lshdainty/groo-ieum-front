import { Button } from '@/shared/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Field, FieldError, FieldLabel } from '@/shared/ui/shadcn/field';
import { Input } from '@/shared/ui/shadcn/input';
import { Callout } from '@/shared/ds/callout';
import { useSnackbar } from '@/shared/ds/snackbar';
import { Spinner } from '@/shared/ui/shadcn/spinner';
import { PasswordRequirements } from '@/shared/ui/password-requirements/PasswordRequirements';
import { PasswordMatch } from '@/shared/ui/password-requirements/PasswordMatch';
import { useChangePasswordMutation } from '@/entities/user';
import { createNewPasswordSchema } from '@/shared/lib';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { readWriteFailure } from '@/shared/ui/groo/write-error'

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

interface PasswordChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PasswordChangeDialog = ({ open, onOpenChange }: PasswordChangeDialogProps) => {
  const { t } = useTranslation('user');
  const { t: tc } = useTranslation('common');
  const changePasswordMutation = useChangePasswordMutation();
  const snackbar = useSnackbar();
  // 저장 실패는 대화상자가 열린 채 맨 위 Callout — 서버 글 · axios 영어 글은 쓰지 않는다(write-error)
  const [saveError, setSaveError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSaveError(null);
  }

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

  useEffect(() => {
    if (open) {
      form.reset({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    }
  }, [open, form]);

  const onSubmit = (values: PasswordChangeFormValues) => {
    setSaveError(null);
    changePasswordMutation.mutate(
      {
        current_password: values.current_password,
        new_password: values.new_password,
        new_password_confirm: values.confirm_password,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          snackbar.show({ message: t('passwordChangeSuccess'), tone: 'positive' });
        },
        onError: (error) => {
          const { key } = readWriteFailure(error);
          if (key) setSaveError(tc(key));
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='min-[40rem]:max-w-[28rem]'>
        <DialogHeader>
          <DialogTitle>{t('passwordChange')}</DialogTitle>
          <DialogDescription>{t('passwordChangeDescription')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {saveError && (
            <Callout tone='critical' role='alert' className='mt-4' data-save-failure>
              {saveError}
            </Callout>
          )}
          <div className='grid gap-4 py-4'>
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
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={changePasswordMutation.isPending}
            >
              {tc('cancel')}
            </Button>
            <Button
              type='submit'
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending && <Spinner />}
              {changePasswordMutation.isPending ? tc('processing') : tc('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { PasswordChangeDialog };
