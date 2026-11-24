"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

import { AppShell } from "@/components/app-shell"
import { LogoMark } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { API_BASE } from "@/lib/api"
import { useAuth } from "@/lib/auth"

export default function SignedInLayout({ children }: { children: React.ReactNode }) {
  const { status, retry } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === "signed-out") {
      const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : ""
      router.replace(`/login${next}`)
    }
  }, [status, pathname, router])

  if (status === "signed-in") return <AppShell>{children}</AppShell>

  if (status === "offline") {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="max-w-sm text-center">
          <LogoMark className="mx-auto mb-4 size-10" />
          <h1 className="font-display text-2xl font-semibold">Can&apos;t reach the server</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The FitBudd API at <code className="font-mono text-xs">{API_BASE}</code> didn&apos;t respond. If it&apos;s
            hosted on a free plan it may be waking up, which takes up to a minute.
          </p>
          <Button className="mt-5" variant="primary" onClick={retry}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen place-items-center" aria-busy="true">
      <LogoMark className="size-9 animate-pulse" />
    </div>
  )
}
