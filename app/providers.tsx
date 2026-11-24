"use client"

import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { SWRConfig } from "swr"

import { ApiError, fetcher } from "@/lib/api"
import { AuthProvider } from "@/lib/auth"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SWRConfig
        value={{
          fetcher,
          revalidateOnFocus: true,
          dedupingInterval: 4000,
          // Don't hammer the API with retries for errors a retry won't fix.
          shouldRetryOnError: (err) => !(err instanceof ApiError) || err.status >= 500 || err.status === 0,
          errorRetryCount: 2,
        }}
      >
        <AuthProvider>{children}</AuthProvider>
      </SWRConfig>
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: "!rounded-md !border !border-border !bg-surface !text-foreground !shadow-lg !font-sans",
            description: "!text-muted-foreground",
          },
        }}
      />
    </ThemeProvider>
  )
}
