import type { TypeResp } from '@/entities/type'
import { useUserIdDuplicateQuery, usePostUserInviteMutation, usePutInvitedUserMutation } from '@/entities/user'
import { useCountryCodeTypesQuery } from '@/entities/type'
import { Button } from '@/shared/ui/shadcn/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/shadcn/dialog'
import { Field, FieldError, FieldLabel } from '@/shared/ui/shadcn/field'
import { Input } from '@/shared/ui/shadcn/input'
import { InputDatePicker } from '@/shared/ui/shadcn/inputDatePicker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { cn } from '@/shared/lib'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Calendar, Clock, Globe, Mail, User as UserIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

const createFormSchema = (t: (key: string) => string, tc: (key: string) => string) => z.object({
  user_id: z.string().min(1, t('user.userIdRequired')),
  user_name: z.string().min(1, t('user.userNameRequired')),
  user_email: z.string().email(t('user.userEmailRequired')),
  join_date: z.string().min(1, t('user.joinDateRequired')),
  user_company_type: z.string().min(1, t('user.companyRequired')),
  user_work_time: z.string().min(1, t('user.workTimeRequired')),
  country_code: z.string().min(1, tc('countryRequired'))
})

type UserInviteFormValues = z.infer<ReturnType<typeof createFormSchema>>

interface UserInviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  companyOptions: TypeResp[]
  initialData?: {
    user_id: string
    user_name: string
    user_email: string
    user_company_type: string
    user_work_time: string
    join_date: string
    country_code: string
  }
}

