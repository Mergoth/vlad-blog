import React from 'react'

interface HeaderProps {
  lang: 'en' | 'es' | 'ru'
}

const translations = {
  en: { home: 'Home', blog: 'Blog', about: 'About' },
  es: { home: 'Inicio', blog: 'Blog', about: 'Acerca' },
  ru: { home: 'Главная', blog: 'Блог', about: 'О нас' }
}

export default function Header({ lang }: HeaderProps) {
  const t = translations[lang]
  
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <a href={`/${lang}`} className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
            Vlad Blog
          </a>
          <div className="flex items-center space-x-6">
            <a href={`/${lang}`} className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
              {t.home}
            </a>
            <a href={`/${lang}`} className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
              {t.blog}
            </a>
            <div className="flex items-center space-x-2 ml-6">
              <a href="/en" className={`px-2 py-1 rounded text-sm ${lang === 'en' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:text-blue-600'}`}>EN</a>
              <a href="/es" className={`px-2 py-1 rounded text-sm ${lang === 'es' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:text-blue-600'}`}>ES</a>
              <a href="/ru" className={`px-2 py-1 rounded text-sm ${lang === 'ru' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:text-blue-600'}`}>RU</a>
            </div>
          </div>
        </nav>
      </div>
    </header>
  )
}
