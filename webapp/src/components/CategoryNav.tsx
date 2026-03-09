'use client'

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
  return (
    <nav className="sticky top-0 h-screen w-[85px] shrink-0 overflow-y-auto bg-white scrollbar-hide">
      <ul className="flex flex-col">
        {categories.map((cat) => {
          const isActive = cat.id === activeCategory
          return (
            <li key={cat.id}>
              <button
                onClick={() => onCategoryClick(cat.id)}
                className={`relative flex w-full items-center justify-center px-2 py-4 text-[13px] leading-tight transition-colors ${
                  isActive
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-text-secondary hover:bg-gray-50'
                }`}
              >
                {/* 左侧橙色指示条 */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-[60%] w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
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
