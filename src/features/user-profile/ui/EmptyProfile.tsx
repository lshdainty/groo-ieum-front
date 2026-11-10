import { UserX } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ResultSection } from '@/shared/ds/result-section';

interface EmptyProfileProps {
  className?: string;
}

const EmptyProfile = ({ className }: EmptyProfileProps) => {
  const { t } = useTranslation('user');

  return (
    <ResultSection
      kind='empty'
      size='medium'
      className={className}
      icon={<UserX />}
      title={t('empty.title')}
      description={t('empty.description')}
    />
  );
};

export { EmptyProfile };
