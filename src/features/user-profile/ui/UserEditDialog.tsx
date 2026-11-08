import { Alert, AlertDescription } from '@/shared/ui/shadcn/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/shadcn/avatar';
import { Button } from '@/shared/ui/shadcn/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/shadcn/dialog';
import { Field, FieldError, FieldLabel } from '@/shared/ui/shadcn/field';
import { Input } from '@/shared/ui/shadcn/input';
import { InputDatePicker } from '@/shared/ui/shadcn/inputDatePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select';
import { Separator } from '@/shared/ui/shadcn/separator';
import { Skeleton } from '@/shared/ui/shadcn/skeleton';
import { Spinner } from '@/shared/ui/shadcn/spinner';
import { config } from '@/shared/config'
import { usePostUploadProfileMutation } from '@/entities/user';
import { useCountryCodeTypesQuery, useCompanyTypesQuery } from '@/entities/type';
import { GetUsersResp, type PutUserReq } from '@/entities/user';
import { cn } from '@/shared/lib'
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import {
  AlertCircle,
  Building2,
  Cake,
  Camera,
  Clock,
  Globe,
  Mail,
  Moon,
  Trash2,
  Upload,
  User as UserIcon
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { claimFailure } from '@/shared/api/failure'

const createFormSchema = (t: (key: string) => string, tc: (key: string) => string) => z.object({
  user_name: z.string().min(1, { message: t('edit.nameRequired') }),
  user_id: z.string().min(1, { message: t('edit.idRequired') }),
  user_email: z.string().email({ message: t('edit.emailRequired') }),
  user_birth: z.string().min(1, { message: t('edit.birthRequired') }),
  user_company_type: z.string().min(1, { message: t('edit.companyRequired') }),
  lunar_yn: z.string().min(1, { message: t('edit.lunarRequired') }),
  user_work_time: z.string().min(1, { message: t('edit.workTimeRequired') }),
  country_code: z.string().min(1, { message: tc('countryRequired') }),
});

type UserFormValues = z.infer<ReturnType<typeof createFormSchema>>;

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: GetUsersResp;
  onSave: (updatedUser: PutUserReq) => void;
}

