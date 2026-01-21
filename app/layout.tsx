import type { Metadata } from 'next'
import './globals.css'
import I18nProvider from './components/I18nProvider'
import { AuthProvider } from './contexts/AuthContext'
import AuthGate from './components/AuthGate'
import Script from 'next/script'
import LogoutButton from './components/LogoutButton'
import ThemeToggle from './components/ThemeToggle'
import { WorkoutProvider } from './contexts/WorkoutContext'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: 'FitBudd - Your AI Fitness Companion',
  description: 'Your AI-powered fitness companion for a healthier lifestyle.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Script id="auth-redirect" strategy="beforeInteractive">
          {`
            (function(){
              try {
                var path = location.pathname;
                var isAuth = path === '/login' || path === '/signup';
                var token = localStorage.getItem('auth_token');
                if (!token && !isAuth) {
                  location.replace('/login');
                } else if (token && isAuth) {
                  location.replace('/');
                }
              } catch (e) {}
            })();
          `}
        </Script>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <AuthProvider>
              <WorkoutProvider>
                <AuthGate />
                <div className="w-full flex items-center justify-between px-4 py-3">
                  <div className="font-semibold">FitBudd</div>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <LogoutButton />
                  </div>
                </div>
                {children}
                <Toaster position="top-right" richColors />
              </WorkoutProvider>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
