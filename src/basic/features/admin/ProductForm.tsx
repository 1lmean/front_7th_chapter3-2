import {
  createContext,
  useContext,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

// ============ Types ============
export interface ProductFormData {
  name: string;
  price: number;
  stock: number;
  description: string;
  discounts: Array<{ quantity: number; rate: number }>;
}

interface ProductFormContextType {
  formData: ProductFormData;
  setFormData: Dispatch<SetStateAction<ProductFormData>>;
  addNotification: (message: string, type: "success" | "error") => void;
}

// ============ Context ============
const ProductFormContext = createContext<ProductFormContextType | null>(null);

const useProductFormContext = () => {
  const context = useContext(ProductFormContext);
  if (!context) {
    throw new Error(
      "ProductForm 컴포넌트는 ProductForm.Root 내부에서 사용해야 합니다."
    );
  }
  return context;
};

// ============ Root ============
interface RootProps {
  children: ReactNode;
  formData: ProductFormData;
  setFormData: Dispatch<SetStateAction<ProductFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  addNotification: (message: string, type: "success" | "error") => void;
}

const Root = ({
  children,
  formData,
  setFormData,
  onSubmit,
  addNotification,
}: RootProps) => {
  return (
    <ProductFormContext.Provider
      value={{ formData, setFormData, addNotification }}
    >
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <form onSubmit={onSubmit} className="space-y-4">
          {children}
        </form>
      </div>
    </ProductFormContext.Provider>
  );
};

// ============ Title ============
interface TitleProps {
  children: ReactNode;
}

const Title = ({ children }: TitleProps) => {
  return <h3 className="text-lg font-medium text-gray-900">{children}</h3>;
};

// ============ Fields ============
const Fields = () => {
  const { formData, setFormData, addNotification } = useProductFormContext();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* 상품명 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          상품명
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border"
          required
        />
      </div>

      {/* 설명 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          설명
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border"
        />
      </div>

      {/* 가격 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          가격
        </label>
        <input
          type="text"
          value={formData.price === 0 ? "" : formData.price}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "" || /^\d+$/.test(value)) {
              setFormData({
                ...formData,
                price: value === "" ? 0 : parseInt(value),
              });
            }
          }}
          onBlur={(e) => {
            const value = e.target.value;
            if (value === "") {
              setFormData({ ...formData, price: 0 });
            } else if (parseInt(value) < 0) {
              addNotification("가격은 0보다 커야 합니다", "error");
              setFormData({ ...formData, price: 0 });
            }
          }}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border"
          placeholder="숫자만 입력"
          required
        />
      </div>

      {/* 재고 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          재고
        </label>
        <input
          type="text"
          value={formData.stock === 0 ? "" : formData.stock}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "" || /^\d+$/.test(value)) {
              setFormData({
                ...formData,
                stock: value === "" ? 0 : parseInt(value),
              });
            }
          }}
          onBlur={(e) => {
            const value = e.target.value;
            if (value === "") {
              setFormData({ ...formData, stock: 0 });
            } else if (parseInt(value) < 0) {
              addNotification("재고는 0보다 커야 합니다", "error");
              setFormData({ ...formData, stock: 0 });
            } else if (parseInt(value) > 9999) {
              addNotification("재고는 9999개를 초과할 수 없습니다", "error");
              setFormData({ ...formData, stock: 9999 });
            }
          }}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border"
          placeholder="숫자만 입력"
          required
        />
      </div>
    </div>
  );
};

// ============ Discounts ============
const Discounts = () => {
  const { formData, setFormData } = useProductFormContext();

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        할인 정책
      </label>
      <div className="space-y-2">
        {formData.discounts.map((discount, index) => (
          <div
            key={index}
            className="flex items-center gap-2 bg-gray-50 p-2 rounded"
          >
            <input
              type="number"
              value={discount.quantity}
              onChange={(e) => {
                const newDiscounts = [...formData.discounts];
                newDiscounts[index].quantity = parseInt(e.target.value) || 0;
                setFormData({ ...formData, discounts: newDiscounts });
              }}
              className="w-20 px-2 py-1 border rounded"
              min="1"
              placeholder="수량"
            />
            <span className="text-sm">개 이상 구매 시</span>
            <input
              type="number"
              value={discount.rate * 100}
              onChange={(e) => {
                const newDiscounts = [...formData.discounts];
                newDiscounts[index].rate =
                  (parseInt(e.target.value) || 0) / 100;
                setFormData({ ...formData, discounts: newDiscounts });
              }}
              className="w-16 px-2 py-1 border rounded"
              min="0"
              max="100"
              placeholder="%"
            />
            <span className="text-sm">% 할인</span>
            <button
              type="button"
              onClick={() => {
                const newDiscounts = formData.discounts.filter(
                  (_, i) => i !== index
                );
                setFormData({ ...formData, discounts: newDiscounts });
              }}
              className="text-red-600 hover:text-red-800"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            setFormData({
              ...formData,
              discounts: [...formData.discounts, { quantity: 10, rate: 0.1 }],
            });
          }}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          + 할인 추가
        </button>
      </div>
    </div>
  );
};

// ============ Actions ============
interface ActionsProps {
  children: ReactNode;
}

const Actions = ({ children }: ActionsProps) => {
  return <div className="flex justify-end gap-3">{children}</div>;
};

// ============ CancelButton ============
interface CancelButtonProps {
  onClick: () => void;
}

const CancelButton = ({ onClick }: CancelButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      취소
    </button>
  );
};

// ============ SubmitButton ============
interface SubmitButtonProps {
  children: ReactNode;
}

const SubmitButton = ({ children }: SubmitButtonProps) => {
  return (
    <button
      type="submit"
      className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
    >
      {children}
    </button>
  );
};

// ============ Export ============
export const ProductForm = {
  Root,
  Title,
  Fields,
  Discounts,
  Actions,
  CancelButton,
  SubmitButton,
};