// 이미지 URL 변환 유틸리티 함수
const getFullImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  
  // 이미 완전한 URL인 경우
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // 상대 경로인 경우 baseUrl과 결합
  return `${config.baseUrl}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
};

// 이미지 압축 유틸리티 함수
const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob!], file.name, {
          type: file.type,
          lastModified: Date.now(),
        });
        resolve(compressedFile);
      }, file.type, quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

const UserEditDialog = ({ open, onOpenChange, user, onSave }: UserEditDialogProps) => {
  const { t } = useTranslation('user');
  const { t: ta } = useTranslation('admin');
  const { t: tc } = useTranslation('common');
  const formSchema = createFormSchema(t, tc);
  const { mutateAsync: uploadProfile, isPending: isUploading } = usePostUploadProfileMutation();
  const { data: countryCodeOptions } = useCountryCodeTypesQuery();
  const { data: companyOptions } = useCompanyTypesQuery();
  
  // 이미지 업로드 관련 상태 관리 - 초기값부터 완전한 URL로 설정
  const [profileImage, setProfileImage] = useState<string>(getFullImageUrl(user.profile_url || ''));
  const [profileUUID, setProfileUUID] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user_name: '',
      user_id: '',
      user_email: '',
      user_birth: dayjs().format('YYYY-MM-DD'),
      user_company_type: companyOptions?.[0]?.code || '',
      lunar_yn: 'N',
      user_work_time: '9 ~ 18',
      country_code: 'KR',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        ...user,
        user_company_type: user.user_company_type || companyOptions?.[0]?.code || '',
        lunar_yn: user.lunar_yn || 'N',
        country_code: user.country_code || 'KR',
      });
      setProfileImage(getFullImageUrl(user.profile_url || ''));
      setProfileUUID('');
      setUploadError('');
      setUploadSuccess(false);
    }
  }, [open, user, form]);

  // 이미지 파일 선택 핸들러
  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  // 파일 변경 핸들러 - 이미지 업로드 및 압축 처리
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      setUploadError(tc('imageFileOnly'));
      return;
    }

    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(tc('fileSizeLimit'));
      return;
    }

    setUploadError('');
    setUploadSuccess(false);

    try {
      // 이미지 압축 처리
      const compressedFile = await compressImage(file);
      
      const data = await uploadProfile(compressedFile);

      // 성공 시 이미지 URL 업데이트 - 완전한 URL로 변환
      setProfileImage(getFullImageUrl(data.profile_url));
      setProfileUUID(data.profile_uuid);
      setUploadSuccess(true);
      
      // 성공 메시지를 3초 후 자동 숨김
      setTimeout(() => setUploadSuccess(false), 3000);
      
    } catch (error) {
      // 서버 글 · axios 영어 글은 쓰지 않고 고정 글로
      claimFailure(error);
      setUploadError(tc('failure.write'));
    } finally {
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 프로필 이미지 삭제 핸들러
  const handleImageDelete = async () => {
    if (!profileImage) return;

    setProfileImage('');
    setProfileUUID('');
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const onSubmit = (values: UserFormValues) => {
    // 업데이트된 사용자 정보에 프로필 이미지 URL 포함
    // 저장할 때는 상대 경로만 저장 (서버에서 받은 원본 경로)
    const imagePathForSave = profileImage ? profileImage.replace(config.baseUrl, '') : '';

    onSave({
      ...user,
      ...values,
      user_birth: dayjs(values.user_birth).format('YYYY-MM-DD'),
      profile_url: imagePathForSave, // 상대 경로로 저장
      profile_uuid: profileUUID,
      country_code: values.country_code
    });
    onOpenChange(false);
  };

  const workTimeOptions = [
    { value: '8 ~ 17', className: 'text-rose-500 dark:text-rose-400' },
    { value: '9 ~ 18', className: 'text-sky-500 dark:text-sky-400' },
    { value: '10 ~ 19', className: 'text-emerald-500 dark:text-emerald-400' },
    { value: '13 ~ 21', className: 'text-amber-500 dark:text-amber-400' }
  ];

  const selectedWorkTime = workTimeOptions.find(option => option.value === form.watch('user_work_time'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-[40rem]:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{ta('user.editTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col min-[40rem]:flex-row gap-6 p-6">
              <div className="w-full min-[40rem]:w-1/3 flex flex-col items-center justify-center gap-4">
                <div className="relative group">
                  {isUploading ? (
                    <div className="relative">
                      <Skeleton className="w-40 h-40 rounded-full bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 bg-size-[200px_100%] animate-pulse" 
                        style={{
                          backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                          backgroundSize: '200px 100%',
                          animation: 'shimmer 1.5s infinite linear'
                        }} 
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                          <Spinner className="h-8 w-8 text-primary" />
                          <span className="text-xs text-muted-foreground font-medium">{tc('processing')}</span>
                        </div>
                      </div>
                      <style>{`
                        @keyframes shimmer {
                          0% { background-position: -200px 0; }
                          100% { background-position: calc(200px + 100%) 0; }
                        }
                      `}</style>
                    </div>
                  ) : (
                    <Avatar className="w-40 h-40">
                      <AvatarImage 
                        src={profileImage} 
                        alt={form.watch('user_name')}
                        onError={(e) => {
                          console.error('이미지 로드 오류:', profileImage);
                          // 이미지 로드 실패 시 기본 이미지로 fallback
                          (e.target as HTMLImageElement).src = "https://github.com/shadcn.png";
                        }}
                      />
                      <AvatarFallback>{form.watch('user_name').charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  
                  {/* 개선된 호버 아이콘 효과 - 버튼 대신 아이콘 컨테이너 사용 */}
                  {!isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/50 rounded-full cursor-pointer">
                      <div className="flex gap-2">
                        {/* 업로드/변경 아이콘 */}
                        <div
                          className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full 
                                     hover:bg-primary/80 hover:scale-110 hover:shadow-lg hover:shadow-primary/30 
                                     transition-all duration-200 cursor-pointer group/upload"
                          onClick={handleImageSelect}
                          title={profileImage ? t('edit.changeImage') : t('edit.uploadImage')}
                        >
                          {profileImage ? (
                            <Camera className="h-5 w-5 text-white group-hover/upload:scale-110 transition-transform duration-200" />
                          ) : (
                            <Upload className="h-5 w-5 text-white group-hover/upload:scale-110 transition-transform duration-200" />
                          )}
                        </div>
                        
                        {/* 삭제 아이콘 */}
                        {profileImage && (
                          <div
                            className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full 
                                       hover:bg-destructive/80 hover:scale-110 hover:shadow-lg hover:shadow-destructive/30 
                                       transition-all duration-200 cursor-pointer group/delete"
                            onClick={handleImageDelete}
                            title={t('edit.deleteImage')}
                          >
                            <Trash2 className="h-5 w-5 text-white group-hover/delete:scale-110 transition-transform duration-200" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 숨겨진 파일 입력 요소 */}
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* 디버깅을 위한 현재 이미지 URL 표시 (개발 중에만 사용) */}
                {import.meta.env.DEV && profileImage && (
                  <div className="text-xs text-muted-foreground p-2 bg-muted rounded text-center break-all">
                    <p className="font-medium">현재 이미지 URL:</p>
                    <p>{profileImage}</p>
                  </div>
                )}

                {/* 업로드 상태 메시지 표시 */}
                {uploadError && (
                  <Alert className="w-full" variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{uploadError}</AlertDescription>
                  </Alert>
                )}

                {uploadSuccess && (
                  <Alert className="w-full border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950" variant="default">
                    <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-800 dark:text-green-300">
                      {t('edit.imageSuccess')}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator orientation="vertical" className="hidden min-[40rem]:block h-auto" />

              <div className="w-full min-[40rem]:w-2/3 space-y-4">
                <Controller
                  control={form.control}
                  name="user_name"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={!!fieldState.error}>
                      <FieldLabel>{t('edit.name')}</FieldLabel>
                      <Input {...field} />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </Field>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    control={form.control}
                    name="user_id"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={!!fieldState.error}>
                        <FieldLabel><UserIcon className='h-4 w-4 text-muted-foreground inline-block' /> {t('edit.id')}</FieldLabel>
                        <Input {...field} disabled={user.user_id !== ''} />
                        <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="user_email"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={!!fieldState.error}>
                        <FieldLabel><Mail className='h-4 w-4 text-muted-foreground inline-block' /> {t('edit.email')}</FieldLabel>
                        <Input {...field} />
                        <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                      </Field>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    control={form.control}
                    name="user_birth"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={!!fieldState.error}>
                        <FieldLabel><Cake className='h-4 w-4 text-muted-foreground inline-block' /> {t('edit.birth')}</FieldLabel>
                        <InputDatePicker
                          value={field.value}
                          onValueChange={(value) => field.onChange(value)}
                        />
                        <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="lunar_yn"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={!!fieldState.error}>
                        <FieldLabel><Moon className='h-4 w-4 text-muted-foreground inline-block' /> {t('edit.lunar')}</FieldLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t('edit.lunarPlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Y">Y</SelectItem>
                            <SelectItem value="N">N</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                      </Field>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    control={form.control}
                    name="user_company_type"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={!!fieldState.error}>
                        <FieldLabel><Building2 className='h-4 w-4 text-muted-foreground inline-block' /> {t('edit.company')}</FieldLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t('edit.companyPlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            {companyOptions?.map(option => <SelectItem key={option.code} value={option.code}>{option.name}</SelectItem>)}
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
                        <FieldLabel><Clock className='h-4 w-4 text-muted-foreground inline-block' /> {t('edit.workTime')}</FieldLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className={cn('w-full', selectedWorkTime?.className)}>
                            <SelectValue placeholder={t('edit.workTimePlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            {workTimeOptions.map(option => <SelectItem key={option.value} value={option.value} className={option.className}>{option.value}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                      </Field>
                    )}
                  />
                </div>
                <Controller
                  control={form.control}
                  name="country_code"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={!!fieldState.error}>
                      <FieldLabel><Globe className='h-4 w-4 text-muted-foreground inline-block' /> {tc('country')}</FieldLabel>
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
            </div>
          </div>
          <DialogFooter className="shrink-0">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {tc('cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isUploading}>
              {isUploading && <Spinner />}
              {isUploading ? tc('processing') : tc('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { UserEditDialog };
