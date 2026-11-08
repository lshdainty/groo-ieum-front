import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/shadcn/popover';
import { Trans, useTranslation } from 'react-i18next';

const RuleAttire = () => {
  const { t } = useTranslation('culture');

  return (
    <div className='mb-12'>
      <h2 className='text-2xl min-[48rem]:text-3xl font-bold text-gray-800 dark:text-card-foreground mb-6'>
        {t('rule.attire.title')}
      </h2>
      <div className='grid grid-cols-1 min-[40rem]:grid-cols-2 min-[64rem]:grid-cols-4 gap-6'>
        <div className='bg-card rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-lg'>
          <img src='/rule_2_1.png' alt='rule_2_1' className='w-full h-48 object-cover' />
          <div className='p-5'>
            <h3 className='text-lg font-semibold text-gray-800 dark:text-card-foreground mb-2'>{t('rule.attire.basicTitle')}</h3>
            <p className='text-sm text-gray-600 dark:text-card-foreground line-clamp-4'>
              {t('rule.attire.basicDesc')}
            </p>
          </div>
        </div>
        <div className='bg-card rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-lg'>
          <img src='/rule_2_2.png' alt='rule_2_2' className='w-full h-48 object-cover' />
          <div className='p-5'>
            <h3 className='text-lg font-semibold text-gray-800 dark:text-card-foreground mb-2'>{t('rule.attire.meetingTitle')}</h3>
            <p className='text-sm text-gray-600 dark:text-card-foreground line-clamp-4'>
              {t('rule.attire.meetingDesc')}
            </p>
          </div>
        </div>
        <div className='bg-card rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-lg'>
          <img src='/rule_2_3.png' alt='rule_2_3' className='w-full h-48 object-cover' />
          <div className='p-5'>
            <h3 className='text-lg font-semibold text-gray-800 dark:text-card-foreground mb-2'>{t('rule.attire.fieldTitle')}</h3>
            <p className='text-sm text-gray-600 dark:text-card-foreground line-clamp-4'>
              <Trans i18nKey='rule.attire.fieldDesc' ns='culture' components={{ br: <br /> }} />
            </p>
          </div>
        </div>
        <div className='bg-card rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-lg'>
          <img src='/rule_2_4.png' alt='rule_2_4' className='w-full h-48 object-cover' />
          <div className='p-5'>
            <h3 className='text-lg font-semibold text-gray-800 dark:text-card-foreground mb-2'>{t('rule.attire.avoidTitle')}</h3>
            <p className='text-sm text-gray-600 dark:text-card-foreground line-clamp-4'>
              {t('rule.attire.avoidIntro')}
              <Popover>
                <PopoverTrigger>&nbsp;<b><u>{t('rule.attire.avoidTrigger')}</u></b></PopoverTrigger>
                <PopoverContent className='text-sm text-gray-600 dark:text-card-foreground'>
                  {t('rule.attire.avoidShirt')}<br/>
                  {t('rule.attire.avoidSportswear')}<br/>
                  {t('rule.attire.avoidSlippers')}<br/>
                </PopoverContent>
              </Popover>
              {t('rule.attire.avoidEnd')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export { RuleAttire };
