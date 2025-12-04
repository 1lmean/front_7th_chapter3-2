import { useState, useCallback } from "react";
import { useDebounce } from "./hooks/useDebounce";
import { useProducts } from "./hooks/useProducts";
import { useCoupons } from "./hooks/useCoupons";
import { useNotification } from "./hooks/useNotification";
import { Header } from "./components/Header";
import { ToastContainer } from "./components/ToastContainer";
import { SearchInput, CartIcon } from "./features";
import { MainPage } from "./pages/MainPage";
import { AdminPage } from "./pages/AdminPage";

const App = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { coupons, addCoupon, deleteCoupon } = useCoupons();
  const { notifications, addNotification, removeNotification } =
    useNotification();

  // MainPage에서 Callback Props로 전달받는 상태
  const [totalItemCount, setTotalItemCount] = useState(0);

  // Callback Props - MainPage에서 호출
  const handleTotalItemCountChange = useCallback((count: number) => {
    setTotalItemCount(count);
  }, []);

  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const filteredProducts = debouncedSearchTerm
    ? products.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          (product.description &&
            product.description
              .toLowerCase()
              .includes(debouncedSearchTerm.toLowerCase()))
      )
    : products;

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer
        notifications={notifications}
        onRemove={removeNotification}
      />

      <Header.Root>
        <Header.Left>
          <Header.Logo />
          {!isAdmin && (
            <SearchInput value={searchTerm} onChange={setSearchTerm} />
          )}
        </Header.Left>
        <Header.Right>
          <Header.AdminToggle
            isAdmin={isAdmin}
            onToggle={() => setIsAdmin(!isAdmin)}
          />
          {!isAdmin && <CartIcon itemCount={totalItemCount} show={!isAdmin} />}
        </Header.Right>
      </Header.Root>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isAdmin ? (
          <AdminPage
            products={products}
            addProduct={addProduct}
            updateProduct={updateProduct}
            deleteProduct={deleteProduct}
            coupons={coupons}
            addCoupon={addCoupon}
            deleteCoupon={deleteCoupon}
            addNotification={addNotification}
          />
        ) : (
          <MainPage
            products={products}
            filteredProducts={filteredProducts}
            debouncedSearchTerm={debouncedSearchTerm}
            coupons={coupons}
            onTotalItemCountChange={handleTotalItemCountChange}
            addNotification={addNotification}
          />
        )}
      </main>
    </div>
  );
};

export default App;
