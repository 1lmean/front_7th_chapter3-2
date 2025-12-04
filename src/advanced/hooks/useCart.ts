import { useState, useCallback } from "react";
import { CartItem, Coupon, Product } from "../../types";
import {
  addItemToCart,
  removeItemFromCart,
  updateCartItemQuantity,
  getRemainingStock,
  calculateCartTotal,
  getTotalItemCount,
} from "../models/cart";
import { useLocalStorage } from "./useLocalStorage";

export interface CartResult {
  success: boolean;
  message: string;
}

/**
 * useCart - 장바구니 관리 훅
 *
 * 책임: cart 상태 관리, localStorage 동기화, 수량/재고 체크
 * products를 받아서 재고 체크에 사용
 */
export function useCart(products: Product[]) {
  const [cart, setCart] = useLocalStorage<CartItem[]>("cart", []);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  // 장바구니에 상품 추가
  const addToCart = useCallback(
    (product: Product): CartResult => {
      const remainingStock = getRemainingStock(product, cart);
      if (remainingStock <= 0) {
        return { success: false, message: "재고가 부족합니다!" };
      }

      // 재고 초과 체크
      const existingItem = cart.find((item) => item.product.id === product.id);
      if (existingItem && existingItem.quantity + 1 > product.stock) {
        return {
          success: false,
          message: `재고는 ${product.stock}개까지만 있습니다.`,
        };
      }

      setCart((prevCart) => addItemToCart(prevCart, product));
      return { success: true, message: "장바구니에 담았습니다" };
    },
    [cart]
  );

  // 장바구니에서 상품 제거
  const removeFromCart = useCallback((productId: string): void => {
    setCart((prevCart) => removeItemFromCart(prevCart, productId));
  }, []);

  // 수량 변경
  const updateQuantity = useCallback(
    (productId: string, newQuantity: number): CartResult | null => {
      if (newQuantity <= 0) {
        removeFromCart(productId);
        return null; // 삭제 처리됨, notification 불필요
      }

      const product = products.find((p) => p.id === productId);
      if (!product) {
        return { success: false, message: "상품을 찾을 수 없습니다." };
      }

      const maxStock = product.stock;
      if (newQuantity > maxStock) {
        return {
          success: false,
          message: `재고는 ${maxStock}개까지만 있습니다.`,
        };
      }

      setCart((prevCart) =>
        updateCartItemQuantity(prevCart, productId, newQuantity)
      );
      return null; // 성공, notification 불필요
    },
    [products, removeFromCart]
  );

  // 쿠폰 적용
  const applyCoupon = useCallback(
    (coupon: Coupon): CartResult => {
      const currentTotal = calculateCartTotal(cart, null).totalAfterDiscount;

      if (currentTotal < 10000 && coupon.discountType === "percentage") {
        return {
          success: false,
          message: "percentage 쿠폰은 10,000원 이상 구매 시 사용 가능합니다.",
        };
      }

      setSelectedCoupon(coupon);
      return { success: true, message: "쿠폰이 적용되었습니다." };
    },
    [cart]
  );

  // 쿠폰 제거
  const removeCoupon = useCallback(() => {
    setSelectedCoupon(null);
  }, []);

  // 주문 완료
  const completeOrder = useCallback((): CartResult => {
    const orderNumber = `ORD-${Date.now()}`;
    setCart([]);
    setSelectedCoupon(null);
    return {
      success: true,
      message: `주문이 완료되었습니다. 주문번호: ${orderNumber}`,
    };
  }, []);

  // 계산된 값들
  const totalItemCount = getTotalItemCount(cart);
  const totals = calculateCartTotal(cart, selectedCoupon);

  return {
    cart,
    selectedCoupon,
    totalItemCount,
    totals,
    addToCart,
    removeFromCart,
    updateQuantity,
    applyCoupon,
    removeCoupon,
    completeOrder,
  };
}
