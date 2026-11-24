"use client"

import * as Menu from "@radix-ui/react-dropdown-menu"
import * as React from "react"

import { cn } from "@/lib/utils"

export const DropdownMenu = Menu.Root
export const DropdownMenuTrigger = Menu.Trigger

export function DropdownMenuContent({
  children,
  align = "end",
  side,
  className,
}: {
  children: React.ReactNode
  align?: "start" | "end" | "center"
  side?: "top" | "bottom" | "left" | "right"
  className?: string
}) {
  return (
    <Menu.Portal>
      <Menu.Content
        align={align}
        side={side}
        sideOffset={6}
        className={cn(
          "z-50 min-w-[200px] rounded-md border bg-surface p-1 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.3)] data-[state=open]:animate-in data-[state=open]:fade-in-0",
          className,
        )}
      >
        {children}
      </Menu.Content>
    </Menu.Portal>
  )
}

export function DropdownMenuItem({
  children,
  onSelect,
  danger,
  asChild,
}: {
  children: React.ReactNode
  onSelect?: () => void
  danger?: boolean
  asChild?: boolean
}) {
  return (
    <Menu.Item
      asChild={asChild}
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-muted [&_svg]:size-4 [&_svg]:text-muted-foreground",
        danger && "text-danger [&_svg]:text-danger",
      )}
    >
      {children}
    </Menu.Item>
  )
}

export function DropdownMenuLabel({ children }: { children: React.ReactNode }) {
  return <Menu.Label className="px-2.5 pb-1 pt-2 text-xs text-muted-foreground">{children}</Menu.Label>
}

export function DropdownMenuSeparator() {
  return <Menu.Separator className="-mx-1 my-1 h-px bg-border" />
}

export const DropdownMenuRadioGroup = Menu.RadioGroup

export function DropdownMenuRadioItem({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <Menu.RadioItem
      value={value}
      className="relative flex cursor-pointer select-none items-center rounded py-2 pl-7 pr-2.5 text-sm outline-none data-[highlighted]:bg-muted"
    >
      <Menu.ItemIndicator className="absolute left-2.5 size-1.5 rounded-full bg-foreground" />
      {children}
    </Menu.RadioItem>
  )
}
