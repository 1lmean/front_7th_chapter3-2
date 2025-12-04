import { useCallback } from "react";
import { Coupon } from "../../types";
import { initialCoupons } from "../constants";
import { useLocalStorage } from "./useLocalStorage";

/**
 * useCoupons - 쿠폰 목록 관리 훅 (CRUD)
 *
 * 책임: 쿠폰 목록 상태 관리, localStorage 동기화
 * 주의: selectedCoupon, applyCoupon은 cart와 관련되므로 App 레벨에서 관리
 */
export function useCoupons() {
  const [coupons, setCoupons] = useLocalStorage<Coupon[]>(
    "coupons",
    initialCoupons
  );

  // 쿠폰 추가
  const addCoupon = useCallback(
    (newCoupon: Coupon): { success: boolean; message: string } => {
      const existingCoupon = coupons.find((c) => c.code === newCoupon.code);
      if (existingCoupon) {
        return { success: false, message: "이미 존재하는 쿠폰 코드입니다." };
      }
      setCoupons((prev) => [...prev, newCoupon]);
      return { success: true, message: "쿠폰이 추가되었습니다." };
    },
    [coupons]
  );

  // 쿠폰 삭제
  const deleteCoupon = useCallback(
    (couponCode: string): { success: boolean; message: string } => {
      setCoupons((prev) => prev.filter((c) => c.code !== couponCode));
      return { success: true, message: "쿠폰이 삭제되었습니다." };
    },
    []
  );

  // 쿠폰 조회
  const getCoupon = useCallback(
    (code: string): Coupon | undefined => {
      return coupons.find((c) => c.code === code);
    },
    [coupons]
  );

  return { coupons, addCoupon, deleteCoupon, getCoupon };
}
