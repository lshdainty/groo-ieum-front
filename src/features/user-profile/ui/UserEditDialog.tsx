import { useRef, useState } from 'react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

import { config } from '@/shared/config'
import { AvatarPhotoEdit } from '@/shared/ds/avatar'
import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import { Checkbox } from '@/shared/ds/checkbox'
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogCancel, ResponsiveDialogContent, ResponsiveDialogFooter } from '@/shared/ds/dialog'
import { Field } from '@/shared/ds/field'
import { Input } from '@/shared/ds/input'
import { useSnackbar } from '@/shared/ds/snackbar'
import { useCompanyTypesQuery, useCountryCodeTypesQuery } from '@/entities/type'
import { usePostUploadProfileMutation, type GetUsersResp, type PutUserReq } from '@/entities/user'
import { DayField } from '@/shared/ui/groo/day-field'
import { CompanyField, CountryField, WorkTimeField } from '@/shared/ui/groo/user-select-fields'
import { readWriteFailure } from '@/shared/ui/groo/write-error'

interface UserEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: GetUsersResp
  /** "내 정보"(계정 메뉴) · "사용자 수정"(관리) — 두 자리가 같은 부품을 연다(I-22 Q4 A) */
  title: string
  /** 저장 — 실패하면 던진다(폼이 열린 채 맨 위 Callout) */
  onSave: (updatedUser: PutUserReq) => Promise<unknown>
  onCloseAutoFocus?: (e: Event) => void
}

const MAX_BYTES = 5 * 1024 * 1024

const fullUrl = (path: string): string => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${config.baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

// 이미지 압축 — 지금 흐름 그대로
const compressImage = (file: File, maxWidth = 800, quality = 0.8): Promise<File> =>
  new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => (blob ? resolve(new File([blob], file.name, { type: file.type, lastModified: Date.now() })) : reject(new Error('blob'))),
        file.type,
        quality,
      )
    }
    img.onerror = () => reject(new Error('image'))
    img.src = URL.createObjectURL(file)
  })

interface Values {
  name: string
  email: string
  birth: string
  lunar: boolean
  company: string
  workTime: string
  country: string
}

const initialOf = (u: GetUsersResp, firstCompany: string): Values => ({
  name: u.user_name,
  email: u.user_email,
  birth: u.user_birth ? dayjs(u.user_birth).format('YYYY-MM-DD') : '',
  lunar: u.lunar_yn === 'Y',
  company: u.user_company_type || firstCompany,
  workTime: u.user_work_time,
  country: u.country_code || 'KR',
})

/**
 * 사용자 수정 · 내 정보(I-24 F 29b) — Responsive Dialog `form`(1280 이상 대화상자 · 미만 시트), 한 열. 맨 위 Avatar 108 + 늘 보이는
 * "사진 바꾸기" · "사진 지우기". 칸 차례: 이름 · 아이디(읽기 전용) · 메일 · 생일 · "음력 생일이에요"(서버에는 Y/N 그대로) · 회사 · 근무 시간 · 국가.
 * 역할 칸은 없다. 저장 실패는 맨 위 Callout, 메일 중복은 그 칸 아래. dirty = 칸 · 사진 중 하나라도 바뀜.
 */
