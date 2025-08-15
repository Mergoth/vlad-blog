import React from 'react'

interface PostCardProps {
  title: string
  description?: string
  date: Date
  slug: string
  lang: 'en' | 'es' | 'ru'
}

export default function PostCard({ title, description, date, slug, lang }: PostCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : lang === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  return (
    <article className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <time className="text-sm text-gray-500 font-medium">
            {formatDate(date)}
          </time>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
          <a href={`/${lang}/posts/${slug}`} className="block">
            {title}
          </a>
        </h2>
        {description && (
          <p className="text-gray-600 mb-4 line-clamp-3">
            {description}
          </p>
        )}
        <a 
          href={`/${lang}/posts/${slug}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          {lang === 'ru' ? 'Читать далее' : lang === 'es' ? 'Leer más' : 'Read more'}
          <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </article>
  )
}
