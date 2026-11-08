import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/shadcn/popover';
import { useTranslation } from 'react-i18next';

const RuleEducation = () => {
  const { t } = useTranslation('culture');

  return (
    <div className='mb-12'>
      <h2 className='text-2xl md:text-3xl font-bold text-gray-800 dark:text-card-foreground mb-6'>
        {t('rule.education.title')}
      </h2>
      <div className='grid grid-cols-1 min-[40rem]:grid-cols-2 min-[64rem]:grid-cols-4 gap-6'>
        <div className='bg-card rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-lg'>
          <img src='/rule_3_1.png' alt='rule_3_1' className='w-full h-48 object-cover' />
          <div className='p-5'>
            <h3 className='text-lg font-semibold text-gray-800 dark:text-card-foreground mb-2'>{t('rule.education.selfDevTitle')}</h3>
            <p className='text-sm text-gray-600 dark:text-card-foreground line-clamp-4'>
              {t('rule.education.selfDevDesc')}
            </p>
          </div>
        </div>
        <div className='bg-card rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-lg'>
          <img src='/rule_3_2.png' alt='rule_3_2' className='w-full h-48 object-cover' />
          <div className='p-5'>
            <h3 className='text-lg font-semibold text-gray-800 dark:text-card-foreground mb-2'>{t('rule.education.externalTitle')}</h3>
            <p className='text-sm text-gray-600 dark:text-card-foreground line-clamp-4'>
              <Popover>
                <PopoverTrigger>🧑‍🏫<b><u>{t('rule.education.externalTrigger')}</u></b></PopoverTrigger>
                <PopoverContent className='text-sm text-gray-600 dark:text-card-foreground'>
                  {t('rule.education.externalExample')}
                </PopoverContent>
              </Popover>
              {t('rule.education.externalDesc')}
            </p>
          </div>
        </div>
        <div className='bg-card rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-lg'>
          <img src='/rule_3_3.png' alt='rule_3_3' className='w-full h-48 object-cover' />
          <div className='p-5'>
            <h3 className='text-lg font-semibold text-gray-800 dark:text-card-foreground mb-2'>{t('rule.education.overtimeTitle')}</h3>
            <p className='text-sm text-gray-600 dark:text-card-foreground line-clamp-4'>
              {t('rule.education.overtimeDesc')}
            </p>
          </div>
        </div>
        <div className='bg-card rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-lg'>
          <img src='/rule_3_4.png' alt='rule_3_4' className='w-full h-48 object-cover' />
          <div className='p-5'>
            <h3 className='text-lg font-semibold text-gray-800 dark:text-card-foreground mb-2'>{t('rule.education.extraLeaveTitle')}</h3>
            <p className='text-sm text-gray-600 dark:text-card-foreground line-clamp-4'>
              {t('rule.education.extraLeaveDesc')}
              <Popover>
                <PopoverTrigger>&nbsp;<b><u>{t('rule.education.waitTrigger')}</u></b></PopoverTrigger>
                <PopoverContent className='text-sm text-gray-600 dark:text-card-foreground'>
                  {t('rule.education.waitDesc')}
                </PopoverContent>
              </Popover>{t('rule.education.excludeText')}
              <Popover>
                <PopoverTrigger>&nbsp;<b><u>{t('rule.education.hourTrigger')}</u></b></PopoverTrigger>
                <PopoverContent className='text-sm text-gray-600 dark:text-card-foreground'>
                  ex&#41;<br/>
                  {t('rule.education.hourExample1')}<br/>
                  {t('rule.education.hourExample2')}
                </PopoverContent>
              </Popover>{t('rule.education.grantText')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export { RuleEducation };
