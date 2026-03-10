'use client'

import { useEffect, useRef } from 'react'

interface Category {
  id: number
  name: string
}

interface CategoryNavProps {
  categories: Category[]
  activeCategory: number
  onCategoryClick: (categoryId: number) => void
}

export default function CategoryNav({
  categories,
  activeCategory,
  onCategoryClick,
}: CategoryNavProps) {
  const activeRef = useRef<HTMLButtonElement>(null)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (activeRef.current && navRef.current) {
      const nav = navRef.current
      const btn = activeRef.current
      const scrollTop = btn.offsetTop - nav.clientHeight / 2 + btn.clientHeight / 2
      nav.scrollTo({ top: scrollTop, behavior: 'smooth' })
    }
  }, [activeCategory])

  return (
    <nav
      ref={navRef}
      className="h-full w-[85px] shrink-0 overflow-y-auto bg-[#F5F5F5] scrollbar-hide"
    >
      <ul className="flex flex-col">
        {categories.map((cat) => {
          const isActive = cat.id === activeCategory
          return (
            <li key={cat.id}>
              <button
                ref={isActive ? activeRef : undefined}
                onClick={() => onCategoryClick(cat.id)}
                className={`relative flex w-full items-center justify-center px-2 py-3.5 text-[13px] leading-tight transition-colors ${
                  isActive
                    ? 'bg-white font-semibold text-primary'
                    : 'text-text-secondary'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-[40%] w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <span className="break-all text-center">{cat.name}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
