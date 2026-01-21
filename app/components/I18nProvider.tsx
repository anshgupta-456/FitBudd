"use client"

import React, { useEffect } from 'react'
import '../i18n/config'

interface I18nProviderProps {
  children: React.ReactNode
}

export default function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    // Initialize i18n when component mounts
    import('../i18n/config')
  }, [])

  return <>{children}</>
}
