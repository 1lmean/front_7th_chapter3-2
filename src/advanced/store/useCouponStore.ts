import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Coupon } from "../../types";

interface CouponState {
  coupons: Coupon[];
  addCoupon: (coupon: Coupon) => { success: boolean; message: string };
  deleteCoupon: (code: string) => { success: boolean; message: string };
  reset: () => void;
}

const initialCoupons: Coupon[] = [
  {
    name: "5000원 할인",
    code: "AMOUNT5000",
    discountType: "amount",
    discountValue: 5000,
  },
  {
    name: "10% 할인",
    code: "PERCENT10",
    discountType: "percentage",
    discountValue: 10,
  },
];

export const useCouponStore = create<CouponState>()(
  persist(
    (set, get) => ({
      coupons: initialCoupons,

      addCoupon: (newCoupon) => {
        const existing = get().coupons.find((c) => c.code === newCoupon.code);
        if (existing) {
          return { success: false, message: "이미 존재하는 쿠폰 코드입니다." };
        }
        set((state) => ({ coupons: [...state.coupons, newCoupon] }));
        return { success: true, message: "쿠폰이 추가되었습니다." };
      },

      deleteCoupon: (code) => {
        set((state) => ({
          coupons: state.coupons.filter((c) => c.code !== code),
        }));
        return { success: true, message: "쿠폰이 삭제되었습니다." };
      },

      reset: () => {
        set({ coupons: initialCoupons });
      },
    }),
    { name: "coupons" }
  )
);
