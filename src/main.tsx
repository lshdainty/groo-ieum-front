import { createRoot } from 'react-dom/client'
import '@/app/config/i18n'
import '@/index.css'
import { App } from '@/app'
import { trackInputModality } from '@/shared/lib/input-modality'

// 초점 링은 키보드로 왔을 때만 — 스크립트가 옮긴 초점도 직전 입력이 포인터면 링을 그리지 않는다(index.css focus-visible)
trackInputModality()

createRoot(document.getElementById('root')!).render(<App />);
