import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "../../types";

export interface ProductWithUI extends Product {
  description?: string;
  isRecommended?: boolean;
}

interface ProductState {
  products: ProductWithUI[];
  addProduct: (product: Omit<ProductWithUI, "id">) => void;
  updateProduct: (id: string, updates: Partial<ProductWithUI>) => void;
  deleteProduct: (id: string) => void;
}

const initialProducts: ProductWithUI[] = [
  // ... 기존 initialProducts 데이터
];

export const useProductStore = create<ProductState>()(
  persist(
    (set) => ({
      products: initialProducts,

      addProduct: (newProduct) =>
        set((state) => ({
          products: [
            ...state.products,
            { ...newProduct, id: `p${Date.now()}` },
          ],
        })),

      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),
    }),
    { name: "products" } // localStorage key
  )
);
