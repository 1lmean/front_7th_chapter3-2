# 전역 상태 관리: Context vs Jotai

## 📚 개요

심화과제에서는 **Context** 또는 **Jotai**를 사용하여 Props Drilling을 제거합니다.
두 가지 방법의 특징과 사용법을 비교합니다.

---

## 🔄 Props Drilling 문제

### 현재 문제 상황

```tsx
// App.tsx에서 모든 상태와 함수를 관리
function App() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  
  // 이 props들이 여러 단계를 거쳐 전달됨
  return (
    <MainPage
      cart={cart}
      products={products}
      coupons={coupons}
      onAddToCart={addToCart}
      onRemoveFromCart={removeFromCart}
      onUpdateQuantity={updateQuantity}
      // ... 더 많은 props
    />
  );
}
```

---

## 🎯 방법 1: React Context

### Context 설정

```typescript
// context/CartContext.tsx
import { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { CartItem, Product, Coupon } from '../types';
import * as cartModel from '../models/cart';

interface CartContextType {
  cart: CartItem[];
  selectedCoupon: Coupon | null;
  totals: { totalBeforeDiscount: number; totalAfterDiscount: number };
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  applyCoupon: (coupon: Coupon) => void;
  clearCart: () => void;
  getRemainingStock: (product: Product) => number;
}

const CartContext = createContext<CartContextType | null>(null);

// Provider 컴포넌트
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  
  const addToCart = useCallback((product: Product) => {
    setCart(prev => cartModel.addItemToCart(prev, product));
  }, []);
  
  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => cartModel.removeItemFromCart(prev, productId));
  }, []);
  
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCart(prev => cartModel.updateCartItemQuantity(prev, productId, quantity));
  }, []);
  
  const applyCoupon = useCallback((coupon: Coupon) => {
    setSelectedCoupon(coupon);
  }, []);
  
  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedCoupon(null);
  }, []);
  
  const getRemainingStock = useCallback((product: Product) => {
    return cartModel.getRemainingStock(product, cart);
  }, [cart]);
  
  const totals = cartModel.calculateCartTotal(cart, selectedCoupon);
  
  return (
    <CartContext.Provider value={{
      cart,
      selectedCoupon,
      totals,
      addToCart,
      removeFromCart,
      updateQuantity,
      applyCoupon,
      clearCart,
      getRemainingStock,
    }}>
      {children}
    </CartContext.Provider>
  );
}

// 커스텀 Hook
export function useCartContext() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('CartProvider 내부에서만 사용할 수 있습니다.');
  }
  return context;
}
```

### Context 사용

```tsx
// App.tsx
import { CartProvider } from './context/CartContext';
import { ProductProvider } from './context/ProductContext';
import { CouponProvider } from './context/CouponContext';

function App() {
  return (
    <ProductProvider>
      <CouponProvider>
        <CartProvider>
          <MainPage />
        </CartProvider>
      </CouponProvider>
    </ProductProvider>
  );
}

// 컴포넌트에서 사용
function CartSummary() {
  const { totals, clearCart } = useCartContext();
  
  return (
    <div>
      <p>총액: {totals.totalAfterDiscount.toLocaleString()}원</p>
      <button onClick={clearCart}>장바구니 비우기</button>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { addToCart, getRemainingStock } = useCartContext();
  const remainingStock = getRemainingStock(product);
  
  return (
    <div>
      <h3>{product.name}</h3>
      <button 
        onClick={() => addToCart(product)}
        disabled={remainingStock <= 0}
      >
        장바구니 담기
      </button>
    </div>
  );
}
```

### Context 분리 전략

```
context/
├── CartContext.tsx      # 장바구니 상태
├── ProductContext.tsx   # 상품 상태
├── CouponContext.tsx    # 쿠폰 상태
├── NotificationContext.tsx  # 알림 상태
└── index.tsx            # Provider 조합
```

```tsx
// context/index.tsx
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <NotificationProvider>
      <ProductProvider>
        <CouponProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </CouponProvider>
      </ProductProvider>
    </NotificationProvider>
  );
}
```

---

## ⚛️ 방법 2: Jotai

### Jotai 설치

```bash
npm install jotai
# 또는
pnpm add jotai
```

### Atom 정의

