# Compound Components 패턴

## 📚 개요

**Compound Components**는 관련된 컴포넌트들을 하나의 부모 아래 그룹화하고, 
내부적으로 Context를 통해 상태를 공유하는 React 디자인 패턴입니다.

이 패턴은 **선언적이고 유연한 API**를 제공하며, **Props Drilling**을 자연스럽게 해결합니다.

---

## 🎯 왜 Compound Components인가?

### Before: Props Drilling 문제

```tsx
// ❌ Props가 여러 단계를 거쳐 전달됨
<CartContainer
  cart={cart}
  selectedCoupon={selectedCoupon}
  totals={totals}
  coupons={coupons}
  onUpdateQuantity={updateQuantity}
  onRemove={removeFromCart}
  onApplyCoupon={applyCoupon}
  onCheckout={checkout}
>
  <CartHeader cart={cart} />
  <CartItemList 
    cart={cart} 
    onUpdateQuantity={updateQuantity} 
    onRemove={removeFromCart} 
  />
  <CartCouponSelector 
    coupons={coupons}
    selectedCoupon={selectedCoupon}
    onApplyCoupon={applyCoupon}
  />
  <CartSummary totals={totals} />
  <CartCheckoutButton totals={totals} onCheckout={checkout} />
</CartContainer>
```

### After: Compound Components

```tsx
// ✅ 깔끔하고 선언적인 API
<Cart
  cart={cart}
  selectedCoupon={selectedCoupon}
  totals={totals}
  onUpdateQuantity={updateQuantity}
  onRemove={removeFromCart}
  onApplyCoupon={applyCoupon}
  onCheckout={checkout}
>
  <Cart.Header />
  <Cart.ItemList />
  <Cart.CouponSelector coupons={coupons} />
  <Cart.Summary />
  <Cart.CheckoutButton />
</Cart>
```

---

## 🔧 구현 방법

### 1단계: Context 정의

```typescript
// components/Cart/CartContext.tsx
import { createContext, useContext, ReactNode } from 'react';
import { CartItem, Coupon } from '../../types';

interface CartContextType {
  // 상태
  cart: CartItem[];
  selectedCoupon: Coupon | null;
  totals: {
    totalBeforeDiscount: number;
    totalAfterDiscount: number;
  };
  
  // 액션
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  applyCoupon: (coupon: Coupon) => void;
  clearCoupon: () => void;
  checkout: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

// Context 사용 훅
export function useCartContext() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('Cart 컴포넌트 내부에서만 사용할 수 있습니다.');
  }
  return context;
}

export { CartContext };
```

### 2단계: 루트 컴포넌트 생성

```typescript
// components/Cart/CartRoot.tsx
import { ReactNode } from 'react';
import { CartContext } from './CartContext';
import { CartItem, Coupon } from '../../types';

interface CartRootProps {
  children: ReactNode;
  cart: CartItem[];
  selectedCoupon: Coupon | null;
  totals: {
    totalBeforeDiscount: number;
    totalAfterDiscount: number;
  };
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onApplyCoupon: (coupon: Coupon) => void;
  onClearCoupon: () => void;
  onCheckout: () => void;
}

export function CartRoot({
  children,
  cart,
  selectedCoupon,
  totals,
  onUpdateQuantity,
  onRemove,
  onApplyCoupon,
  onClearCoupon,
  onCheckout,
}: CartRootProps) {
  const contextValue = {
    cart,
    selectedCoupon,
    totals,
    updateQuantity: onUpdateQuantity,
    removeFromCart: onRemove,
    applyCoupon: onApplyCoupon,
    clearCoupon: onClearCoupon,
    checkout: onCheckout,
  };

  return (
    <CartContext.Provider value={contextValue}>
      <div className="bg-white rounded-lg border p-4 space-y-4">
        {children}
      </div>
    </CartContext.Provider>
  );
}
```

### 3단계: 서브 컴포넌트 생성

```typescript
// components/Cart/CartHeader.tsx
import { useCartContext } from './CartContext';

export function CartHeader() {
  const { cart } = useCartContext();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <h2 className="text-lg font-semibold flex items-center gap-2">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      장바구니 ({itemCount}개)
    </h2>
  );
}
```

