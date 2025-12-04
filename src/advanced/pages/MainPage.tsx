import { useEffect, useCallback } from "react";
import { Coupon, Product } from "../../types";
import { getRemainingStock } from "../models/cart";
import { ProductWithUI } from "../hooks/useProducts";
import { useCart } from "../hooks/useCart";
import { CartList, ProductList, CheckoutSection } from "../features";

interface MainPageProps {
  // 상품 관련
  products: ProductWithUI[];
  filteredProducts: ProductWithUI[];
  debouncedSearchTerm: string;

  // 쿠폰 관련
  coupons: Coupon[];

  // Callback Props - App에 상태 전달
  onTotalItemCountChange: (count: number) => void;
  addNotification: (message: string, type: "success" | "error") => void;
}

export const MainPage = ({
  products,
  filteredProducts,
  debouncedSearchTerm,
  coupons,
  onTotalItemCountChange,
  addNotification,
}: MainPageProps) => {
  // useCart를 MainPage 내부에서 호출
  const {
    cart,
    selectedCoupon,
    totalItemCount,
    totals,
    addToCart: addToCartAction,
    removeFromCart,
    updateQuantity: updateQuantityAction,
    applyCoupon: applyCouponAction,
    removeCoupon,
    completeOrder: completeOrderAction,
  } = useCart(products);

  // totalItemCount가 변경될 때 App에 알림 (Callback Props 패턴)
  useEffect(() => {
    onTotalItemCountChange(totalItemCount);
  }, [totalItemCount, onTotalItemCountChange]);

  // 순수 함수 래퍼 - cart를 클로저로 캡처
  const getRemainingStockForProduct = useCallback(
    (product: Product): number => {
      return getRemainingStock(product, cart);
    },
    [cart]
  );

  // notification 래퍼 함수들
  const addToCart = useCallback(
    (product: ProductWithUI) => {
      const result = addToCartAction(product);
      addNotification(result.message, result.success ? "success" : "error");
    },
    [addToCartAction, addNotification]
  );

  const updateQuantity = useCallback(
    (productId: string, newQuantity: number) => {
      const result = updateQuantityAction(productId, newQuantity);
      if (result) {
        addNotification(result.message, result.success ? "success" : "error");
      }
    },
    [updateQuantityAction, addNotification]
  );

  const applyCoupon = useCallback(
    (coupon: Coupon) => {
      const result = applyCouponAction(coupon);
      addNotification(result.message, result.success ? "success" : "error");
    },
    [applyCouponAction, addNotification]
  );

  const completeOrder = useCallback(() => {
    const result = completeOrderAction();
    addNotification(result.message, result.success ? "success" : "error");
  }, [completeOrderAction, addNotification]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <ProductList
          filteredProducts={filteredProducts}
          debouncedSearchTerm={debouncedSearchTerm}
          getRemainingStock={getRemainingStockForProduct}
          addToCart={addToCart}
        />
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-4">
          <CartList
            cart={cart}
            removeFromCart={removeFromCart}
            updateQuantity={updateQuantity}
          />

          {cart.length > 0 && (
            <CheckoutSection
              coupons={coupons}
              selectedCoupon={selectedCoupon}
              applyCoupon={applyCoupon}
              removeCoupon={removeCoupon}
              totals={totals}
              completeOrder={completeOrder}
            />
          )}
        </div>
      </div>
    </div>
  );
};
