interface ToastProps {
  id: string;
  type: "success" | "error" | "warning";
  message: string;
  onClose: (id: string) => void;
}

export const Toast = ({ id, type, message, onClose }: ToastProps) => {
  const bgColor = {
    success: "bg-green-600",
    error: "bg-red-600",
    warning: "bg-yellow-600",
  }[type];

  return (
    <div
      className={`p-4 rounded-md shadow-md text-white flex justify-between items-center ${bgColor}`}
    >
      <span className="mr-2">{message}</span>
      <button
        onClick={() => onClose(id)}
        className="text-white hover:text-gray-200"
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
  );
};