```typescript
// components/Cart/CartItemList.tsx
import { useCartContext } from './CartContext';
import { CartItemCard } from './CartItemCard';

export function CartItemList() {
  const { cart, updateQuantity, removeFromCart } = useCartContext();

  if (cart.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">장바구니가 비어있습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cart.map(item => (
        <CartItemCard
          key={item.product.id}
          item={item}
          onUpdateQuantity={(qty) => updateQuantity(item.product.id, qty)}
          onRemove={() => removeFromCart(item.product.id)}
        />
      ))}
    </div>
  );
}
```

```typescript
// components/Cart/CartCouponSelector.tsx
import { Coupon } from '../../types';
import { useCartContext } from './CartContext';

interface CartCouponSelectorProps {
  coupons: Coupon[];
}

export function CartCouponSelector({ coupons }: CartCouponSelectorProps) {
  const { selectedCoupon, applyCoupon, clearCoupon } = useCartContext();

  return (
    <div className="border-t pt-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">쿠폰 할인</h3>
      <select
        className="w-full text-sm border rounded px-3 py-2"
        value={selectedCoupon?.code || ''}
        onChange={(e) => {
          const coupon = coupons.find(c => c.code === e.target.value);
          coupon ? applyCoupon(coupon) : clearCoupon();
        }}
      >
        <option value="">쿠폰 선택</option>
        {coupons.map(coupon => (
          <option key={coupon.code} value={coupon.code}>
            {coupon.name} (
              {coupon.discountType === 'amount'
                ? `${coupon.discountValue.toLocaleString()}원`
                : `${coupon.discountValue}%`}
            )
          </option>
        ))}
      </select>
    </div>
  );
}
```

```typescript
// components/Cart/CartSummary.tsx
import { useCartContext } from './CartContext';

export function CartSummary() {
  const { totals } = useCartContext();
  const discount = totals.totalBeforeDiscount - totals.totalAfterDiscount;

  return (
    <div className="border-t pt-4 space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-600">상품 금액</span>
        <span className="font-medium">
          {totals.totalBeforeDiscount.toLocaleString()}원
        </span>
      </div>
      
      {discount > 0 && (
        <div className="flex justify-between text-red-500">
          <span>할인 금액</span>
          <span>-{discount.toLocaleString()}원</span>
        </div>
      )}
      
      <div className="flex justify-between py-2 border-t font-bold text-lg">
        <span>결제 예정 금액</span>
        <span>{totals.totalAfterDiscount.toLocaleString()}원</span>
      </div>
    </div>
  );
}
```

```typescript
// components/Cart/CartCheckoutButton.tsx
import { useCartContext } from './CartContext';

export function CartCheckoutButton() {
  const { cart, totals, checkout } = useCartContext();

  if (cart.length === 0) return null;

  return (
    <button
      onClick={checkout}
      className="w-full py-3 bg-yellow-400 text-gray-900 rounded-md font-medium 
                 hover:bg-yellow-500 transition-colors"
    >
      {totals.totalAfterDiscount.toLocaleString()}원 결제하기
    </button>
  );
}
```

### 4단계: Compound Component 조립

```typescript
// components/Cart/index.tsx
import { CartRoot } from './CartRoot';
import { CartHeader } from './CartHeader';
import { CartItemList } from './CartItemList';
import { CartCouponSelector } from './CartCouponSelector';
import { CartSummary } from './CartSummary';
import { CartCheckoutButton } from './CartCheckoutButton';

// Object.assign으로 서브 컴포넌트 연결
export const Cart = Object.assign(CartRoot, {
  Header: CartHeader,
  ItemList: CartItemList,
  CouponSelector: CartCouponSelector,
  Summary: CartSummary,
  CheckoutButton: CartCheckoutButton,
});

// 개별 export도 제공
export { CartHeader, CartItemList, CartCouponSelector, CartSummary, CartCheckoutButton };
```

---

## 📝 사용 예시

### 기본 사용법

