import { useEffect, useCallback } from "react";
import { Coupon, Product } from "../../types";
import { getRemainingStock } from "../models/cart";
import { ProductWithUI } from "../hooks/useProducts";
import { useCart } from "../hooks/useCart";
import { CartList, ProductList } from "../features";

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
          {/* <section className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              장바구니
            </h2>
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <p className="text-gray-500 text-sm">장바구니가 비어있습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => {
                  const itemTotal = calculateItemTotal(item, cart);
                  const originalPrice = item.product.price * item.quantity;
                  const hasDiscount = itemTotal < originalPrice;
                  const discountRate = hasDiscount
                    ? Math.round((1 - itemTotal / originalPrice) * 100)
                    : 0;

                  return (
                    <div
                      key={item.product.id}
                      className="border-b pb-3 last:border-b-0"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium text-gray-900 flex-1">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-gray-400 hover:text-red-500 ml-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                            className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                          >
                            <span className="text-xs">−</span>
                          </button>
                          <span className="mx-3 text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                            className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                          >
                            <span className="text-xs">+</span>
                          </button>
                        </div>
                        <div className="text-right">
                          {hasDiscount && (
                            <span className="text-xs text-red-500 font-medium block">
                              -{discountRate}%
                            </span>
                          )}
                          <p className="text-sm font-medium text-gray-900">
                            {Math.round(itemTotal).toLocaleString()}원
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section> */}
          <CartList
            cart={cart}
            removeFromCart={removeFromCart}
            updateQuantity={updateQuantity}
          />

          {cart.length > 0 && (
            <>
              <section className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    쿠폰 할인
                  </h3>
                  <button className="text-xs text-blue-600 hover:underline">
                    쿠폰 등록
                  </button>
                </div>
                {coupons.length > 0 && (
                  <select
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                    value={selectedCoupon?.code || ""}
                    onChange={(e) => {
                      const coupon = coupons.find(
                        (c) => c.code === e.target.value
                      );
                      if (coupon) applyCoupon(coupon);
                      else removeCoupon();
                    }}
                  >
                    <option value="">쿠폰 선택</option>
                    {coupons.map((coupon) => (
                      <option key={coupon.code} value={coupon.code}>
                        {coupon.name} (
                        {coupon.discountType === "amount"
                          ? `${coupon.discountValue.toLocaleString()}원`
                          : `${coupon.discountValue}%`}
                        )
                      </option>
                    ))}
                  </select>
                )}
              </section>

              <section className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-lg font-semibold mb-4">결제 정보</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">상품 금액</span>
                    <span className="font-medium">
                      {totals.totalBeforeDiscount.toLocaleString()}원
                    </span>
                  </div>
                  {totals.totalBeforeDiscount - totals.totalAfterDiscount >
                    0 && (
                    <div className="flex justify-between text-red-500">
                      <span>할인 금액</span>
                      <span>
                        -
                        {(
                          totals.totalBeforeDiscount - totals.totalAfterDiscount
                        ).toLocaleString()}
                        원
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-t border-gray-200">
                    <span className="font-semibold">결제 예정 금액</span>
                    <span className="font-bold text-lg text-gray-900">
                      {totals.totalAfterDiscount.toLocaleString()}원
                    </span>
                  </div>
                </div>

                <button
                  onClick={completeOrder}
                  className="w-full mt-4 py-3 bg-yellow-400 text-gray-900 rounded-md font-medium hover:bg-yellow-500 transition-colors"
                >
                  {totals.totalAfterDiscount.toLocaleString()}원 결제하기
                </button>

                <div className="mt-3 text-xs text-gray-500 text-center">
                  <p>* 실제 결제는 이루어지지 않습니다</p>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
