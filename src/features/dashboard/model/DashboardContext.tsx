import { toast } from '@/shared/ui/shadcn/sonner';
import { useUpdateDashboardMutation } from '@/entities/user';
import i18n from '@/app/config/i18n';
import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { defaultLayouts } from '@/features/dashboard/lib/constants';
import { claimFailure } from '@/shared/api/failure'

interface DashboardContextType {
  layouts: any;
  activeWidgets: string[];
  isEditing: boolean;
  isToolboxOpen: boolean;
  draggedWidget: any;
  currentBreakpoint: string;
  setLayouts: (layouts: any) => void;
  setActiveWidgets: (widgets: string[]) => void;
  setIsEditing: (isEditing: boolean) => void;
  setIsToolboxOpen: (isOpen: boolean) => void;
  setDraggedWidget: (widget: any) => void;
  setCurrentBreakpoint: (breakpoint: string) => void;
  handleLayoutChange: (layout: any, allLayouts: any) => void;
  handleBreakpointChange: (newBreakpoint: string) => void;
  toggleWidget: (widgetId: string) => void;
  resetLayout: () => void;
  onDrop: (layout: any, layoutItem: any, _event: any) => void;
  handleSave: () => void;
  handleCancel: () => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('Cannot find DashboardProvider');
  return context;
};

export const DashboardProvider = ({ children, userId, initialDashboard }: { children: ReactNode; userId: string; initialDashboard?: string }) => {
  const [layouts, setLayouts] = useState(() => {
    if (initialDashboard) {
      try {
        const parsed = JSON.parse(initialDashboard);
        if (parsed.layouts) return parsed.layouts;
      } catch (e) {
        console.error('Failed to parse initial dashboard layouts', e);
      }
    }
    return defaultLayouts;
  });

  const [activeWidgets, setActiveWidgets] = useState<string[]>(() => {
    if (initialDashboard) {
      try {
        const parsed = JSON.parse(initialDashboard);
        if (parsed.activeWidgets) return parsed.activeWidgets;
      } catch (e) {
        console.error('Failed to parse initial dashboard widgets', e);
      }
    }
    // default layout에 있는 위젯만 기본으로 표시
    return defaultLayouts.lg.map((item: any) => item.i);
  });

  const [isEditing, setIsEditingState] = useState(false);
  const [isToolboxOpen, setIsToolboxOpen] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<any>(null);
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const { mutate: updateDashboard } = useUpdateDashboardMutation();

  // 편집 모드 진입 시 상태 백업 (취소 시 복원용)
  const backupRef = useRef<{ layouts: any; activeWidgets: string[] } | null>(null);

  const setIsEditing = useCallback((editing: boolean) => {
    if (editing && !isEditing) {
      // 편집 모드 진입 시 현재 상태 백업
      backupRef.current = {
        layouts: JSON.parse(JSON.stringify(layouts)),
        activeWidgets: [...activeWidgets]
      };
    }
    setIsEditingState(editing);
  }, [isEditing, layouts, activeWidgets]);

  const handleLayoutChange = useCallback((_layout: any, allLayouts: any) => {
    setLayouts(allLayouts);
  }, []);

  const handleBreakpointChange = useCallback((newBreakpoint: string) => {
    setCurrentBreakpoint(newBreakpoint);
  }, []);

  const toggleWidget = (widgetId: string) => {
    setActiveWidgets(prev =>
      prev.includes(widgetId)
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  const resetLayout = () => {
    setLayouts(defaultLayouts);
    const defaultWidgetIds = defaultLayouts.lg.map((item: any) => item.i);
    setActiveWidgets(defaultWidgetIds);
  };

  const onDrop = (layout: any, _layoutItem: any, _event: any) => {
    if (!draggedWidget) return;

    const newLayouts = {
      ...layouts,
      [currentBreakpoint]: layout
    };
    setLayouts(newLayouts);

    if (!activeWidgets.includes(draggedWidget.id)) {
      setActiveWidgets(prev => [...prev, draggedWidget.id]);
    }

    setDraggedWidget(null);
  };

  const handleSave = () => {
    const dashboardConfig = {
      layouts,
      activeWidgets
    };

    updateDashboard(
      {
        userId,
        data: { dashboard: JSON.stringify(dashboardConfig) }
      },
      {
        onSuccess: () => {
          backupRef.current = null;
          setIsToolboxOpen(false);
          setTimeout(() => setIsEditingState(false), 300);
        },
        onError: (error) => {
          claimFailure(error);
          toast.error(i18n.t('dashboard:saveError'));
        }
      }
    );
  };

  const handleCancel = () => {
    // 백업된 상태로 복원
    if (backupRef.current) {
      setLayouts(backupRef.current.layouts);
      setActiveWidgets(backupRef.current.activeWidgets);
      backupRef.current = null;
    }

    setIsToolboxOpen(false);
    setTimeout(() => setIsEditingState(false), 300);
  };

  return (
    <DashboardContext.Provider value={{
      layouts,
      activeWidgets,
      isEditing,
      isToolboxOpen,
      draggedWidget,
      currentBreakpoint,
      setLayouts,
      setActiveWidgets,
      setIsEditing,
      setIsToolboxOpen,
      setDraggedWidget,
      setCurrentBreakpoint,
      handleLayoutChange,
      handleBreakpointChange,
      toggleWidget,
      resetLayout,
      onDrop,
      handleSave,
      handleCancel
    }}>
      {children}
    </DashboardContext.Provider>
  );
};