```tsx
// pages/ShoppingPage.tsx
import { Cart } from '../components/Cart';
import { useCart } from '../hooks/useCart';
import { useCoupons } from '../hooks/useCoupons';

function ShoppingPage() {
  const {
    cart,
    selectedCoupon,
    totals,
    addToCart,
    removeFromCart,
    updateQuantity,
    applyCoupon,
    clearCoupon,
    clearCart,
  } = useCart();
  
  const { coupons } = useCoupons();

  const handleCheckout = () => {
    alert('주문이 완료되었습니다!');
    clearCart();
  };

  return (
    <div className="grid grid-cols-4 gap-6">
      {/* 상품 목록 */}
      <div className="col-span-3">
        {/* ... ProductList */}
      </div>
      
      {/* 장바구니 - Compound Component 사용 */}
      <div className="col-span-1">
        <Cart
          cart={cart}
          selectedCoupon={selectedCoupon}
          totals={totals}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          onApplyCoupon={applyCoupon}
          onClearCoupon={clearCoupon}
          onCheckout={handleCheckout}
        >
          <Cart.Header />
          <Cart.ItemList />
          <Cart.CouponSelector coupons={coupons} />
          <Cart.Summary />
          <Cart.CheckoutButton />
        </Cart>
      </div>
    </div>
  );
}
```

### 유연한 구성

```tsx
// 쿠폰 없이 간단한 장바구니
<Cart {...cartProps}>
  <Cart.Header />
  <Cart.ItemList />
  <Cart.Summary />
  <Cart.CheckoutButton />
</Cart>

// 커스텀 레이아웃
<Cart {...cartProps}>
  <div className="flex justify-between items-center">
    <Cart.Header />
    <Cart.CheckoutButton />
  </div>
  <Cart.ItemList />
  <div className="grid grid-cols-2 gap-4">
    <Cart.CouponSelector coupons={coupons} />
    <Cart.Summary />
  </div>
</Cart>

// 조건부 렌더링
<Cart {...cartProps}>
  <Cart.Header />
  <Cart.ItemList />
  {showCoupons && <Cart.CouponSelector coupons={coupons} />}
  <Cart.Summary />
  {!isReadOnly && <Cart.CheckoutButton />}
</Cart>
```

---

## 🎨 더 많은 Compound Component 예시

### ProductCard Compound Component

```typescript
// components/ProductCard/index.tsx
import { createContext, useContext, ReactNode } from 'react';
import { Product } from '../../types';

// Context
interface ProductCardContextType {
  product: Product;
  remainingStock: number;
  onAddToCart: () => void;
}

const ProductCardContext = createContext<ProductCardContextType | null>(null);

const useProductCardContext = () => {
  const context = useContext(ProductCardContext);
  if (!context) throw new Error('ProductCard 내부에서만 사용 가능');
  return context;
};

// Root
interface ProductCardRootProps {
  children: ReactNode;
  product: Product;
  remainingStock: number;
  onAddToCart: () => void;
}

function ProductCardRoot({ children, product, remainingStock, onAddToCart }: ProductCardRootProps) {
  return (
    <ProductCardContext.Provider value={{ product, remainingStock, onAddToCart }}>
      <div className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow">
        {children}
      </div>
    </ProductCardContext.Provider>
  );
}

// Sub-components
function ProductCardImage() {
  const { product } = useProductCardContext();
  
  return (
    <div className="relative aspect-square bg-gray-100">
      {/* 이미지 플레이스홀더 */}
      <div className="flex items-center justify-center h-full">
        <svg className="w-24 h-24 text-gray-300" /* ... */ />
      </div>
      
      {product.discounts.length > 0 && (
        <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
          ~{Math.max(...product.discounts.map(d => d.rate)) * 100}%
        </span>
      )}
    </div>
  );
}

function ProductCardInfo() {
  const { product } = useProductCardContext();
  
  return (
    <div className="p-4">
      <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
      <p className="text-lg font-bold">{product.price.toLocaleString()}원</p>
      {product.discounts.length > 0 && (
        <p className="text-xs text-gray-500">
          {product.discounts[0].quantity}개 이상 구매시 {product.discounts[0].rate * 100}% 할인
        </p>
      )}
    </div>
  );
}

function ProductCardStock() {
  const { remainingStock } = useProductCardContext();
  
  if (remainingStock <= 0) {
    return <p className="text-xs text-red-600 font-medium px-4">품절</p>;
  }
  
  if (remainingStock <= 5) {
    return <p className="text-xs text-red-600 font-medium px-4">품절임박! {remainingStock}개 남음</p>;
  }
  
  return <p className="text-xs text-gray-500 px-4">재고 {remainingStock}개</p>;
}

function ProductCardActions() {
  const { remainingStock, onAddToCart } = useProductCardContext();
  
  return (
    <div className="p-4 pt-0">
      <button
        onClick={onAddToCart}
        disabled={remainingStock <= 0}
        className={`w-full py-2 rounded-md font-medium transition-colors ${
          remainingStock <= 0
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
      >
        {remainingStock <= 0 ? '품절' : '장바구니 담기'}
      </button>
    </div>
  );
}

