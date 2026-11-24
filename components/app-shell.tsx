"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import {
  CalendarDays,
  Camera,
  ChevronsUpDown,
  Dumbbell,
  House,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Ticket,
  TrendingUp,
  UserRound,
  Users,
  Utensils,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import useSWR from "swr"

import { Avatar } from "@/components/ui/bits"
import { SheetContent } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/menu"
import { useAuth, useUser } from "@/lib/auth"
import { cn } from "@/lib/utils"

import { Wordmark } from "./logo"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: "requests" | "unread_messages"
}

const NAV: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Training",
    items: [
      { href: "/", label: "Today", icon: House },
      { href: "/workouts", label: "Schedule", icon: CalendarDays },
      { href: "/progress", label: "Progress", icon: TrendingUp },
      { href: "/nutrition", label: "Nutrition", icon: Utensils },
    ],
  },
  {
    heading: "Technique",
    items: [
      { href: "/form-check", label: "Form check", icon: Camera },
      { href: "/machines", label: "Machine guide", icon: Dumbbell },
    ],
  },
  {
    heading: "Book",
    items: [
      { href: "/classes", label: "Classes & courts", icon: Ticket },
      { href: "/gyms", label: "Gyms", icon: MapPin },
      { href: "/trainers", label: "Trainers", icon: UserRound },
    ],
  },
  {
    heading: "People",
    items: [
      { href: "/partners", label: "Partners", icon: Users, badge: "requests" },
      { href: "/messages", label: "Messages", icon: MessageSquare, badge: "unread_messages" },
    ],
  },
]

type Counts = { requests: number; unread_messages: number }

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { data: counts } = useSWR<Counts>("/inbox/counts", { refreshInterval: 30_000 })

  return (
    <nav className="space-y-6 px-3" aria-label="Main">
      {NAV.map((group) => (
        <div key={group.heading}>
          <p className="eyebrow mb-1.5 px-2.5 text-[11px]">{group.heading}</p>
          <ul className="space-y-px">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href)
              const badge = item.badge ? counts?.[item.badge] : 0
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex h-9 items-center gap-3 rounded px-2.5 text-sm transition-colors",
                      active
                        ? "bg-muted font-medium text-foreground"
                        : "text-foreground/70 hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-primary" aria-hidden />}
                    <item.icon className={cn("size-[17px]", active ? "text-foreground" : "text-muted-foreground")} />
                    <span className="flex-1">{item.label}</span>
                    {!!badge && (
                      <span className="num rounded-full bg-primary px-1.5 text-2xs font-semibold leading-[18px] text-primary-foreground">
                        {badge}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function AccountMenu() {
  const user = useUser()
  const { signOut } = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded p-2 text-left hover:bg-muted">
        <Avatar name={user.name} size={32} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{user.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{user.city || user.email}</span>
        </span>
        <ChevronsUpDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-[220px]">
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserRound /> Profile and settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="system">Match system</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  useEffect(() => setMenuOpen(false), [pathname])

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r bg-surface lg:flex">
        <Link href="/" className="flex h-16 items-center px-5" aria-label="FitBudd home">
          <Wordmark />
        </Link>
        <div className="flex-1 overflow-y-auto py-3">
          <NavLinks />
        </div>
        <div className="border-t p-2">
          <AccountMenu />
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-surface/95 px-4 backdrop-blur lg:hidden">
        <Link href="/" aria-label="FitBudd home">
          <Wordmark />
        </Link>
        <DialogPrimitive.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <DialogPrimitive.Trigger className="rounded p-2 hover:bg-muted" aria-label="Open menu">
            <Menu className="size-5" />
          </DialogPrimitive.Trigger>
          <SheetContent title="Menu" side="left" hideTitle>
            <div className="flex h-full flex-col">
              <div className="flex h-14 items-center border-b px-5">
                <Wordmark />
              </div>
              <div className="flex-1 overflow-y-auto py-4">
                <NavLinks onNavigate={() => setMenuOpen(false)} />
              </div>
              <div className="border-t p-2">
                <AccountMenu />
              </div>
            </div>
          </SheetContent>
        </DialogPrimitive.Root>
      </header>

      <main className="min-w-0">
        <div className="mx-auto w-full max-w-[1120px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-10">{children}</div>
      </main>
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="font-display text-[34px] font-semibold leading-none tracking-[-0.005em] sm:text-[40px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
