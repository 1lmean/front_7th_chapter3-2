export const formatPrice = (price: number): string => {
  return `₩${price.toLocaleString()}`;
};

export const formatPriceKorean = (price: number): string => {
  return `${price.toLocaleString()}원`;
};

export const formatPercentage = (rate: number): string => {
  return `${Math.round(rate * 100)}%`;
};
