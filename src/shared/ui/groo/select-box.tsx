import * as React from 'react'

import { cn } from '@/shared/lib/cn'
import { Checkmark } from '@/shared/ds/checkbox'
import { Radiomark, RadioGroup } from '@/shared/ds/radio-group'

/*
 * Select Box 임시 한 벌(I-24 H 39 · I 43) — 이음에는 ds select-box 가 아직 없다(ds 는 이 묶음이 들이지 않는다 — 22-0 복사 목록 밖).
 * 구조 · 값은 groo-design specs/components/select-box.md(가로형 · 오른쪽 라디오 / 칸 없는 체크 · 고른 상자 안쪽 2px 짙은 테두리 · 상자 전체가 누르는 자리).
 * ds select-box 를 들이면 이 파일을 그것으로 바꾸고 지운다(RadioBoxGroup → RadioSelectBoxGroup · RadioBox → RadioSelectBox ·
 * CheckBoxGroup → CheckSelectBoxGroup · CheckBox → CheckSelectBox). 누름 축소 · 펼침 모션은 뺐다.
 */

const BOX =
  'group/box relative flex flex-col rounded-r3 bg-transparent shadow-[inset_0_0_0_1px_var(--color-stroke-neutral-weak)] ' +
  "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border-2 after:border-solid after:border-transparent after:content-[''] " +
  'has-[[data-box-control][data-state=checked]:not([data-disabled])]:after:border-stroke-neutral-contrast ' +
  '[@media(hover:hover)]:has-[[data-box-action]:not([data-disabled]):hover]:bg-bg-layer-default-pressed has-[[data-box-action]:not([data-disabled]):active]:bg-bg-layer-default-pressed ' +
  'has-[[data-box-control]:focus-visible]:outline-2 has-[[data-box-control]:focus-visible]:outline-offset-2 has-[[data-box-control]:focus-visible]:outline-stroke-focus-ring'

interface BoxBase {
  label: React.ReactNode
  description?: React.ReactNode
  /** 펼침 — 고른 상자 아래로 보인다(호출처가 고른 값으로 줄지 말지 정한다) */
  footer?: React.ReactNode
  className?: string
}

function Frame({ label, description, footer, className, htmlFor, control, disabled }: BoxBase & { htmlFor: string; control: React.ReactNode; disabled?: boolean }) {
  return (
    <div data-slot='select-box' className={cn(BOX, className)}>
      <label
        htmlFor={htmlFor}
        data-box-action=''
        data-disabled={disabled ? '' : undefined}
        className='flex w-full cursor-pointer select-none items-center justify-between gap-x1_5 py-x4 pl-x5 pr-x4 data-[disabled]:cursor-not-allowed'
      >
        <span className='mr-auto flex min-w-0 flex-col items-start gap-x0_5 pr-x1 text-left'>
          <span className={cn('text-t5 font-medium text-fg-neutral [overflow-wrap:break-word] [word-break:keep-all]', disabled && 'text-fg-disabled')}>{label}</span>
          {description && <span className={cn('text-t3 text-fg-neutral-muted [overflow-wrap:break-word]', disabled && 'text-fg-disabled')}>{description}</span>}
        </span>
        {control}
      </label>
      {footer != null && <div className='px-x5 pb-x4'>{footer}</div>}
    </div>
  )
}

/** 하나 고르기 묶음 — role=radiogroup. Field 로 감싸면 칸 이름 · 오류가 이어진다 */
export const RadioBoxGroup = RadioGroup

export const RadioBox = React.forwardRef<
  React.ComponentRef<typeof Radiomark>,
  BoxBase & Omit<React.ComponentPropsWithoutRef<typeof Radiomark>, 'children'>
>(({ label, description, footer, className, id, disabled, ...props }, ref) => {
  const auto = React.useId()
  const rid = id ?? auto
  return (
    <Frame
      label={label}
      description={description}
      footer={footer}
      className={className}
      htmlFor={rid}
      disabled={disabled}
      control={
        <Radiomark
          ref={ref}
          id={rid}
          data-box-control=''
          data-box-action=''
          size='medium'
          tone='neutral'
          disabled={disabled}
          className='focus-visible:outline-none active:[scale:1]'
          {...props}
        />
      }
    />
  )
})
RadioBox.displayName = 'RadioBox'

/** 여럿 고르기 묶음 — fieldset. 이름은 aria-label · aria-labelledby 로 준다 */
export const CheckBoxGroup = React.forwardRef<HTMLFieldSetElement, React.FieldsetHTMLAttributes<HTMLFieldSetElement>>(({ className, ...props }, ref) => (
  <fieldset ref={ref} className={cn('m-0 flex min-w-0 flex-col gap-x3 border-0 p-0', className)} {...props} />
))
CheckBoxGroup.displayName = 'CheckBoxGroup'

export function CheckBox({
  label,
  description,
  footer,
  className,
  id,
  checked,
  onCheckedChange,
  disabled,
}: BoxBase & { id?: string; checked: boolean; onCheckedChange: (checked: boolean) => void; disabled?: boolean }) {
  const auto = React.useId()
  const cid = id ?? auto
  return (
    <Frame
      label={label}
      description={description}
      footer={footer}
      className={className}
      htmlFor={cid}
      disabled={disabled}
      control={
        <Checkmark
          id={cid}
          data-box-control=''
          data-box-action=''
          size='medium'
          shape='ghost'
          tone='neutral'
          checked={checked}
          disabled={disabled}
          onCheckedChange={(v) => onCheckedChange(v === true)}
          className='focus-visible:outline-none active:[scale:1] hover:bg-transparent active:bg-transparent data-[state=checked]:hover:bg-transparent data-[state=checked]:active:bg-transparent'
        />
      }
    />
  )
}
