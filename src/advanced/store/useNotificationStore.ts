import { create } from "zustand";

interface Notification {
  id: string;
  message: string;
  type: "success" | "error" | "warning";
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (
    message: string,
    type?: "success" | "error" | "warning"
  ) => void;
  removeNotification: (id: string) => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  addNotification: (message, type = "success") => {
    const id = Date.now().toString();
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }],
    }));

    // 3초 후 자동 제거
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, 3000);
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  reset: () => {
    set({ notifications: [] });
  },
}));
