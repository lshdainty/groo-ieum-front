import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/shared/ui/shadcn/dialog'
import { Button } from '@/shared/ui/shadcn/button'
import { Input } from '@/shared/ui/shadcn/input'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import {
  Field,
  FieldLabel,
  FieldError
} from '@/shared/ui/shadcn/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/ui/shadcn/select'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { PostDepartmentReq, PutDepartmentReq } from '@/entities/department'
import { useUsersQuery } from '@/entities/user'

type DepartmentFormValues = z.infer<ReturnType<typeof createDepartmentFormSchema>>

const createDepartmentFormSchema = (t: (key: string) => string) => z.object({
  department_name: z.string().min(1, { message: t('department.nameEnRequired') }),
  department_name_kr: z.string().min(1, { message: t('department.nameKoRequired') }),
  parent_id: z.number().nullable(),
  head_user_id: z.string().optional(),
  color_code: z.string().optional(),
  tree_level: z.number().optional(),
  department_desc: z.string().optional(),
  company_id: z.string().optional(),
})

interface DepartmentFormDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSave: (formData: PostDepartmentReq | { departmentId: number; data: PutDepartmentReq }) => void
  initialData?: any
  isEditing?: boolean
  isAddingChild?: boolean
  parentId?: number | null
  companyId?: string
}

const DepartmentFormDialog = ({
  isOpen,
  onOpenChange,
  onSave,
  initialData = null,
  isEditing = false,
  isAddingChild = false,
  parentId,
  companyId
}: DepartmentFormDialogProps) => {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { data: users, isLoading: usersLoading } = useUsersQuery()

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(createDepartmentFormSchema(t)),
    defaultValues: {
      department_name: '',
      department_name_kr: '',
      parent_id: null,
      head_user_id: '',
      color_code: '',
      tree_level: 0,
      department_desc: '',
      company_id: '',
    },
    mode: 'onChange',
  })

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        form.reset({
          department_name: initialData.department_name || '',
          department_name_kr: initialData.department_name_kr || '',
          parent_id: initialData.parent_id ?? null,
          head_user_id: initialData.head_user_id || '',
          color_code: initialData.color_code || '',
          tree_level: initialData.tree_level || 0,
          department_desc: initialData.department_desc || '',
          company_id: initialData.company_id || companyId || '',
        })
      } else {
        form.reset({
          department_name: '',
          department_name_kr: '',
          parent_id: isAddingChild && typeof parentId === 'number' ? parentId : null,
          head_user_id: '',
          color_code: '',
          tree_level: isAddingChild && typeof parentId === 'number' && initialData ? (initialData.tree_level || 0) + 1 : 0,
          department_desc: '',
          company_id: companyId || '',
        })
      }
    }
  }, [isOpen, isEditing, initialData, form])

  const onSubmit = (values: DepartmentFormValues): void => {
    if (isEditing && !isAddingChild && initialData?.department_id) {
      // 수정 모드
      const updateData: PutDepartmentReq = {
        department_name: values.department_name,
        department_name_kr: values.department_name_kr,
        parent_id: values.parent_id,
        head_user_id: values.head_user_id || undefined,
        color_code: values.color_code || undefined,
        tree_level: values.tree_level,
        department_desc: values.department_desc || undefined,
        company_id: values.company_id || undefined,
      }
      onSave({ departmentId: initialData.department_id, data: updateData })
    } else {
      // 생성 모드 (새 부서 또는 하위 부서 추가)
      const createData: PostDepartmentReq = {
        department_name: values.department_name,
        department_name_kr: values.department_name_kr,
        parent_id: values.parent_id,
        head_user_id: values.head_user_id || undefined,
        color_code: values.color_code || undefined,
        tree_level: values.tree_level,
        department_desc: values.department_desc || undefined,
        company_id: values.company_id || undefined,
      }
      onSave(createData)
    }
  }

  const getDialogTitle = () => {
    if (isAddingChild) return t('department.addSubTitle')
    if (isEditing) return t('department.editTitle')
    return t('department.addTitle')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-[32rem]'>
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <Controller
              control={form.control}
              name='department_name_kr'
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel>
                    {t('department.nameKo')}
                    <span className='text-destructive ml-0.5'>*</span>
                  </FieldLabel>
                  <Input placeholder={t('department.nameKoPlaceholder')} {...field} />
                  <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name='department_name'
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel>
                    {t('department.nameEn')}
                    <span className='text-destructive ml-0.5'>*</span>
                  </FieldLabel>
                  <Input placeholder={t('department.nameEnPlaceholder')} {...field} />
                  <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                </Field>
              )}
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <Controller
              control={form.control}
              name='head_user_id'
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel>{t('department.leader')}</FieldLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value === 'none' ? '' : value)
                    }}
                    value={field.value || 'none'}
                    disabled={usersLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('department.leaderPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>{tc('selectNone')}</SelectItem>
                      {users?.map((user) => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          {user.user_name} ({user.user_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name='color_code'
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel>{t('department.color')}</FieldLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value === 'none' ? '' : value)
                    }}
                    value={field.value || 'none'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={tc('colorSelect')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>
                        <div className='flex items-center gap-2'>
                          <div className='size-4 rounded-full border-2 border-muted-foreground/30' />
                          <span>{tc('selectNone')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value='chart-1'>
                        <div className='flex items-center gap-2'>
                          <div className='size-4 rounded-full bg-chart-1' />
                          <span>{tc('colorBlue')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value='chart-2'>
                        <div className='flex items-center gap-2'>
                          <div className='size-4 rounded-full bg-chart-2' />
                          <span>{tc('colorGreen')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value='chart-3'>
                        <div className='flex items-center gap-2'>
                          <div className='size-4 rounded-full bg-chart-3' />
                          <span>{tc('colorYellow')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value='chart-4'>
                        <div className='flex items-center gap-2'>
                          <div className='size-4 rounded-full bg-chart-4' />
                          <span>{tc('colorPurple')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value='chart-5'>
                        <div className='flex items-center gap-2'>
                          <div className='size-4 rounded-full bg-chart-5' />
                          <span>{tc('colorRed')}</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                </Field>
              )}
            />
          </div>
          <Controller
            control={form.control}
            name='department_desc'
            render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel>{t('department.description')}</FieldLabel>
                <Textarea
                  placeholder={t('department.descriptionPlaceholder')}
                  rows={2}
                  {...field}
                />
                <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
              </Field>
            )}
          />
          <div className='flex justify-end space-x-2 pt-4'>
            <Button
              type='button'
              variant='secondary'
              onClick={() => onOpenChange(false)}
            >
              {tc('cancel')}
            </Button>
            <Button
              type='submit'
              disabled={!form.formState.isValid || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && <Spinner />}
              {form.formState.isSubmitting ? tc('saving') : tc('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { DepartmentFormDialog }
