"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useSWRConfig } from "swr"

import { api, getToken, SIGNED_OUT_EVENT, setToken } from "./api"
import type { User } from "./types"

// "offline" means we have a token but couldn't reach the API to check it.
type Status = "loading" | "signed-in" | "signed-out" | "offline"

interface AuthState {
  status: Status
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (body: Record<string, unknown>) => Promise<void>
  signOut: () => void
  setUser: (user: User) => void
  retry: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading")
  const [user, setUserState] = useState<User | null>(null)
  const { mutate } = useSWRConfig()

  const clear = useCallback(() => {
    setUserState(null)
    setStatus("signed-out")
    // Drop every cached response so the next person to sign in sees only their own data.
    mutate(() => true, undefined, { revalidate: false })
  }, [mutate])

  const load = useCallback(() => {
    if (!getToken()) {
      setStatus("signed-out")
      return
    }
    setStatus("loading")
    api
      .get<{ user: User }>("/auth/me")
      .then(({ user }) => {
        setUserState(user)
        setStatus("signed-in")
      })
      .catch(() => {
        // A 401 has already cleared the token. Anything else (server asleep, no network)
        // shouldn't sign the person out.
        setStatus(getToken() ? "offline" : "signed-out")
      })
  }, [])

  useEffect(load, [load])

  useEffect(() => {
    window.addEventListener(SIGNED_OUT_EVENT, clear)
    return () => window.removeEventListener(SIGNED_OUT_EVENT, clear)
  }, [clear])

  const start = useCallback((token: string, user: User) => {
    setToken(token)
    setUserState(user)
    setStatus("signed-in")
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      status,
      user,
      signIn: async (email, password) => {
        const res = await api.post<{ token: string; user: User }>("/auth/login", { email, password })
        start(res.token, res.user)
      },
      signUp: async (body) => {
        const res = await api.post<{ token: string; user: User }>("/auth/register", body)
        start(res.token, res.user)
      },
      signOut: () => {
        setToken(null)
        clear()
      },
      setUser: setUserState,
      retry: load,
    }),
    [status, user, start, clear, load],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}

/** The signed-in user. Only call inside the (app) layout, which guarantees one exists. */
export function useUser(): User {
  const { user } = useAuth()
  if (!user) throw new Error("useUser called without a signed-in user")
  return user
}
