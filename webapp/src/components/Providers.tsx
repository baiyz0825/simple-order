'use client'

import { ReactNode } from 'react'
import { CartProvider } from '@/lib/cart'

export default function Providers({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>
}
