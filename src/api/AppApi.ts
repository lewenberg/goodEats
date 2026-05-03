import { Order, Restaurant, User } from "@/types";
import { apiFetch } from "./apiClient";

type ApiOptions = {
  token: string;
  method?: string;
  body?: unknown;
};

const appRequest = async <T,>(path: string, { token, method = "GET", body }: ApiOptions): Promise<T> =>
  apiFetch<T>(`/api/app${path}`, { token, method, body });

export type RestaurantPayload = Omit<Restaurant, "_id" | "user" | "lastUpdated">;

export const appApi = {
  getMe: (token: string) => appRequest<User>("/me", { token }),
  getUsers: (token: string) => appRequest<User[]>("/users", { token }),
  getRestaurants: (token: string) => appRequest<Restaurant[]>("/restaurants", { token }),
  createRestaurant: (token: string, payload: Partial<RestaurantPayload>) =>
    appRequest<Restaurant>("/restaurants", { token, method: "POST", body: payload }),
  updateRestaurant: (token: string, id: string, payload: Partial<RestaurantPayload>) =>
    appRequest<Restaurant>(`/restaurants/${id}`, { token, method: "PUT", body: payload }),
  deleteRestaurant: (token: string, id: string) =>
    appRequest<void>(`/restaurants/${id}`, { token, method: "DELETE" }),
  getOrders: (token: string) => appRequest<Order[]>("/orders", { token }),
  createOrder: (
    token: string,
    payload: {
      restaurantId: string;
      items: { menuItemId: string; quantity: number }[];
      deliveryName: string;
      deliveryAddress: string;
    }
  ) => appRequest<Order>("/orders", { token, method: "POST", body: payload }),
  updateOrderStatus: (token: string, id: string, status: string) =>
    appRequest<{ ok: boolean }>(`/orders/${id}/status`, { token, method: "PATCH", body: { status } }),
};
