"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"

type AuthUser = {
  id: number
  name: string
  email: string
  username?: string
  fitness_level?: string
  gender?: string
}

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  login: (identifier: string, password: string) => Promise<void>
  register: (data: Record<string, any>) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5001"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    if (saved) {
      setToken(saved)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (token) {
      localStorage.setItem("auth_token", token)
      refreshProfile().catch(() => {})
    } else {
      localStorage.removeItem("auth_token")
      setUser(null)
    }
  }, [token])

  const login = async (identifier: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: identifier, username: identifier, password }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.error || data.message || "Login failed")
    setToken(data.token)
    setUser(data.user)
  }

  const register = async (payload: Record<string, any>) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.error || data.message || "Registration failed")
    setToken(data.token)
    await refreshProfile()
  }

  const refreshProfile = async () => {
    if (!token) return
    const res = await fetch(`${API_BASE}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (res.ok && data.success) setUser(data.user)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, token, isLoading, login, register, logout, refreshProfile }),
    [user, token, isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}