const UserInviteDialog = ({ open, onOpenChange, title, companyOptions, initialData }: UserInviteDialogProps) => {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const [userIdToCheck, setUserIdToCheck] = useState('')
  const { mutateAsync: inviteUser, isPending: isInvitePending } = usePostUserInviteMutation()
  const { mutateAsync: updateInvitedUser, isPending: isUpdatePending } = usePutInvitedUserMutation()
  const { data: countryCodeOptions } = useCountryCodeTypesQuery()

  const isEditMode = !!initialData?.user_id
  const isPending = isInvitePending || isUpdatePending

  const { data: duplicateCheckResult, isLoading: isCheckingDuplicate } = useUserIdDuplicateQuery(userIdToCheck)

  const form = useForm<UserInviteFormValues>({
    resolver: zodResolver(createFormSchema(t, tc)),
    defaultValues: {
      user_id: initialData?.user_id || '',
      user_name: initialData?.user_name || '',
      user_email: initialData?.user_email || '',
      user_company_type: initialData?.user_company_type || companyOptions[0]?.code || '',
      user_work_time: initialData?.user_work_time || '9 ~ 18',
      join_date: initialData?.join_date || '',
      country_code: initialData?.country_code || 'KR'
    }
  })

  // 중복 체크 결과에 따라 에러 설정
  useEffect(() => {
    if (duplicateCheckResult && userIdToCheck) {
      if (duplicateCheckResult.duplicate) {
        form.setError('user_id', {
          type: 'manual',
          message: t('user.userIdDuplicate')
        })
      } else {
        form.clearErrors('user_id')
      }
    }
  }, [duplicateCheckResult, userIdToCheck, form, t])

  const handleUserIdBlur = () => {
    const userId = form.getValues('user_id')

    // 빈 값이면 체크하지 않음
    if (!userId || userId.trim() === '') {
      setUserIdToCheck('')
      return
    }

    // user_id를 설정하면 useGetUserIdDuplicate가 자동으로 호출됨
    setUserIdToCheck(userId)
  }

  const workTimeOptions = [
    { value: '8 ~ 17', className: 'text-rose-500 dark:text-rose-400' },
    { value: '9 ~ 18', className: 'text-sky-500 dark:text-sky-400' },
    { value: '10 ~ 19', className: 'text-emerald-500 dark:text-emerald-400' },
    { value: '13 ~ 21', className: 'text-amber-500 dark:text-amber-400' }
  ]

  const selectedWorkTime = workTimeOptions.find(option => option.value === form.watch('user_work_time'))

  useEffect(() => {
    if (open) {
      form.reset({
        user_id: initialData?.user_id || '',
        user_name: initialData?.user_name || '',
        user_email: initialData?.user_email || '',
        user_company_type: initialData?.user_company_type || companyOptions[0]?.code || '',
        user_work_time: initialData?.user_work_time || '9 ~ 18',
        join_date: initialData?.join_date || '',
        country_code: initialData?.country_code || 'KR'
      })
      setUserIdToCheck('') // 다이얼로그 열릴 때 중복 체크 상태 초기화
    }
  }, [open, form, companyOptions, initialData])

  const onSubmit = async (values: UserInviteFormValues) => {
    if (isEditMode) {
      // 수정 모드: PUT /users/{id}/invitations
      await updateInvitedUser({
        user_id: values.user_id,
        user_name: values.user_name,
        user_email: values.user_email,
        user_company_type: values.user_company_type,
        user_work_time: values.user_work_time,
        join_date: values.join_date,
        country_code: values.country_code
      })
    } else {
      // 신규 초대 모드: POST /users/invitations
      await inviteUser(values)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-[40rem]:max-w-[28rem] max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto py-6 space-y-4">
            <Controller
              control={form.control}
              name="user_name"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel>
                    {t('user.userName')}
                    <span className='text-destructive ml-0.5'>*</span>
                  </FieldLabel>
                  <Input {...field} />
                  <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="user_id"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel>
                    <UserIcon className='h-4 w-4 text-muted-foreground inline-block' /> {t('user.userId')}
                    <span className='text-destructive ml-0.5'>*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    onBlur={() => {
                      field.onBlur()
                      handleUserIdBlur()
                    }}
                    disabled={isCheckingDuplicate || !!initialData?.user_id}
                  />
                  {isCheckingDuplicate && (
                    <div className="text-xs text-muted-foreground mt-1">{t('user.checkingDuplicate')}</div>
                  )}
                  <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="user_email"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel>
                    <Mail className='h-4 w-4 text-muted-foreground inline-block' /> {t('user.userEmail')}
                    <span className='text-destructive ml-0.5'>*</span>
                  </FieldLabel>
                  <Input {...field} />
                  <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="join_date"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel>
                    <Calendar className='h-4 w-4 text-muted-foreground inline-block' /> {t('user.joinDate')}
                    <span className='text-destructive ml-0.5'>*</span>
                  </FieldLabel>
                  <InputDatePicker
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                  <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="user_company_type"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel>
                    <Building2 className='h-4 w-4 text-muted-foreground inline-block' /> {t('user.company')}
                    <span className='text-destructive ml-0.5'>*</span>
                  </FieldLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('user.companyPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {companyOptions.map(option => <SelectItem key={option.code} value={option.code}>{option.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="user_work_time"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel>
                    <Clock className='h-4 w-4 text-muted-foreground inline-block' /> {t('user.workTime')}
                    <span className='text-destructive ml-0.5'>*</span>
                  </FieldLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className={cn('w-full', selectedWorkTime?.className)}>
                      <SelectValue placeholder={t('user.workTimePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {workTimeOptions.map(option => <SelectItem key={option.value} value={option.value} className={option.className}>{option.value}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="country_code"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel>
                    <Globe className='h-4 w-4 text-muted-foreground inline-block' /> {tc('country')}
                    <span className='text-destructive ml-0.5'>*</span>
                  </FieldLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={tc('countryPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodeOptions?.map(option => <SelectItem key={option.code} value={option.code}>{option.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                </Field>
              )}
            />
          </div>
          <DialogFooter className="shrink-0">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {tc('cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!form.formState.isValid || isPending}>
              {isPending && <Spinner />}
              {isPending ? tc('processing') : isEditMode ? tc('edit') : t('user.invite')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { UserInviteDialog }
