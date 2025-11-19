import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  // -----------------------------
  // Fetch Users for Sidebar
  // -----------------------------
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data.users });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // -----------------------------
  // Fetch Messages
  // -----------------------------
  getMessages: async (userId) => {
    if (!userId) return;

    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // -----------------------------
  // Send Message
  // -----------------------------
  sendMessage: async (messageData) => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      // Append new message safely
      set((state) => ({
        messages: [...state.messages, res.data],
      }));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send message");
    }
  },
  

  // -----------------------------
  // Subscribe to Real-Time Messages
  // -----------------------------
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) {
      console.warn("Socket not initialized yet.");
      return;
    }

    // Avoid multiple duplicate listeners
    socket.off("newMessage");

    socket.on("newMessage", (newMessage) => {
      const isFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isFromSelectedUser) return;

      set((state) => ({
        messages: [...state.messages, newMessage],
      }));
    });
  },

  // -----------------------------
  // Unsubscribe from messages
  // -----------------------------
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");
  },

  // -----------------------------
  // Set Active Chat User
  // -----------------------------
  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
