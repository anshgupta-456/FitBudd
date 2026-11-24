import Link from "next/link"

import { LogoMark } from "@/components/logo"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="text-center">
        <LogoMark className="mx-auto mb-4 size-10" />
        <p className="eyebrow">404</p>
        <h1 className="mt-1 font-display text-4xl font-semibold">Nothing here</h1>
        <p className="mt-2 text-sm text-muted-foreground">That page doesn&apos;t exist or has moved.</p>
        <Button asChild variant="primary" className="mt-6">
          <Link href="/">Back to today</Link>
        </Button>
      </div>
    </div>
  )
}
