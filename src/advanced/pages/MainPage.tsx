import { CartList, ProductList, CheckoutSection } from "../features";
import { useCartStore } from "../store/useCartStore";

interface MainPageProps {
  searchTerm: string;
}

export const MainPage = ({ searchTerm }: MainPageProps) => {
  // cart가 비어있는지 확인하기 위해 가져오기
  const { cart } = useCartStore();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <ProductList searchTerm={searchTerm} />
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-4">
          <CartList />

          {cart.length > 0 && <CheckoutSection />}
        </div>
      </div>
    </div>
  );
};
