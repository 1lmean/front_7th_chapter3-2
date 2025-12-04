import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Coupon, Product } from "../../types";
import {
  addItemToCart,
  removeItemFromCart,
  updateCartItemQuantity,
  calculateCartTotal,
  getRemainingStock,
  getTotalItemCount,
} from "../models/cart";

interface CartState {
  cart: CartItem[];
  selectedCoupon: Coupon | null;

  // Actions
  addToCart: (product: Product) => { success: boolean; message: string };
  removeFromCart: (productId: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number
  ) => { success: boolean; message: string } | null;
  applyCoupon: (coupon: Coupon) => { success: boolean; message: string };
  removeCoupon: () => void;
  completeOrder: () => { success: boolean; message: string };

  // Computed (getter처럼 사용)
  getTotals: () => { totalBeforeDiscount: number; totalAfterDiscount: number };
  getTotalItemCount: () => number;
  getRemainingStock: (product: Product) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      selectedCoupon: null,

      addToCart: (product) => {
        const { cart } = get();
        const remainingStock = getRemainingStock(product, cart);

        if (remainingStock <= 0) {
          return { success: false, message: "재고가 부족합니다!" };
        }

        const existingItem = cart.find(
          (item) => item.product.id === product.id
        );
        if (existingItem && existingItem.quantity + 1 > product.stock) {
          return {
            success: false,
            message: `재고는 ${product.stock}개까지만 있습니다.`,
          };
        }

        set({ cart: addItemToCart(cart, product) });
        return { success: true, message: "장바구니에 담았습니다" };
      },

      removeFromCart: (productId) => {
        set((state) => ({ cart: removeItemFromCart(state.cart, productId) }));
      },

      updateQuantity: (productId, newQuantity) => {
        if (newQuantity <= 0) {
          get().removeFromCart(productId);
          return null;
        }

        // products는 외부에서 가져와야 함 (store 분리)
        set((state) => ({
          cart: updateCartItemQuantity(state.cart, productId, newQuantity),
        }));
        return null;
      },

      applyCoupon: (coupon) => {
        const totals = get().getTotals();

        if (
          totals.totalAfterDiscount < 10000 &&
          coupon.discountType === "percentage"
        ) {
          return {
            success: false,
            message: "percentage 쿠폰은 10,000원 이상 구매 시 사용 가능합니다.",
          };
        }

        set({ selectedCoupon: coupon });
        return { success: true, message: "쿠폰이 적용되었습니다." };
      },

      removeCoupon: () => set({ selectedCoupon: null }),

      completeOrder: () => {
        const orderNumber = `ORD-${Date.now()}`;
        set({ cart: [], selectedCoupon: null });
        return {
          success: true,
          message: `주문이 완료되었습니다. 주문번호: ${orderNumber}`,
        };
      },

      getTotals: () => {
        const { cart, selectedCoupon } = get();
        return calculateCartTotal(cart, selectedCoupon);
      },

      getTotalItemCount: () => getTotalItemCount(get().cart),

      getRemainingStock: (product) => getRemainingStock(product, get().cart),
    }),
    {
      name: "cart",
      partialize: (state) => ({ cart: state.cart }), // selectedCoupon은 persist 제외
    }
  )
);
