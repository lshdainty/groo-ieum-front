import { createContext, ReactNode, useContext, useState } from 'react';
import { useCompanyToday } from '@/entities/session';

interface HistoryContextType {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
}

const HistoryContext = createContext<HistoryContextType | null>(null);

export const HistoryProvider = ({ children }: { children: ReactNode }) => {
  // 처음 고른 해 — 회사 기준 오늘의 해(브라우저 연도가 아니다 — 서버가 쓴 · 예정을 가르는 오늘과 같은 시계)
  const currentYear = useCompanyToday().year;
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));

  return (
    <HistoryContext.Provider value={{ selectedYear, setSelectedYear }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistoryContext = () => {
  const context = useContext(HistoryContext);
  if (!context) throw new Error('Cannot find HistoryProvider');
  return context;
};
