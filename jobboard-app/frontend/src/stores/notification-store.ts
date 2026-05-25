import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Notification {
  id:        string;
  type:      string;
  message:   string;
  data?:     Record<string, unknown>;
  read:      boolean;
  createdAt: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount:   number;
  addNotification:   (msg: Omit<Notification, "id" | "read" | "createdAt">) => void;
  markAllRead:       () => void;
  markRead:          (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist((set, _get) => ({
      notifications: [],
      unreadCount:   0,

      addNotification: (msg) => {
        const notification: Notification = {
          ...msg,
          id:        crypto.randomUUID(),
          read:      false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 50), // keep last 50
          unreadCount:   state.unreadCount + 1,
        }));
      },

      markRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      markAllRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount:   0,
        }));
      },

      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },
    }),
    {
      name:    "jobboard-notifications",
      storage: createJSONStorage(() => localStorage),
    }
  )
);