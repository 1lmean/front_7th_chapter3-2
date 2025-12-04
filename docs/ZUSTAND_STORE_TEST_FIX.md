# Zustand Store 테스트 문제 해결 문서

## 📋 개요

Advanced 버전에서 Zustand를 사용한 전역 상태 관리로 인해 테스트가 실패하는 문제를 해결한 내용을 정리합니다.

## 🔴 문제 상황

### 증상
- 21개 테스트 중 9개 실패
- 알림 메시지가 중복으로 쌓임 (17개 이상)
- 테스트 간 상태가 공유되어 예상치 못한 결과 발생

### 실패한 테스트 목록
1. `UI 상태 관리 > 할인이 있을 때 할인율이 표시된다`
2. `UI 상태 관리 > 검색을 초기화할 수 있다`
3. `UI 상태 관리 > 알림 메시지가 자동으로 사라진다`
4. `로컬스토리지 동기화 > 상품, 장바구니, 쿠폰이 localStorage에 저장된다`
5. 기타 상태 관련 테스트들

### 원인 분석

#### Basic vs Advanced 아키텍처 차이

| 항목 | Basic | Advanced |
|------|-------|----------|
| 상태 관리 | React Hooks (`useState`, `useCallback`) | Zustand Global Store |
| 상태 생명주기 | 컴포넌트 마운트/언마운트에 따름 | 앱 전체에서 유지 (싱글톤) |
| 테스트 격리 | 자동 (컴포넌트 unmount 시 초기화) | 수동 초기화 필요 |

#### 핵심 문제
```
테스트 A 실행 → 알림 3개 생성
테스트 B 실행 → 이전 알림 3개 + 새 알림 2개 = 5개
테스트 C 실행 → 이전 알림 5개 + 새 알림 4개 = 9개
...
```

Zustand store는 **전역 싱글톤**이므로 테스트 간에 상태가 누적됩니다.

---

## 🟢 해결 방법

### 1. 각 Store에 `reset` 메서드 추가

모든 Zustand store에 상태를 초기값으로 되돌리는 `reset` 메서드를 추가합니다.

---

### 📁 `src/advanced/store/useNotificationStore.ts`

#### 변경 전
```typescript
interface NotificationState {
  notifications: Notification[];
  addNotification: (message: string, type?: "success" | "error" | "warning") => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (message, type = "success") => { /* ... */ },
  removeNotification: (id) => { /* ... */ },
}));
```

#### 변경 후
```typescript
interface NotificationState {
  notifications: Notification[];
  addNotification: (message: string, type?: "success" | "error" | "warning") => void;
  removeNotification: (id: string) => void;
  reset: () => void;  // 추가
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (message, type = "success") => { /* ... */ },
  removeNotification: (id) => { /* ... */ },
  
  // 추가: 테스트 간 상태 초기화를 위한 reset 메서드
  reset: () => {
    set({ notifications: [] });
  },
}));
```

---

### 📁 `src/advanced/store/useCartStore.ts`

#### 변경 전
```typescript
interface CartState {
  cart: CartItem[];
  selectedCoupon: Coupon | null;
  addToCart: (product: Product) => { success: boolean; message: string };
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => { success: boolean; message: string } | null;
  applyCoupon: (coupon: Coupon) => { success: boolean; message: string };
  removeCoupon: () => void;
  completeOrder: () => { success: boolean; message: string };
  getTotals: () => { totalBeforeDiscount: number; totalAfterDiscount: number };
  getTotalItemCount: () => number;
  getRemainingStock: (product: Product) => number;
}
```

#### 변경 후
```typescript
interface CartState {
  cart: CartItem[];
  selectedCoupon: Coupon | null;
  addToCart: (product: Product) => { success: boolean; message: string };
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => { success: boolean; message: string } | null;
  applyCoupon: (coupon: Coupon) => { success: boolean; message: string };
  removeCoupon: () => void;
  completeOrder: () => { success: boolean; message: string };
  reset: () => void;  // 추가
  getTotals: () => { totalBeforeDiscount: number; totalAfterDiscount: number };
  getTotalItemCount: () => number;
  getRemainingStock: (product: Product) => number;
}

// 구현부에 추가
reset: () => {
  set({ cart: [], selectedCoupon: null });
},
```

---

### 📁 `src/advanced/store/useProductStore.ts`

#### 변경 전
```typescript
interface ProductState {
  products: ProductWithUI[];
  addProduct: (product: Omit<ProductWithUI, "id">) => void;
  updateProduct: (id: string, updates: Partial<ProductWithUI>) => void;
  deleteProduct: (id: string) => void;
}
```

