'use client'

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
  createElement,
} from 'react'

// ─── Types ──────────────────────────────────────────────────────

export interface CartItem {
  cartId: string // 唯一标识（productId + specs 组合）
  productId: number
  productName: string
  imageUrl: string
  price: number // 分，含规格加价
  quantity: number
  selectedSpecs: {
    templateId: number
    templateName: string
    type: string
    selected: string[]
  }[]
}

interface CartState {
  items: CartItem[]
}

type CartAction =
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'REMOVE_ITEM'; cartId: string }
  | { type: 'UPDATE_QUANTITY'; cartId: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'LOAD'; items: CartItem[] }

interface CartContextValue {
  items: CartItem[]
  addToCart: (item: Omit<CartItem, 'cartId'>) => void
  removeFromCart: (cartId: string) => void
  updateQuantity: (cartId: string, quantity: number) => void
  clearCart: () => void
  totalPrice: number
  totalCount: number
}

// ─── Reducer ────────────────────────────────────────────────────

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.cartId === action.item.cartId)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.cartId === action.item.cartId
              ? { ...i, quantity: i.quantity + action.item.quantity }
              : i
          ),
        }
      }
      return { items: [...state.items, action.item] }
    }
    case 'REMOVE_ITEM':
      return { items: state.items.filter((i) => i.cartId !== action.cartId) }
    case 'UPDATE_QUANTITY':
      if (action.quantity <= 0) {
        return { items: state.items.filter((i) => i.cartId !== action.cartId) }
      }
      return {
        items: state.items.map((i) =>
          i.cartId === action.cartId ? { ...i, quantity: action.quantity } : i
        ),
      }
    case 'CLEAR':
      return { items: [] }
    case 'LOAD':
      return { items: action.items }
    default:
      return state
  }
}

// ─── Context ────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'cart_items'

// ─── 生成 cartId ────────────────────────────────────────────────

function generateCartId(
  productId: number,
  selectedSpecs: CartItem['selectedSpecs']
): string {
  const sortedSpecs = [...selectedSpecs]
    .sort((a, b) => a.templateId - b.templateId)
    .map((s) => ({
      templateId: s.templateId,
      selected: [...s.selected].sort(),
    }))
  return `${productId}_${JSON.stringify(sortedSpecs)}`
}

// ─── Provider ───────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })

  // 从 localStorage 恢复数据
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const items = JSON.parse(stored) as CartItem[]
        dispatch({ type: 'LOAD', items })
      }
    } catch {
      // localStorage 不可用或数据损坏，忽略
    }
  }, [])

  // 每次 items 变化时持久化
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
    } catch {
      // localStorage 不可用，忽略
    }
  }, [state.items])

  const addToCart = useCallback(
    (item: Omit<CartItem, 'cartId'>) => {
      const cartId = generateCartId(item.productId, item.selectedSpecs)
      dispatch({ type: 'ADD_ITEM', item: { ...item, cartId } })
    },
    []
  )

  const removeFromCart = useCallback((cartId: string) => {
    dispatch({ type: 'REMOVE_ITEM', cartId })
  }, [])

  const updateQuantity = useCallback((cartId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', cartId, quantity })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' })
  }, [])

  const totalPrice = useMemo(
    () => state.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [state.items]
  )

  const totalCount = useMemo(
    () => state.items.reduce((sum, i) => sum + i.quantity, 0),
    [state.items]
  )

  const value: CartContextValue = useMemo(
    () => ({
      items: state.items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalPrice,
      totalCount,
    }),
    [state.items, addToCart, removeFromCart, updateQuantity, clearCart, totalPrice, totalCount]
  )

  return createElement(CartContext.Provider, { value }, children)
}

// ─── Hook ───────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return ctx
}