// Export
export const ProductCard = Object.assign(ProductCardRoot, {
  Image: ProductCardImage,
  Info: ProductCardInfo,
  Stock: ProductCardStock,
  Actions: ProductCardActions,
});
```

### 사용 예시

```tsx
<ProductCard
  product={product}
  remainingStock={remainingStock}
  onAddToCart={() => addToCart(product)}
>
  <ProductCard.Image />
  <ProductCard.Info />
  <ProductCard.Stock />
  <ProductCard.Actions />
</ProductCard>
```

---

## 🔄 Tabs Compound Component

관리자 페이지의 탭 전환에 활용할 수 있습니다.

```typescript
// components/ui/Tabs/index.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tabs 내부에서만 사용 가능');
  return context;
};

// Root
interface TabsRootProps {
  children: ReactNode;
  defaultTab: string;
  onTabChange?: (tab: string) => void;
}

function TabsRoot({ children, defaultTab, onTabChange }: TabsRootProps) {
  const [activeTab, setActiveTabState] = useState(defaultTab);
  
  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    onTabChange?.(tab);
  };
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
}

// List
function TabsList({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

// Trigger
interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
}

function TabsTrigger({ value, children, className = '' }: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;
  
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`
        py-2 px-4 border-b-2 font-medium text-sm transition-colors
        ${isActive 
          ? 'border-gray-900 text-gray-900' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
}

// Content
interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

function TabsContent({ value, children, className = '' }: TabsContentProps) {
  const { activeTab } = useTabsContext();
  
  if (activeTab !== value) return null;
  
  return <div className={className}>{children}</div>;
}

// Export
export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});
```

### 사용 예시

```tsx
// AdminPage.tsx
<Tabs defaultTab="products" onTabChange={(tab) => console.log('탭 변경:', tab)}>
  <Tabs.List className="mb-6">
    <Tabs.Trigger value="products">상품 관리</Tabs.Trigger>
    <Tabs.Trigger value="coupons">쿠폰 관리</Tabs.Trigger>
    <Tabs.Trigger value="orders">주문 관리</Tabs.Trigger>
  </Tabs.List>
  
  <Tabs.Content value="products">
    <ProductManagement />
  </Tabs.Content>
  
  <Tabs.Content value="coupons">
    <CouponManagement />
  </Tabs.Content>
  
  <Tabs.Content value="orders">
    <OrderManagement />
  </Tabs.Content>
</Tabs>
```

---

## ✅ Compound Components의 장점

| 장점 | 설명 |
|------|------|
| **선언적 API** | 사용처에서 구조가 명확히 보임 |
| **유연한 구성** | 서브 컴포넌트 조합 자유로움 |
| **Props Drilling 해결** | Context로 상태 공유 |
| **관심사 분리** | 각 서브 컴포넌트가 단일 책임 |
| **재사용성** | 서브 컴포넌트 개별 사용 가능 |
| **테스트 용이** | 각 컴포넌트 독립적 테스트 |

---

## ⚠️ 주의사항

1. **과도한 사용 금지**: 단순한 컴포넌트에는 불필요
2. **Context 범위**: 필요한 범위에서만 사용
3. **타입 안전성**: TypeScript로 Context 타입 정의 필수
4. **에러 핸들링**: Context가 없을 때 명확한 에러 메시지

---

## 📚 참고

- [React Patterns - Compound Components](https://kentcdodds.com/blog/compound-components-with-react-hooks)
- [Headless UI](https://headlessui.com/) - Compound Component 패턴 활용 라이브러리
- [Radix UI](https://www.radix-ui.com/) - 유사 패턴 사용

