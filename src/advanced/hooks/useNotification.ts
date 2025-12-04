import { useState, useCallback } from "react";

export interface Notification {
  id: string;
  message: string;
  type: "error" | "success" | "warning";
}

/**
 * useNotification - 알림 관리 훅
 *
 * 책임: 알림 상태 관리, 자동 제거
 */
export function useNotification(autoHideDuration: number = 3000) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 알림 추가
  const addNotification = useCallback(
    (message: string, type: "error" | "success" | "warning" = "success") => {
      const id = Date.now().toString();
      setNotifications((prev) => [...prev, { id, message, type }]);

      // 자동 제거
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, autoHideDuration);
    },
    [autoHideDuration]
  );

  // 알림 수동 제거
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // 모든 알림 제거
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
  };
}

