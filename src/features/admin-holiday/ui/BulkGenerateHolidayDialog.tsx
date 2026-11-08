import { Button } from '@/shared/ui/shadcn/button'
import { Checkbox } from '@/shared/ui/shadcn/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/shadcn/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/shadcn/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn/table'
import { useCountryCodeTypesQuery } from '@/entities/type'
import {
  useBulkSaveHolidaysMutation,
  useRecurringHolidaysPreviewQuery,
  type BulkSaveHolidayItem,
  type GetHolidaysResp,
  type GetRecurringHolidaysPreviewResp,
  type PostHolidayReq,
} from '@/entities/holiday'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { CalendarPlus, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import { HolidayEditDialog } from './HolidayEditDialog'
import { HolidayDeleteDialog } from './HolidayDeleteDialog'

interface BulkGenerateHolidayDialogProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

const generateYearOptions = () => {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let i = currentYear; i <= currentYear + 5; i++) {
    years.push(i)
  }
  return years
}

const BulkGenerateHolidayDialog = ({
  trigger,
  onSuccess,
}: BulkGenerateHolidayDialogProps) => {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')

  const [isOpen, setIsOpen] = useState(false)
  const [targetYear, setTargetYear] = useState<number>(new Date().getFullYear())
  const [selectedCountry, setSelectedCountry] = useState<string>('KR')
  const [selectedHolidays, setSelectedHolidays] = useState<Set<number>>(new Set())
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false)

  // 로컬 프리뷰 데이터 (수정/삭제 가능)
  const [localPreviewHolidays, setLocalPreviewHolidays] = useState<GetRecurringHolidaysPreviewResp[]>([])

  // 수정/추가 dialog 상태
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingHoliday, setEditingHoliday] = useState<GetHolidaysResp | null>(null)
  const [isAddMode, setIsAddMode] = useState(false)

  const { data: countryTypes } = useCountryCodeTypesQuery()
  const {
    data: previewHolidays,
    isLoading: isPreviewLoading,
    refetch: refetchPreview,
  } = useRecurringHolidaysPreviewQuery(targetYear, selectedCountry, isPreviewLoaded)

  const bulkSaveMutation = useBulkSaveHolidaysMutation()

  const yearOptions = generateYearOptions()

  useEffect(() => {
    if (!isOpen) {
      setIsPreviewLoaded(false)
      setSelectedHolidays(new Set())
      setLocalPreviewHolidays([])
      setEditingIndex(null)
      setEditingHoliday(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (previewHolidays) {
      setLocalPreviewHolidays([...previewHolidays])
      setSelectedHolidays(new Set(previewHolidays.map((_, index) => index)))
    }
  }, [previewHolidays])

  const handleLoadPreview = () => {
    setIsPreviewLoaded(true)
    refetchPreview()
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked && localPreviewHolidays.length > 0) {
      setSelectedHolidays(new Set(localPreviewHolidays.map((_, index) => index)))
    } else {
      setSelectedHolidays(new Set())
    }
  }

  const handleSelectHoliday = (index: number, checked: boolean) => {
    const newSelected = new Set(selectedHolidays)
    if (checked) {
      newSelected.add(index)
    } else {
      newSelected.delete(index)
    }
    setSelectedHolidays(newSelected)
  }

  // 추가 버튼 클릭
  const handleAddClick = () => {
    setEditingHoliday(null)
    setEditingIndex(null)
    setIsAddMode(true)
    setIsEditDialogOpen(true)
  }

  // 수정 버튼 클릭
  const handleEditClick = (index: number) => {
    const holiday = localPreviewHolidays[index]
    // GetHolidaysResp 형태로 변환 (holiday_id는 임시값)
    setEditingHoliday({
      holiday_id: index, // 임시 ID로 index 사용
      holiday_name: holiday.holiday_name,
      holiday_date: holiday.holiday_date,
      holiday_type: holiday.holiday_type,
      holiday_icon: holiday.holiday_icon,
      country_code: holiday.country_code,
      lunar_yn: holiday.lunar_yn,
      lunar_date: holiday.lunar_date,
      is_recurring: holiday.is_recurring,
    })
    setEditingIndex(index)
    setIsAddMode(false)
    setIsEditDialogOpen(true)
  }

  // 수정/추가 dialog에서 저장
  const handleEditSave = (data: PostHolidayReq) => {
    const newHoliday: GetRecurringHolidaysPreviewResp = {
      holiday_name: data.holiday_name,
      holiday_date: data.holiday_date,
      holiday_type: data.holiday_type,
      holiday_icon: data.holiday_icon,
      country_code: data.country_code,
      lunar_yn: data.lunar_yn,
      lunar_date: data.lunar_date,
      is_recurring: data.is_recurring,
    }

    if (isAddMode) {
      // 추가 모드: 새 항목을 목록에 추가하고 선택 상태로 설정
      setLocalPreviewHolidays([...localPreviewHolidays, newHoliday])
      setSelectedHolidays(new Set([...selectedHolidays, localPreviewHolidays.length]))
      setIsPreviewLoaded(true)
    } else if (editingIndex !== null) {
      // 수정 모드: 기존 항목 업데이트
      const updatedHolidays = [...localPreviewHolidays]
      updatedHolidays[editingIndex] = newHoliday
      setLocalPreviewHolidays(updatedHolidays)
    }

    setIsEditDialogOpen(false)
    setEditingIndex(null)
    setEditingHoliday(null)
    setIsAddMode(false)
  }

  // 삭제 버튼 클릭 (로컬 state에서 제거)
  const handleDeleteConfirm = (holiday_id: number) => {
    // holiday_id는 실제로 index임
    const index = holiday_id
    const newHolidays = localPreviewHolidays.filter((_, i) => i !== index)
    setLocalPreviewHolidays(newHolidays)

    // 선택된 항목도 업데이트 (index가 밀리므로 재설정)
    const newSelected = new Set<number>()
    selectedHolidays.forEach((selectedIndex) => {
      if (selectedIndex < index) {
        newSelected.add(selectedIndex)
      } else if (selectedIndex > index) {
        newSelected.add(selectedIndex - 1)
      }
      // selectedIndex === index인 경우는 삭제된 항목이므로 추가하지 않음
    })
    setSelectedHolidays(newSelected)
  }

  const handleSave = () => {
    if (localPreviewHolidays.length === 0 || selectedHolidays.size === 0) return

    const holidaysToSave: BulkSaveHolidayItem[] = localPreviewHolidays
      .filter((_, index) => selectedHolidays.has(index))
      .map((holiday) => ({
        holiday_name: holiday.holiday_name,
        holiday_date: holiday.holiday_date,
        holiday_type: holiday.holiday_type,
        holiday_icon: holiday.holiday_icon || '',
        country_code: holiday.country_code,
        lunar_yn: holiday.lunar_yn,
        lunar_date: holiday.lunar_date || '',
        is_recurring: holiday.is_recurring,
      }))

    bulkSaveMutation.mutate(
      { holidays: holidaysToSave },
      {
        onSuccess: (data) => {
          toast.success(t('holiday.bulkSaveSuccess', { count: data.saved_count }))
          setIsOpen(false)
          onSuccess?.()
        },
        onError: (error) => {
          toast.error(error.message || t('holiday.bulkSaveError'))
        },
      }
    )
  }

  const getHolidayTypeName = (type: string) => {
    switch (type) {
      case 'PUBLIC':
        return t('holiday.typePublic')
      case 'ETC':
        return t('holiday.typeEtc')
      case 'SUBSTITUTE':
        return t('holiday.typeSubstitute')
      default:
        return type
    }
  }

  const isAllSelected =
    localPreviewHolidays.length > 0 && selectedHolidays.size === localPreviewHolidays.length

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <CalendarPlus className="h-4 w-4" />
            {t('holiday.bulkGenerateBtn')}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="min-[40rem]:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('holiday.bulkGenerateTitle')}</DialogTitle>
          <DialogDescription>{t('holiday.bulkGenerateDescription')}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 py-4">
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t('holiday.countryPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {countryTypes?.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(targetYear)} onValueChange={(value) => setTargetYear(Number(value))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder={t('holiday.yearPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleLoadPreview} disabled={isPreviewLoading}>
            {isPreviewLoading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                {tc('loading')}
              </>
            ) : (
              t('holiday.loadPreview')
            )}
          </Button>

          <div className="flex-1" />

          <Button variant="outline" onClick={handleAddClick} className="hidden min-[40rem]:inline-flex">
            {tc('add')}
          </Button>
        </div>

        {isPreviewLoaded && (
          <div className="flex-1 min-h-0 overflow-auto border rounded-md">
            {isPreviewLoading ? (
              <div className="flex items-center justify-center h-40">
                <Spinner className="h-8 w-8 text-muted-foreground" />
              </div>
            ) : localPreviewHolidays.length > 0 ? (
              <Table className="min-w-[700px]" wrapperClassName="overflow-visible">
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-12 min-w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="min-w-[60px] text-center">
                      {t('holiday.icon')}
                    </TableHead>
                    <TableHead className="min-w-[140px]">{t('holiday.name')}</TableHead>
                    <TableHead className="min-w-[110px]">{t('holiday.date')}</TableHead>
                    <TableHead className="min-w-20">{t('holiday.type')}</TableHead>
                    <TableHead className="min-w-[70px]">{t('holiday.lunarYn')}</TableHead>
                    <TableHead className="min-w-20 text-center">{tc('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localPreviewHolidays.map((holiday, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Checkbox
                          checked={selectedHolidays.has(index)}
                          onCheckedChange={(checked) =>
                            handleSelectHoliday(index, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center text-lg">
                        {holiday.holiday_icon || '-'}
                      </TableCell>
                      <TableCell className="font-medium">{holiday.holiday_name}</TableCell>
                      <TableCell>{dayjs(holiday.holiday_date).format('YYYY-MM-DD')}</TableCell>
                      <TableCell>{getHolidayTypeName(holiday.holiday_type)}</TableCell>
                      <TableCell>
                        {holiday.lunar_yn === 'Y' ? t('holiday.lunarYes') : t('holiday.lunarNo')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEditClick(index)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <HolidayDeleteDialog
                            holiday={{
                              holiday_id: index,
                              holiday_name: holiday.holiday_name,
                              holiday_date: holiday.holiday_date,
                              holiday_type: holiday.holiday_type,
                              holiday_icon: holiday.holiday_icon,
                              country_code: holiday.country_code,
                              lunar_yn: holiday.lunar_yn,
                              lunar_date: holiday.lunar_date,
                              is_recurring: holiday.is_recurring,
                            }}
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                            onDelete={handleDeleteConfirm}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                {t('holiday.noRecurringHolidays')}
              </div>
            )}
          </div>
        )}

        {/* 모바일용 추가 버튼 */}
        <Button
          onClick={handleAddClick}
          className="min-[40rem]:hidden w-full"
        >
          <CalendarPlus className="mr-2 h-4 w-4" />
          {t('holiday.addHoliday')}
        </Button>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {isPreviewLoaded && localPreviewHolidays.length > 0 && (
              <>
                {t('holiday.selectedCount', { count: selectedHolidays.size })} / {localPreviewHolidays.length}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                !isPreviewLoaded ||
                selectedHolidays.size === 0 ||
                bulkSaveMutation.isPending
              }
            >
              {bulkSaveMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {tc('saving')}
                </>
              ) : (
                tc('save')
              )}
            </Button>
          </div>
        </div>

        {/* 수정 Dialog */}
        <HolidayEditDialog
          isOpen={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open)
            if (!open) {
              setEditingIndex(null)
              setEditingHoliday(null)
            }
          }}
          editingHoliday={editingHoliday}
          onSave={handleEditSave}
        />
      </DialogContent>
    </Dialog>
  )
}

export { BulkGenerateHolidayDialog }
