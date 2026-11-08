import { useTranslation } from 'react-i18next';

const RuleHeader = () => {
  const { t } = useTranslation('culture');

  return (
    <div className='text-center mb-12'>
      <h1 className='text-4xl min-[48rem]:text-5xl font-extrabold text-gray-900 dark:text-card-foreground leading-tight mb-4'>
        {t('rule.header.title')}
      </h1>
      <p className='text-lg min-[48rem]:text-xl text-gray-600 dark:text-card-foreground'>
        {t('rule.header.subtitle')}
      </p>
    </div>
  );
};

export { RuleHeader };
