import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { useCountryCodeTypesQuery } from '@/entities/type'

/** 국가 목록을 못 받았을 때 — 국가 칸 아래에 말하고 다시 받게 한다(칸이 비어 보이는 이유) */
export const CountryLoadNotice = () => {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const countries = useCountryCodeTypesQuery({ quiet: true })
  if (!countries.isLoadingError) return null
  return (
    <p role='alert' className='m-0 flex flex-wrap items-center gap-x1 text-t3 font-normal text-fg-critical' data-country-failure>
      {t('adminHoliday.countryFailure')}
      <Button variant='ghost' size='xsmall' loading={countries.isFetching} onClick={() => void countries.refetch()}>
        {tc('retry')}
      </Button>
    </p>
  )
}
