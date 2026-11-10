import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '@/shared/ds/button';
import { Callout } from '@/shared/ds/callout';
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogCancel, ResponsiveDialogContent, ResponsiveDialogFooter } from '@/shared/ds/dialog';
import { Field } from '@/shared/ds/field';
import { Input } from '@/shared/ds/input';
import { useSnackbar } from '@/shared/ds/snackbar';
import { PasswordRequirements } from '@/shared/ui/password-requirements/PasswordRequirements';
import { PasswordMatch } from '@/shared/ui/password-requirements/PasswordMatch';
import { useChangePasswordMutation } from '@/entities/user';
import { createNewPasswordSchema } from '@/shared/lib';
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
    <ResponsiveDialog open={open} form dirty={form.formState.isDirty} busy={changePasswordMutation.isPending} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent title={t('passwordChange')} description={t('passwordChangeDescription')}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className='flex min-h-0 flex-1 flex-col'>
          <ResponsiveDialogBody>
            {saveError && (
              <Callout tone='critical' role='alert' className='mb-x4' data-save-failure>
                {saveError}
              </Callout>
            )}
            <div className='flex flex-col gap-x6 pb-x2'>
              <Controller
                control={form.control}
                name='current_password'
                render={({ field, fieldState }) => (
                  <Field label={t('currentPassword')} showRequiredIndicator invalid={!!fieldState.error} errorMessage={fieldState.error?.message}>
                    <Input {...field} type='password' placeholder={t('currentPasswordPlaceholder')} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name='new_password'
                render={({ field, fieldState }) => (
                  <Field label={t('newPassword')} showRequiredIndicator invalid={!!fieldState.error} errorMessage={fieldState.error?.message}>
                    <Input {...field} type='password' placeholder={t('newPasswordPlaceholder')} />
                    <PasswordRequirements password={field.value} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name='confirm_password'
                render={({ field, fieldState }) => (
                  // 불일치는 아래 PasswordMatch 가 입력 중에 이미 보여주므로, 여기선 미입력 에러만 남긴다
                  <Field label={t('confirmPassword')} showRequiredIndicator invalid={!!fieldState.error && !field.value} errorMessage={fieldState.error?.message}>
                    <Input {...field} type='password' placeholder={t('confirmPasswordPlaceholder')} />
                    <PasswordMatch password={newPassword} confirmPassword={field.value} />
                  </Field>
                )}
              />
            </div>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <ResponsiveDialogCancel>{tc('cancel')}</ResponsiveDialogCancel>
            <Button type='submit' loading={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending ? tc('processing') : tc('save')}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};

export { PasswordChangeDialog };
