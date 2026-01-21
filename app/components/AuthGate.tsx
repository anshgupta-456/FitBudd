"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

export default function AuthGate() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      const isAuthPage = pathname === '/login' || pathname === '/signup'
      if (!token && !isAuthPage) {
        router.replace('/login')
      } else if (token && isAuthPage) {
        router.replace('/')
      }
    } catch {}
  }, [pathname, router])

  return null
}