#### 변경 후
```typescript
interface ProductState {
  products: ProductWithUI[];
  addProduct: (product: Omit<ProductWithUI, "id">) => void;
  updateProduct: (id: string, updates: Partial<ProductWithUI>) => void;
  deleteProduct: (id: string) => void;
  reset: () => void;  // 추가
}

// 구현부에 추가
reset: () => {
  set({ products: initialProducts });
},
```

---

### 📁 `src/advanced/store/useCouponStore.ts`

#### 변경 전
```typescript
interface CouponState {
  coupons: Coupon[];
  addCoupon: (coupon: Coupon) => { success: boolean; message: string };
  deleteCoupon: (code: string) => { success: boolean; message: string };
}
```

#### 변경 후
```typescript
interface CouponState {
  coupons: Coupon[];
  addCoupon: (coupon: Coupon) => { success: boolean; message: string };
  deleteCoupon: (code: string) => { success: boolean; message: string };
  reset: () => void;  // 추가
}

// 구현부에 추가
reset: () => {
  set({ coupons: initialCoupons });
},
```

---

### 2. 테스트 파일 수정

### 📁 `src/advanced/__tests__/origin.test.tsx`

#### Store Import 추가
```typescript
// 변경 전
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import App from "../App";
import "../../setupTests";

// 변경 후
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import App from "../App";
import "../../setupTests";
import { useCartStore } from "../store/useCartStore";
import { useProductStore } from "../store/useProductStore";
import { useCouponStore } from "../store/useCouponStore";
import { useNotificationStore } from "../store/useNotificationStore";
```

#### beforeEach에서 Store Reset 호출
```typescript
// 변경 전
beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

// 변경 후
beforeEach(() => {
  localStorage.clear();

  // Zustand store 초기화
  useCartStore.getState().reset();
  useProductStore.getState().reset();
  useCouponStore.getState().reset();
  useNotificationStore.getState().reset();

  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});
```

---

### 3. localStorage 테스트 수정

Zustand persist 미들웨어는 localStorage에 다른 형식으로 저장합니다.

#### 저장 형식 비교

| 항목 | Basic (useLocalStorage) | Advanced (Zustand persist) |
|------|-------------------------|----------------------------|
| cart | `[{...}, {...}]` | `{ state: { cart: [...] }, version: 0 }` |
| products | `[{...}, {...}]` | `{ state: { products: [...] }, version: 0 }` |

#### 테스트 코드 수정
```typescript
// 변경 전
expect(localStorage.getItem("cart")).toBeTruthy();
expect(JSON.parse(localStorage.getItem("cart"))).toHaveLength(1);

const products = JSON.parse(localStorage.getItem("products"));
expect(products.some((p) => p.name === "저장 테스트")).toBe(true);

// 변경 후
expect(localStorage.getItem("cart")).toBeTruthy();
const cartData = JSON.parse(localStorage.getItem("cart"));
expect(cartData.state.cart).toHaveLength(1);

const productsData = JSON.parse(localStorage.getItem("products"));
expect(productsData.state.products.some((p) => p.name === "저장 테스트")).toBe(true);
```

---

## 📊 결과

### 테스트 실행 결과
```
 ✓ src/advanced/__tests__/origin.test.tsx (21 tests) 5612ms

 Test Files  1 passed (1)
      Tests  21 passed (21)
```

### 변경 전후 비교
| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 통과 테스트 | 12/21 | 21/21 |
| 실패 테스트 | 9/21 | 0/21 |

---

## 💡 핵심 교훈

### 1. Zustand 테스트 시 주의사항
- Zustand는 전역 싱글톤이므로 테스트 간 상태 격리가 자동으로 되지 않음
- 각 테스트 전에 명시적으로 store를 초기화해야 함

### 2. Reset 메서드 패턴
```typescript
// Zustand store에 reset 메서드 추가 패턴
export const useMyStore = create<MyState>()((set) => ({
  // 초기 상태
  data: initialData,
  
  // 액션들
  addData: (item) => { /* ... */ },
  
  // reset 메서드 - 테스트 및 로그아웃 등에 사용
  reset: () => {
    set({ data: initialData });
  },
}));
```

### 3. Zustand persist 형식 이해
```typescript
// localStorage에 저장되는 형식
{
  "state": {
    "cart": [...],
    "selectedCoupon": null
  },
  "version": 0
}
```

---

## 📚 관련 파일

- `src/advanced/store/useNotificationStore.ts`
- `src/advanced/store/useCartStore.ts`
- `src/advanced/store/useProductStore.ts`
- `src/advanced/store/useCouponStore.ts`
- `src/advanced/__tests__/origin.test.tsx`

---

## 🔗 참고 자료

- [Zustand Testing Guide](https://docs.pmnd.rs/zustand/guides/testing)
- [Zustand Persist Middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)

