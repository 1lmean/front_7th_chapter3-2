import { useCartStore } from "../../store/useCartStore";
import { useCouponStore } from "../../store/useCouponStore";
import { useNotificationStore } from "../../store/useNotificationStore";

export const CheckoutSection = () => {
  // Store에서 상태 및 액션 가져오기
  // cart와 selectedCoupon을 직접 구독하여 리렌더링 보장
  const cart = useCartStore((state) => state.cart);
  const selectedCoupon = useCartStore((state) => state.selectedCoupon);
  const {
    getTotals,
    applyCoupon: applyCouponAction,
    removeCoupon: removeCouponAction,
    completeOrder: completeOrderAction,
  } = useCartStore();
  const { coupons } = useCouponStore();
  const { addNotification } = useNotificationStore();

  // totals 계산 - cart와 selectedCoupon이 변경될 때마다 재계산
  const totals = getTotals();

  // Notification 래퍼 함수들
  const applyCoupon = (coupon: typeof coupons[0]) => {
    const result = applyCouponAction(coupon);
    addNotification(result.message, result.success ? "success" : "error");
  };

  const removeCoupon = () => {
    removeCouponAction();
  };

  const completeOrder = () => {
    const result = completeOrderAction();
    addNotification(result.message, result.success ? "success" : "error");
  };
  return (
    <>
      <section className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">쿠폰 할인</h3>
          <button className="text-xs text-blue-600 hover:underline">
            쿠폰 등록
          </button>
        </div>
        {coupons.length > 0 && (
          <select
            className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            value={selectedCoupon?.code || ""}
            onChange={(e) => {
              const coupon = coupons.find((c) => c.code === e.target.value);
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
          {totals.totalBeforeDiscount - totals.totalAfterDiscount > 0 && (
            <div className="flex justify-between text-red-500">
              <span>할인 금액</span>
              <span>-{(totals.totalBeforeDiscount - totals.totalAfterDiscount).toLocaleString()}원</span>
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
  );
};
