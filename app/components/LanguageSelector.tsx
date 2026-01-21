"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "es", name: "Gujrati", flag: "🇪" },
  { code: "fr", name: "Bengali", flag: "🇫" },
  { code: "de", name: "Brij", flag: "🇩" },
  { code: "it", name: "Tamil", flag: "🇮" },
  { code: "pt", name: "Telugu", flag: "🇵" },
  { code: "zh", name: "Rajasthani", flag: "🇨" },
  { code: "ja", name: "Assamese", flag: "🇯" },
  { code: "ko", name: "Bihari", flag: "🇰" },
  { code: "ar", name: "Haryanvi", flag: "🇸" },
]

export default function LanguageSelector() {
  const { i18n } = useTranslation()
  const [currentLanguage, setCurrentLanguage] = useState(
    languages.find((lang) => lang.code === i18n.language) || languages[0],
  )

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode)
    const newLanguage = languages.find((lang) => lang.code === languageCode)
    if (newLanguage) {
      setCurrentLanguage(newLanguage)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
          <Globe className="h-4 w-4 mr-2" />
          <span className="mr-1">{currentLanguage.flag}</span>
          {currentLanguage.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white dark:bg-gray-900 backdrop-blur-sm border-gray-200 dark:border-gray-700">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={`cursor-pointer text-gray-900 dark:text-gray-100 ${
              currentLanguage.code === language.code 
                ? "bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200" 
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <span className="mr-2">{language.flag}</span>
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
