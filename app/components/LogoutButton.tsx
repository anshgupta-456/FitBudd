"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function LogoutButton() {
  const router = useRouter()
  const onLogout = () => {
    try {
      localStorage.removeItem('auth_token')
    } catch {}
    router.replace('/login')
  }
  return (
    <Button variant="outline" className="bg-transparent" onClick={onLogout}>Logout</Button>
  )
}


