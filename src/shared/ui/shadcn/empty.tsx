import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib"

function Empty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg p-6 text-center text-balance md:p-12",
        className
      )}
      {...props}
    />
  )
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      className={cn(
        "flex max-w-[24rem] flex-col items-center gap-2 text-center",
        className
      )}
      {...props}
    />
  )
}

const emptyIconVariants = cva(
  "flex shrink-0 items-center justify-center mb-2 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent [&_svg:not([class*='size-'])]:size-12 [&_svg]:text-muted-foreground",
        icon: "bg-muted text-foreground flex size-12 shrink-0 items-center justify-center rounded-full [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: "icon",
    },
  }
)

function EmptyIcon({
  className,
  variant = "icon",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyIconVariants>) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyIconVariants({ variant, className }))}
      {...props}
    />
  )
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="empty-title"
      className={cn("text-lg font-medium tracking-tight", className)}
      {...props}
    />
  )
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="empty-description"
      className={cn(
        "text-muted-foreground text-sm/relaxed [&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        className
      )}
      {...props}
    />
  )
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex w-full max-w-[24rem] min-w-0 flex-col items-center gap-4 text-sm text-balance",
        className
      )}
      {...props}
    />
  )
}

export { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyIcon }
