import QueryAsyncBoundary from '@/shared/ui/async-boundary/QueryAsyncBoundary'
import { Button } from '@/shared/ui/shadcn/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/shadcn/select'
import { BulkGenerateHolidayDialog } from '@/features/admin-holiday/ui/BulkGenerateHolidayDialog'
import { EmptyHoliday } from '@/features/admin-holiday/ui/EmptyHoliday'
import { HolidayEditDialog } from '@/features/admin-holiday/ui/HolidayEditDialog'
import { HolidayList } from '@/features/admin-holiday/ui/HolidayList'
import { HolidayListSkeleton } from '@/features/admin-holiday/ui/HolidayListSkeleton'
import { useHolidayContext } from '@/features/admin-holiday/model/HolidayContext'
import {
  useDeleteHolidayMutation,
  useHolidaysByPeriodQuery,
  usePostHolidayMutation,
  usePutHolidayMutation,
  type GetHolidaysResp,
  type PostHolidayReq,
  type PutHolidayReq,
} from '@/entities/holiday'
import { useCountryCodeTypesQuery } from '@/entities/type'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const formatDateToYYYYMMDD = (dateString: string) => {
  if (!dateString) return ''
  return dayjs(dateString).format('YYYY-MM-DD')
}

// 연도 옵션 생성 (현재 연도 기준 -5 ~ +5년)
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    years.push(i)
  }
  return years
}

const HolidayContent = () => {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { isDialogOpen, setIsDialogOpen, editingHoliday, setEditingHoliday } = useHolidayContext()

  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [selectedCountry, setSelectedCountry] = useState<string>('KR')

  const startDate = `${selectedYear}-01-01`
  const endDate = `${selectedYear}-12-31`

  const { data: countryTypes } = useCountryCodeTypesQuery()
  const { data: holidays, isLoading, error, refetch } = useHolidaysByPeriodQuery(startDate, endDate, selectedCountry)

  const yearOptions = generateYearOptions()
  const postMutation = usePostHolidayMutation()
  const putMutation = usePutHolidayMutation()
  const deleteMutation = useDeleteHolidayMutation()

  const handleSave = (data: PostHolidayReq) => {
    const payload = {
      ...data,
      holiday_date: formatDateToYYYYMMDD(data.holiday_date),
      lunar_date: data.lunar_date ? formatDateToYYYYMMDD(data.lunar_date) : ''
    }

    if (editingHoliday) {
      const putData: PutHolidayReq = {
        ...payload,
        holiday_id: editingHoliday.holiday_id,
      }
      putMutation.mutate(putData, {
        onSuccess: () => {
          refetch()
          setIsDialogOpen(false)
        }
      })
    } else {
      postMutation.mutate(payload, {
        onSuccess: () => {
          refetch()
          setIsDialogOpen(false)
        }
      })
    }
  }

  const handleEdit = (holiday: GetHolidaysResp) => {
    setEditingHoliday(holiday)
    setIsDialogOpen(true)
  }

  const handleDelete = (holiday_id: number) => {
    deleteMutation.mutate(String(holiday_id), {
      onSuccess: () => {
        refetch()
      }
    })
  }

  const handleAddClick = () => {
    setEditingHoliday(null)
    setIsDialogOpen(true)
  }

  return (
    <div className='flex w-full h-full p-4 min-[40rem]:p-6 min-[48rem]:p-8'>
      <div className='w-full flex flex-col h-full'>
        <div className='flex flex-col min-[48rem]:flex-row min-[48rem]:items-center justify-between mb-6 gap-4 shrink-0'>
          <div>
            <h1 className='text-2xl min-[48rem]:text-3xl font-bold text-card-foreground'>{t('holiday.title')}</h1>
            <p className='text-sm min-[48rem]:text-base text-muted-foreground mt-1'>{t('holiday.description')}</p>
          </div>

          <div className='flex flex-col min-[40rem]:flex-row gap-2'>
            <div className='flex items-center gap-2'>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className='flex-1 min-[40rem]:w-[140px]'>
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
              <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
                <SelectTrigger className='w-[100px]'>
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
            </div>

            <div className='flex items-center gap-2'>
              <BulkGenerateHolidayDialog onSuccess={() => refetch()} />

              <HolidayEditDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                editingHoliday={editingHoliday}
                onSave={handleSave}
                isLoading={editingHoliday ? putMutation.isPending : postMutation.isPending}
                trigger={
                  <Button className='flex-1 min-[40rem]:flex-none flex items-center gap-2' onClick={handleAddClick}>
                    {tc('add')}
                  </Button>
                }
              />
            </div>
          </div>
        </div>
        <div className='flex-1 min-h-0'>
          <QueryAsyncBoundary
            queryState={{ isLoading, error, data: holidays }}
            loadingComponent={<HolidayListSkeleton />}
            emptyComponent={<EmptyHoliday onAddClick={handleAddClick} className="h-full flex items-center justify-center" />}
            isEmpty={(data) => !data || data.length === 0}
          >
            <HolidayList
              holidays={holidays}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddClick={handleAddClick}
            />
          </QueryAsyncBoundary>
        </div>

      </div>
    </div>
  )
}

export { HolidayContent }
