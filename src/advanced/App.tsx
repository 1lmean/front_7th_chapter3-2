import { useState } from "react";
import { Header } from "./components/Header";
import { ToastContainer } from "./components/ToastContainer";
import { CartIcon, SearchInput } from "./features";
import { MainPage } from "./pages/MainPage";
import { AdminPage } from "./pages/AdminPage";
import { useCartStore } from "./store/useCartStore";

const App = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { getTotalItemCount } = useCartStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />

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
          {!isAdmin && <CartIcon itemCount={getTotalItemCount()} />}
        </Header.Right>
      </Header.Root>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isAdmin ? <AdminPage /> : <MainPage searchTerm={searchTerm} />}
      </main>
    </div>
  );
};

export default App;
