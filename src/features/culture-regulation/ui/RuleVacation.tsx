import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/shadcn/popover';
import { Trans, useTranslation } from 'react-i18next';

const RuleVacation = () => {
  const { t } = useTranslation('culture');

  return (
    <div className='mb-12'>
      <h2 className='text-2xl md:text-3xl font-bold text-gray-800 dark:text-card-foreground mb-6'>
        {t('rule.vacation.title')}
      </h2>
      <div className='grid grid-cols-1 min-[40rem]:grid-cols-2 min-[64rem]:grid-cols-4 gap-6'>
        <div className='bg-card rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-lg'>
          <img src='/rule_1_1.png' alt='rule_1_1' className='w-full h-48 object-cover' />
          <div className='p-5'>
            <h3 className='text-lg font-semibold text-gray-800 dark:text-card-foreground mb-2'>{t('rule.vacation.daysTitle')}</h3>
            <p className='text-sm text-gray-600 dark:text-card-foreground line-clamp-4'>
              <Trans i18nKey='rule.vacation.daysDesc' ns='culture' components={{ b: <b />, u: <u /> }} />
            </p>
          </div>
        </div>
        <div className='bg-card rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-lg'>
          <img src='/rule_1_2.png' alt='rule_1_2' className='w-full h-48 object-cover' />
          <div className='p-5'>
            <h3 className='text-lg font-semibold text-gray-800 dark:text-card-foreground mb-2'>{t('rule.vacation.timingTitle')}</h3>
            <p className='text-sm text-gray-600 dark:text-card-foreground line-clamp-4'>
              {t('rule.vacation.timingDesc').split(t('rule.vacation.timingTrigger'))[0]}&nbsp;
              <Popover>
                <PopoverTrigger><b><u>{t('rule.vacation.timingTrigger')}</u></b></PopoverTrigger>
                <PopoverContent className='text-sm text-gray-600 dark:text-card-foreground'>
                  {t('rule.vacation.timingQ1')}<br />
                  {t('rule.vacation.timingQ2')}<br />
                  {t('rule.vacation.timingQ3')}<br />
                  {t('rule.vacation.timingQ4')}<br />
                </PopoverContent>
              </Popover>
              {t('rule.vacation.timingDesc')}
            </p>
          </div>
        </div>
        <div className='bg-card rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-lg'>
          <img src='/rule_1_3.png' alt='rule_1_3' className='w-full h-48 object-cover' />
          <div className='p-5'>
            <h3 className='text-lg font-semibold text-gray-800 dark:text-card-foreground mb-2'>{t('rule.vacation.specialTitle')}</h3>
            <p className='text-sm text-gray-600 dark:text-card-foreground line-clamp-4'>
              <Popover>
                <PopoverTrigger><b><u>{t('rule.vacation.happyTrigger')}</u></b></PopoverTrigger>
                <PopoverContent className='text-sm text-gray-600 dark:text-card-foreground'>
                  {t('rule.vacation.happyMarriage')}<br/>
                  {t('rule.vacation.happyBirth')}<br/>
                </PopoverContent>
              </Popover>
              {t('rule.vacation.or')}
              <Popover>
                <PopoverTrigger>&nbsp;<b><u>{t('rule.vacation.sadTrigger')}</u></b>&nbsp;</PopoverTrigger>
                <PopoverContent className='text-sm text-gray-600 dark:text-card-foreground'>
                  {t('rule.vacation.sadParents')}<br/>
                  {t('rule.vacation.sadInLaws')}<br/>
                </PopoverContent>
              </Popover>
              {t('rule.vacation.specialDesc')}
            </p>
          </div>
        </div>
        <div className='bg-card rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-lg'>
          <img src='/rule_1_4.png' alt='rule_1_4' className='w-full h-48 object-cover' />
          <div className='p-5'>
            <h3 className='text-lg font-semibold text-gray-800 dark:text-card-foreground mb-2'>{t('rule.vacation.otherTitle')}</h3>
            <p className='text-sm text-gray-600 dark:text-card-foreground line-clamp-4'>
              <Popover>
                <PopoverTrigger>🏥<b><u>{t('rule.vacation.healthTrigger')}</u></b>,</PopoverTrigger>
                <PopoverContent className='text-sm text-gray-600 dark:text-card-foreground'>
                  {t('rule.vacation.healthDesc')}<br/>
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger>&nbsp;💂‍♂️<b><u>{t('rule.vacation.militaryTrigger')}</u></b>&nbsp;</PopoverTrigger>
                <PopoverContent className='text-sm text-gray-600 dark:text-card-foreground'>
                  {t('rule.vacation.militaryMobilization')}<br/>
                  {t('rule.vacation.militaryLocal')}<br/>
                </PopoverContent>
              </Popover>
              {t('rule.vacation.otherDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export { RuleVacation };
