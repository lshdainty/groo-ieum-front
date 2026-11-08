import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/shadcn/popover';
import { useTranslation } from 'react-i18next';

const RuleCulture = () => {
  const { t } = useTranslation('culture');

  return (
    <div className='mb-12'>
      <h2 className='text-2xl md:text-3xl font-bold text-gray-800 dark:text-card-foreground mb-6'>
        {t('rule.culture.title')}
      </h2>
      <div className='grid grid-cols-1 min-[40rem]:grid-cols-2 min-[64rem]:grid-cols-4 gap-6'>
        <div className='bg-card rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-lg'>
          <img src='/rule_4_1.png' alt='rule_4_1' className='w-full h-48 object-cover' />
          <div className='p-5'>
            <h3 className='text-lg font-semibold text-gray-800 dark:text-card-foreground mb-2'>{t('rule.culture.birthdayTitle')}</h3>
            <p className='text-sm text-gray-600 dark:text-card-foreground line-clamp-4'>
              {t('rule.culture.birthdayIntro')}
              <Popover>
                <PopoverTrigger>&nbsp;<b><u>{t('rule.culture.earlyLeaveTrigger')}</u></b></PopoverTrigger>
                <PopoverContent className='text-sm text-gray-600 dark:text-card-foreground'>
                  {t('rule.culture.earlyLeaveSeoul')}<br/>
                  {t('rule.culture.earlyLeaveOther')}
                </PopoverContent>
              </Popover>{t('rule.culture.earlyLeaveEnd')}
            </p>
          </div>
        </div>
        <div className='bg-card rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-lg'>
          <img src='/rule_4_2.png' alt='rule_4_2' className='w-full h-48 object-cover' />
          <div className='p-5'>
            <h3 className='text-lg font-semibold text-gray-800 dark:text-card-foreground mb-2'>{t('rule.culture.partyTitle')}</h3>
            <p className='text-sm text-gray-600 dark:text-card-foreground line-clamp-4'>
              {t('rule.culture.partyDesc')}
            </p>
          </div>
        </div>
        <div className='bg-card rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-lg'>
          <img src='/rule_4_3.png' alt='rule_4_3' className='w-full h-48 object-cover' />
          <div className='p-5'>
            <h3 className='text-lg font-semibold text-gray-800 dark:text-card-foreground mb-2'>{t('rule.culture.familyTitle')}</h3>
            <p className='text-sm text-gray-600 dark:text-card-foreground line-clamp-4'>
              {t('rule.culture.familyIntro')}
              <Popover>
                <PopoverTrigger>&nbsp;<b><u>{t('rule.culture.earlyLeaveTrigger')}</u></b></PopoverTrigger>
                <PopoverContent className='text-sm text-gray-600 dark:text-card-foreground'>
                  {t('rule.culture.earlyLeaveSeoul')}<br/>
                  {t('rule.culture.earlyLeaveOther')}
                </PopoverContent>
              </Popover>{t('rule.culture.earlyLeaveEnd')}
            </p>
          </div>
        </div>
        <div className='bg-card rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-lg'>
          <img src='/rule_4_4.png' alt='rule_4_4' className='w-full h-48 object-cover' />
          <div className='p-5'>
            <h3 className='text-lg font-semibold text-gray-800 dark:text-card-foreground mb-2'>{t('rule.culture.otherTitle')}</h3>
            <p className='text-sm text-gray-600 dark:text-card-foreground line-clamp-4'>
              {t('rule.culture.otherIntro')}
              <Popover>
                <PopoverTrigger>&nbsp;<b><u>{t('rule.culture.familyTrigger')}</u></b></PopoverTrigger>
                <PopoverContent className='text-sm text-gray-600 dark:text-card-foreground'>
                  {t('rule.culture.familyScope')}<br/>
                  {t('rule.culture.familyIncluded')}<br/>
                  {t('rule.culture.familyExcluded')}
                </PopoverContent>
              </Popover>{t('rule.culture.otherEnd')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export { RuleCulture };
