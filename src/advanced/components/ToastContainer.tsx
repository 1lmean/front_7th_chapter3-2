import { Toast } from "./Toast";

interface Notification {
  id: string;
  type: "success" | "error" | "warning";
  message: string;
}

interface ToastContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export const ToastContainer = ({
  notifications,
  onRemove,
}: ToastContainerProps) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notif) => (
        <Toast
          key={notif.id}
          id={notif.id}
          type={notif.type}
          message={notif.message}
          onClose={onRemove}
        />
      ))}
    </div>
  );
};