```typescript
// store/cartAtoms.ts
import { atom } from 'jotai';
import { CartItem, Coupon, Product } from '../types';
import * as cartModel from '../models/cart';

// 기본 Atoms (상태)
export const cartAtom = atom<CartItem[]>([]);
export const selectedCouponAtom = atom<Coupon | null>(null);

// 파생 Atoms (계산된 값)
export const totalsAtom = atom((get) => {
  const cart = get(cartAtom);
  const coupon = get(selectedCouponAtom);
  return cartModel.calculateCartTotal(cart, coupon);
});

export const totalItemCountAtom = atom((get) => {
  const cart = get(cartAtom);
  return cart.reduce((sum, item) => sum + item.quantity, 0);
});

// 쓰기 전용 Atoms (액션)
export const addToCartAtom = atom(
  null,
  (get, set, product: Product) => {
    const cart = get(cartAtom);
    set(cartAtom, cartModel.addItemToCart(cart, product));
  }
);

export const removeFromCartAtom = atom(
  null,
  (get, set, productId: string) => {
    const cart = get(cartAtom);
    set(cartAtom, cartModel.removeItemFromCart(cart, productId));
  }
);

export const updateQuantityAtom = atom(
  null,
  (get, set, { productId, quantity }: { productId: string; quantity: number }) => {
    const cart = get(cartAtom);
    set(cartAtom, cartModel.updateCartItemQuantity(cart, productId, quantity));
  }
);

export const clearCartAtom = atom(
  null,
  (_, set) => {
    set(cartAtom, []);
    set(selectedCouponAtom, null);
  }
);

// 남은 재고 계산 (함수 반환)
export const getRemainingStockAtom = atom((get) => {
  const cart = get(cartAtom);
  return (product: Product) => cartModel.getRemainingStock(product, cart);
});
```

### Jotai 사용

```tsx
// 컴포넌트에서 사용
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  cartAtom,
  totalsAtom,
  addToCartAtom,
  removeFromCartAtom,
  getRemainingStockAtom,
} from '../store/cartAtoms';

// 읽기 전용
function CartSummary() {
  const totals = useAtomValue(totalsAtom);
  const clearCart = useSetAtom(clearCartAtom);
  
  return (
    <div>
      <p>총액: {totals.totalAfterDiscount.toLocaleString()}원</p>
      <button onClick={() => clearCart()}>비우기</button>
    </div>
  );
}

// 읽기 + 쓰기
function CartItemCard({ item }: { item: CartItem }) {
  const [_, updateQuantity] = useAtom(updateQuantityAtom);
  const removeFromCart = useSetAtom(removeFromCartAtom);
  
  return (
    <div>
      <span>{item.product.name}</span>
      <button onClick={() => updateQuantity({ 
        productId: item.product.id, 
        quantity: item.quantity + 1 
      })}>
        +
      </button>
      <button onClick={() => removeFromCart(item.product.id)}>
        삭제
      </button>
    </div>
  );
}

// 함수형 atom 사용
function ProductCard({ product }: { product: Product }) {
  const addToCart = useSetAtom(addToCartAtom);
  const getRemainingStock = useAtomValue(getRemainingStockAtom);
  const remainingStock = getRemainingStock(product);
  
  return (
    <button 
      onClick={() => addToCart(product)}
      disabled={remainingStock <= 0}
    >
      담기
    </button>
  );
}
```

### localStorage 연동

```typescript
// store/cartAtoms.ts
import { atomWithStorage } from 'jotai/utils';

// localStorage와 자동 동기화
export const cartAtom = atomWithStorage<CartItem[]>('cart', []);
export const selectedCouponAtom = atomWithStorage<Coupon | null>('selectedCoupon', null);
```

---

## ⚖️ Context vs Jotai 비교

| 특성 | Context | Jotai |
|------|---------|-------|
| **설치** | 내장 | 추가 설치 필요 |
| **보일러플레이트** | 많음 (Provider, Context 생성) | 적음 (atom 정의만) |
| **리렌더링** | Provider 하위 전체 | 사용하는 atom만 |
| **코드 분할** | Provider 중첩 필요 | atom 단위 분할 |
| **DevTools** | React DevTools | Jotai DevTools |
| **학습 곡선** | 낮음 | 중간 |
| **타입 안전성** | 수동 설정 | 자동 추론 |

### 선택 가이드

**Context 선택 시:**
- 추가 라이브러리 설치 제한
- 간단한 상태 관리
- React 기본 기능만 사용

**Jotai 선택 시:**
- 세밀한 리렌더링 최적화 필요
- 복잡한 파생 상태
- 간결한 코드 선호
- localStorage 동기화 필요

---

## 📋 Props 제거 기준

### 제거해야 할 Props

```tsx
// ❌ 전역 상태로 대체
onAddToCart={addToCart}
onRemoveFromCart={removeFromCart}
onUpdateQuantity={updateQuantity}
cart={cart}
products={products}
coupons={coupons}
```

### 남겨야 할 Props

```tsx
// ✅ 도메인 데이터는 props로 전달
<ProductCard product={product} />
<CartItemCard item={cartItem} />
<CouponCard coupon={coupon} />

// ✅ 컴포넌트 커스터마이징
<Button variant="primary" size="large" />
<Input placeholder="검색..." />
```

---

## ✅ 체크리스트

- [ ] 전역 상태가 Context 또는 Jotai로 관리되는가?
- [ ] 불필요한 props drilling이 제거되었는가?
- [ ] 도메인 데이터 props는 유지되었는가?
- [ ] 컴포넌트 간 결합도가 낮아졌는가?

