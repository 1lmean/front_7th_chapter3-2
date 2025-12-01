# React Hook 패턴

## 📚 개요

이 과제에서 Hook을 효과적으로 활용하여 **관심사 분리**와 **재사용성**을 높이는 방법을 다룹니다.

---

## 🎣 Custom Hook이란?

Custom Hook은 **상태 로직을 재사용 가능한 함수로 추출**한 것입니다.

### Custom Hook의 규칙

1. 이름이 `use`로 시작해야 함
2. 다른 Hook을 호출할 수 있음
3. 컴포넌트 최상위 레벨에서만 호출
4. 조건문/반복문 안에서 호출 금지

---

## 📦 이 과제에서 만들어야 할 Hook들

### 1. 도메인 Hook (엔티티 관리)

| Hook | 역할 | 상태 |
|------|------|------|
| `useCart` | 장바구니 관리 | `cart`, `selectedCoupon` |
| `useProducts` | 상품 관리 | `products` |
| `useCoupons` | 쿠폰 관리 | `coupons` |

### 2. 유틸리티 Hook (범용)

| Hook | 역할 |
|------|------|
| `useDebounce` | 값 디바운싱 |
| `useLocalStorage` | localStorage 동기화 |
| `useNotification` | 알림 관리 |

---

## 🛒 useCart Hook 구현

### 기본 구조

```typescript
// hooks/useCart.ts
import { useState, useCallback, useEffect, useMemo } from 'react';
import { CartItem, Product, Coupon } from '../types';
import * as cartModel from '../models/cart';

interface UseCartReturn {
  // 상태
  cart: CartItem[];
  selectedCoupon: Coupon | null;
  totals: {
    totalBeforeDiscount: number;
    totalAfterDiscount: number;
  };
  totalItemCount: number;
  
  // 액션
  addToCart: (product: Product) => { success: boolean; message: string };
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number, maxStock: number) => { success: boolean; message: string };
  applyCoupon: (coupon: Coupon) => void;
  clearCoupon: () => void;
  clearCart: () => void;
  
  // 헬퍼
  getRemainingStock: (product: Product) => number;
  getCartItem: (productId: string) => CartItem | undefined;
}

export function useCart(): UseCartReturn {
  // ===== 상태 =====
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  
  // ===== Effects =====
  // localStorage 동기화
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('cart');
    }
  }, [cart]);
  
  // ===== 계산된 값 (Memoized) =====
  const totals = useMemo(
    () => cartModel.calculateCartTotal(cart, selectedCoupon),
    [cart, selectedCoupon]
  );
  
  const totalItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );
  
  // ===== 액션 =====
  const addToCart = useCallback((product: Product) => {
    const remainingStock = cartModel.getRemainingStock(product, cart);
    
    if (remainingStock <= 0) {
      return { success: false, message: '재고가 부족합니다!' };
    }
    
    setCart(prevCart => cartModel.addItemToCart(prevCart, product));
    return { success: true, message: '장바구니에 담았습니다' };
  }, [cart]);
  
  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => cartModel.removeItemFromCart(prevCart, productId));
  }, []);
  
  const updateQuantity = useCallback((
    productId: string, 
    quantity: number, 
    maxStock: number
  ) => {
    if (quantity > maxStock) {
      return { success: false, message: `재고는 ${maxStock}개까지만 있습니다.` };
    }
    
    setCart(prevCart => cartModel.updateCartItemQuantity(prevCart, productId, quantity));
    return { success: true, message: '' };
  }, []);
  
  const applyCoupon = useCallback((coupon: Coupon) => {
    // 쿠폰 적용 조건 검사
    const currentTotal = cartModel.calculateCartTotal(cart, null).totalAfterDiscount;
    
    if (currentTotal < 10000 && coupon.discountType === 'percentage') {
      return { success: false, message: '10,000원 이상 구매 시 사용 가능합니다.' };
    }
    
    setSelectedCoupon(coupon);
    return { success: true, message: '쿠폰이 적용되었습니다.' };
  }, [cart]);
  
  const clearCoupon = useCallback(() => {
    setSelectedCoupon(null);
  }, []);
  
  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedCoupon(null);
  }, []);
  
  // ===== 헬퍼 함수 =====
  const getRemainingStock = useCallback((product: Product) => {
    return cartModel.getRemainingStock(product, cart);
  }, [cart]);
  
  const getCartItem = useCallback((productId: string) => {
    return cart.find(item => item.product.id === productId);
  }, [cart]);
  
  // ===== Return =====
  return {
    cart,
    selectedCoupon,
    totals,
    totalItemCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    applyCoupon,
    clearCoupon,
    clearCart,
    getRemainingStock,
    getCartItem,
  };
}
```