const UserEditDialog = ({ open, onOpenChange, user, title, onSave, onCloseAutoFocus }: UserEditDialogProps) => {
  const { t } = useTranslation('user')
  const { t: tc } = useTranslation('common')
  const { t: ta } = useTranslation('admin')
  const snackbar = useSnackbar()
  const { mutateAsync: uploadProfile, isPending: uploading } = usePostUploadProfileMutation()
  const { data: companies = [] } = useCompanyTypesQuery()
  const { data: countries = [] } = useCountryCodeTypesQuery()
  const [initial] = useState(() => initialOf(user, ''))
  const [values, setValues] = useState<Values>(initial)
  const [photo, setPhoto] = useState(user.profile_url || '')
  const [photoUuid, setPhotoUuid] = useState('')
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [emailTaken, setEmailTaken] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof Values>(key: K, v: Values[K]) => setValues((cur) => ({ ...cur, [key]: v }))
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)
  const errors = {
    name: !values.name.trim(),
    email: !emailOk,
    birth: !values.birth,
    company: !values.company,
    workTime: !values.workTime,
    country: !values.country,
  }
  const dirty = JSON.stringify(values) !== JSON.stringify(initial) || photo !== (user.profile_url || '') || photoUuid !== ''

  const pickFile = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setPhotoError(t('edit.photoImageOnly'))
    if (file.size > MAX_BYTES) return setPhotoError(t('edit.photoTooLarge'))
    setPhotoError(null)
    try {
      const data = await uploadProfile(await compressImage(file))
      setPhoto(data.profile_url)
      setPhotoUuid(data.profile_uuid)
    } catch (error) {
      readWriteFailure(error)
      setPhotoError(t('edit.photoFailed'))
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const submit = async () => {
    if (busy || uploading) return
    if (Object.values(errors).some(Boolean)) {
      setShowErrors(true)
      return
    }
    setBusy(true)
    setSaveError(null)
    try {
      await onSave({
        user_id: user.user_id,
        user_name: values.name.trim(),
        user_email: values.email.trim(),
        user_birth: dayjs(values.birth).format('YYYY-MM-DD'),
        user_company_type: values.company,
        user_work_time: values.workTime,
        lunar_yn: values.lunar ? 'Y' : 'N',
        profile_url: photo.replace(config.baseUrl, ''),
        profile_uuid: photoUuid,
        country_code: values.country,
      })
      onOpenChange(false)
      snackbar.show({ message: t('edit.saved'), tone: 'positive' })
    } catch (error) {
      const { code, key } = readWriteFailure(error)
      if (code === 'USER_005') setEmailTaken(true)
      else if (key) setSaveError(tc(key))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ResponsiveDialog open={open} form dirty={dirty} busy={busy} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent title={title} onCloseAutoFocus={onCloseAutoFocus}>
        <ResponsiveDialogBody>
          {saveError && (
            <Callout tone='critical' role='alert' className='mb-x4' data-save-failure>
              {saveError}
            </Callout>
          )}
          <div className='mb-x6 flex flex-col items-center gap-x2' data-user-photo>
            <AvatarPhotoEdit
              name={values.name || user.user_name}
              src={photo ? fullUrl(photo) : null}
              uploadProgress={uploading ? 0.5 : undefined}
              changeLabel={t('edit.changePhoto')}
              removeLabel={t('edit.removePhoto')}
              uploadLabel={t('edit.uploadingPhoto')}
              onChange={() => fileRef.current?.click()}
              onRemove={() => {
                setPhoto('')
                setPhotoUuid('')
                setPhotoError(null)
              }}
            />
            <input ref={fileRef} type='file' accept='image/*' className='hidden' aria-hidden tabIndex={-1} onChange={(e) => void pickFile(e.target.files?.[0])} />
            {photoError && (
              <p role='alert' className='m-0 text-center text-t3 font-normal text-fg-critical'>
                {photoError}
              </p>
            )}
          </div>
          <div className='flex flex-col gap-x6 pb-x2'>
            <Field label={t('edit.name')} showRequiredIndicator invalid={showErrors && errors.name} errorMessage={t('edit.nameRequired')}>
              <Input value={values.name} onChange={(e) => set('name', e.target.value)} autoComplete='name' />
            </Field>
            <Field label={t('edit.id')} readOnly>
              <Input value={user.user_id} readOnly />
            </Field>
            <Field
              label={t('edit.email')}
              showRequiredIndicator
              invalid={(showErrors && errors.email) || emailTaken}
              errorMessage={emailTaken ? tc('failure.code.duplicateEmail') : t('edit.emailRequired')}
            >
              <Input
                type='email'
                inputMode='email'
                value={values.email}
                onChange={(e) => {
                  setEmailTaken(false)
                  set('email', e.target.value)
                }}
              />
            </Field>
            <DayField label={t('edit.birth')} placeholder={ta('user.userBirthPlaceholder')} value={values.birth} onValueChange={(d) => set('birth', d)} invalid={showErrors && errors.birth} errorMessage={t('edit.birthRequired')} />
            <Checkbox label={t('edit.lunarBirthday')} checked={values.lunar} onCheckedChange={(c) => set('lunar', c === true)} />
            <CompanyField value={values.company} onValueChange={(v) => set('company', v)} options={companies} required invalid={showErrors && errors.company} />
            <WorkTimeField value={values.workTime} onValueChange={(v) => set('workTime', v)} required invalid={showErrors && errors.workTime} />
            <CountryField value={values.country} onValueChange={(v) => set('country', v)} options={countries} required invalid={showErrors && errors.country} />
          </div>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <ResponsiveDialogCancel>{tc('cancel')}</ResponsiveDialogCancel>
          <Button loading={busy} disabled={uploading} onClick={() => void submit()}>
            {tc('save')}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

export { UserEditDialog }
