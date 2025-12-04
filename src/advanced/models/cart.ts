import { CartItem, Coupon, Product } from "../../types";

/**
 * 적용 가능한 최대 할인율 계산
 * @param item - 장바구니 아이템
 * @param cart - 전체 장바구니 (대량 구매 할인 체크용)
 * @returns 할인율 (0 ~ 1)
 */
export const getMaxApplicableDiscount = (
  item: CartItem,
  cart: CartItem[]
): number => {
  const { discounts } = item.product;
  const { quantity } = item;

  const baseDiscount = discounts.reduce((maxDiscount, discount) => {
    return quantity >= discount.quantity && discount.rate > maxDiscount
      ? discount.rate
      : maxDiscount;
  }, 0);

  // 대량 구매 시 추가 5% 할인 (최대 50%)
  const hasBulkPurchase = cart.some((cartItem) => cartItem.quantity >= 10);
  if (hasBulkPurchase) {
    return Math.min(baseDiscount + 0.05, 0.5);
  }

  return baseDiscount;
};

/**
 * 개별 아이템의 할인 적용 후 총액 계산
 * @param item - 장바구니 아이템
 * @param cart - 전체 장바구니
 * @returns 할인 적용된 금액
 */
export const calculateItemTotal = (
  item: CartItem,
  cart: CartItem[]
): number => {
  const { price } = item.product;
  const { quantity } = item;
  const discount = getMaxApplicableDiscount(item, cart);

  return Math.round(price * quantity * (1 - discount));
};

/**
 * 장바구니 총액 계산 (쿠폰 적용 포함)
 * @param cart - 장바구니 배열
 * @param selectedCoupon - 선택된 쿠폰 (없으면 null)
 * @returns 할인 전/후 총액
 */
export const calculateCartTotal = (
  cart: CartItem[],
  selectedCoupon: Coupon | null
): {
  totalBeforeDiscount: number;
  totalAfterDiscount: number;
} => {
  let totalBeforeDiscount = 0;
  let totalAfterDiscount = 0;

  cart.forEach((item) => {
    const itemPrice = item.product.price * item.quantity;
    totalBeforeDiscount += itemPrice;
    totalAfterDiscount += calculateItemTotal(item, cart); // cart 전달!
  });

  // 쿠폰 적용
  if (selectedCoupon) {
    if (selectedCoupon.discountType === "amount") {
      totalAfterDiscount = Math.max(
        0,
        totalAfterDiscount - selectedCoupon.discountValue
      );
    } else {
      totalAfterDiscount = Math.round(
        totalAfterDiscount * (1 - selectedCoupon.discountValue / 100)
      );
    }
  }

  return {
    totalBeforeDiscount: Math.round(totalBeforeDiscount),
    totalAfterDiscount: Math.round(totalAfterDiscount),
  };
};

/**
 * 상품의 남은 재고 계산
 * @param product - 상품
 * @param cart - 장바구니
 * @returns 남은 재고 수량
 */
export const getRemainingStock = (
  product: Product,
  cart: CartItem[]
): number => {
  const cartItem = cart.find((item) => item.product.id === product.id);
  return product.stock - (cartItem?.quantity || 0);
};

/**
 * 장바구니에 상품 추가
 * @param cart - 현재 장바구니
 * @param product - 추가할 상품
 * @returns 새로운 장바구니 배열
 */
export const addItemToCart = (
  cart: CartItem[],
  product: Product
): CartItem[] => {
  const existingItem = cart.find((item) => item.product.id === product.id);

  if (existingItem) {
    return cart.map((item) =>
      item.product.id === product.id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
  }

  return [...cart, { product, quantity: 1 }];
};

/**
 * 장바구니에서 상품 제거
 * @param cart - 현재 장바구니
 * @param productId - 제거할 상품 ID
 * @returns 새로운 장바구니 배열
 */
export const removeItemFromCart = (
  cart: CartItem[],
  productId: string
): CartItem[] => {
  return cart.filter((item) => item.product.id !== productId);
};

/**
 * 장바구니 아이템 수량 변경
 * @param cart - 현재 장바구니
 * @param productId - 변경할 상품 ID
 * @param quantity - 새 수량
 * @returns 새로운 장바구니 배열
 */
export const updateCartItemQuantity = (
  cart: CartItem[],
  productId: string,
  quantity: number
): CartItem[] => {
  if (quantity <= 0) {
    return removeItemFromCart(cart, productId);
  }

  return cart.map((item) =>
    item.product.id === productId ? { ...item, quantity } : item
  );
};

/**
 * 장바구니에 상품 추가 가능 여부 확인
 * @param product - 상품
 * @param cart - 장바구니
 * @returns 추가 가능 여부
 */
export const canAddToCart = (product: Product, cart: CartItem[]): boolean => {
  return getRemainingStock(product, cart) > 0;
};

/**
 * 장바구니 총 아이템 개수 계산
 * @param cart - 장바구니
 * @returns 총 수량
 */
export const getTotalItemCount = (cart: CartItem[]): number => {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
};