---

## 📦 useProducts Hook 구현

```typescript
// hooks/useProducts.ts
import { useState, useCallback, useEffect } from 'react';
import { Product } from '../types';

const initialProducts: Product[] = [
  {
    id: 'p1',
    name: '상품1',
    price: 10000,
    stock: 20,
    discounts: [
      { quantity: 10, rate: 0.1 },
      { quantity: 20, rate: 0.2 }
    ]
  },
  // ... 더 많은 초기 상품
];

interface UseProductsReturn {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  getProduct: (productId: string) => Product | undefined;
}

export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('products');
      return saved ? JSON.parse(saved) : initialProducts;
    } catch {
      return initialProducts;
    }
  });
  
  // localStorage 동기화
  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);
  
  const addProduct = useCallback((newProduct: Omit<Product, 'id'>) => {
    const product: Product = {
      ...newProduct,
      id: `p${Date.now()}`
    };
    setProducts(prev => [...prev, product]);
  }, []);
  
  const updateProduct = useCallback((productId: string, updates: Partial<Product>) => {
    setProducts(prev =>
      prev.map(product =>
        product.id === productId
          ? { ...product, ...updates }
          : product
      )
    );
  }, []);
  
  const deleteProduct = useCallback((productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  }, []);
  
  const getProduct = useCallback((productId: string) => {
    return products.find(p => p.id === productId);
  }, [products]);
  
  return {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getProduct,
  };
}
```

---

## 🎫 useCoupons Hook 구현

```typescript
// hooks/useCoupons.ts
import { useState, useCallback, useEffect } from 'react';
import { Coupon } from '../types';

const initialCoupons: Coupon[] = [
  {
    name: '5000원 할인',
    code: 'AMOUNT5000',
    discountType: 'amount',
    discountValue: 5000
  },
  {
    name: '10% 할인',
    code: 'PERCENT10',
    discountType: 'percentage',
    discountValue: 10
  }
];

interface UseCouponsReturn {
  coupons: Coupon[];
  addCoupon: (coupon: Coupon) => { success: boolean; message: string };
  deleteCoupon: (couponCode: string) => void;
  getCoupon: (code: string) => Coupon | undefined;
}

export function useCoupons(): UseCouponsReturn {
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    try {
      const saved = localStorage.getItem('coupons');
      return saved ? JSON.parse(saved) : initialCoupons;
    } catch {
      return initialCoupons;
    }
  });
  
  useEffect(() => {
    localStorage.setItem('coupons', JSON.stringify(coupons));
  }, [coupons]);
  
  const addCoupon = useCallback((newCoupon: Coupon) => {
    const existingCoupon = coupons.find(c => c.code === newCoupon.code);
    if (existingCoupon) {
      return { success: false, message: '이미 존재하는 쿠폰 코드입니다.' };
    }
    
    setCoupons(prev => [...prev, newCoupon]);
    return { success: true, message: '쿠폰이 추가되었습니다.' };
  }, [coupons]);
  
  const deleteCoupon = useCallback((couponCode: string) => {
    setCoupons(prev => prev.filter(c => c.code !== couponCode));
  }, []);
  
  const getCoupon = useCallback((code: string) => {
    return coupons.find(c => c.code === code);
  }, [coupons]);
  
  return {
    coupons,
    addCoupon,
    deleteCoupon,
    getCoupon,
  };
}
```

---

## ⏱️ useDebounce Hook 구현

검색어 입력 등에서 불필요한 연산을 줄이기 위한 훅입니다.

```typescript
// utils/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    // delay ms 후에 값 업데이트
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    // value가 변경되면 이전 타이머 취소
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
}
```

### 사용 예시

```typescript
function ProductSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // debouncedSearchTerm이 변경될 때만 필터링 실행
  const filteredProducts = useMemo(() => {
    if (!debouncedSearchTerm) return products;
    
    return products.filter(product =>
      product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [products, debouncedSearchTerm]);
  
  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="상품 검색..."
    />
  );
}
```

---

## 💾 useLocalStorage Hook 구현

localStorage와 상태를 동기화하는 범용 훅입니다.

```typescript
// utils/hooks/useLocalStorage.ts
import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string, 
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // 초기값 로드
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });
  
  // 값 설정
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      localStorage.setItem(key, JSON.stringify(valueToStore));
      return valueToStore;
    });
  }, [key]);
  
  // 값 제거
  const removeValue = useCallback(() => {
    localStorage.removeItem(key);
    setStoredValue(initialValue);
  }, [key, initialValue]);
  
  return [storedValue, setValue, removeValue];
}
```

### 사용 예시

```typescript
function useCart() {
  const [cart, setCart, clearCart] = useLocalStorage<CartItem[]>('cart', []);
  
  const addToCart = (product: Product) => {
    setCart(prev => [...prev, { product, quantity: 1 }]);
  };
  
  return { cart, addToCart, clearCart };
}
```

---

## 🔔 useNotification Hook 구현

알림 메시지를 관리하는 훅입니다.

```typescript
// hooks/useNotification.ts
import { useState, useCallback } from 'react';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
}

interface UseNotificationReturn {
  notifications: Notification[];
  addNotification: (message: string, type?: Notification['type']) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export function useNotification(autoHideDuration = 3000): UseNotificationReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const addNotification = useCallback((
    message: string, 
    type: Notification['type'] = 'success'
  ) => {
    const id = Date.now().toString();
    
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // 자동 제거
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, autoHideDuration);
  }, [autoHideDuration]);
  
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);
  
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);
  
  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  };
}
```

---

## 📋 Hook 사용 패턴 정리

### 좋은 패턴

```typescript
// ✅ 단일 책임: 각 Hook이 하나의 도메인만 담당
const { cart, addToCart } = useCart();
const { products } = useProducts();
const { coupons } = useCoupons();

// ✅ 순수 함수 활용: 복잡한 계산은 model에 위임
const totals = useMemo(
  () => cartModel.calculateCartTotal(cart, selectedCoupon),
  [cart, selectedCoupon]
);

// ✅ 적절한 메모이제이션
const handleAddToCart = useCallback((product: Product) => {
  // ...
}, [dependencies]);
```

### 피해야 할 패턴

```typescript
// ❌ Hook 안에서 비즈니스 로직 직접 구현
const useCart = () => {
  const calculateTotal = () => {
    // 복잡한 계산 로직이 Hook 안에 있음
    let total = 0;
    cart.forEach(item => {
      const discount = item.product.discounts.reduce(...);
      // ...
    });
  };
};

// ❌ 너무 많은 책임을 가진 Hook
const useEverything = () => {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  // ... 모든 것을 하나의 Hook에서 관리
};
```

---

## ✅ 체크리스트

- [ ] 각 도메인별로 전용 Hook이 분리되어 있는가?
- [ ] Hook이 순수 함수(models/)를 활용하는가?
- [ ] 계산된 값에 `useMemo`가 적절히 사용되었는가?
- [ ] 콜백 함수에 `useCallback`이 적절히 사용되었는가?
- [ ] localStorage 동기화가 useEffect로 처리되었는가?
- [ ] Hook의 반환 타입이 명확하게 정의되어 있는가?

