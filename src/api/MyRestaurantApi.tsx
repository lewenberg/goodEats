import { Restaurant } from "@/types";
import { useAuth } from "@/auth/AuthContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "./apiClient";

// ── GET my restaurant ────────────────────────────────────────────────────────

export const useGetMyRestaurant = () => {
  const { getAccessToken } = useAuth();

  const getMyRestaurantRequest = async (): Promise<Restaurant> => {
    return apiFetch<Restaurant>("/api/my/restaurant", { token: getAccessToken() });
  };

  const { data: restaurant, isLoading } = useQuery(
    { queryKey: ["fetchMyRestaurant"], queryFn: getMyRestaurantRequest }
  );

  return { restaurant, isLoading };
};

// ── CREATE restaurant ─────────────────────────────────────────────────────────

export const useCreateMyRestaurant = () => {
  const { getAccessToken } = useAuth();

  const createMyRestaurantRequest = async (
    restaurantFormData: FormData
  ): Promise<Restaurant> => {
    return apiFetch<Restaurant>("/api/my/restaurant", {
      token: getAccessToken(),
      method: "POST",
      body: restaurantFormData,
    });
  };

  const {
    mutate: createRestaurant,
    isPending,
    isSuccess,
    error,
  } = useMutation({ mutationFn: createMyRestaurantRequest });

  if (isSuccess) {
    toast.success("Restaurant created!");
  }

  if (error) {
    toast.error("Unable to create restaurant");
  }

  return { createRestaurant, isLoading: isPending };
};

// ── UPDATE restaurant ─────────────────────────────────────────────────────────

export const useUpdateMyRestaurant = () => {
  const { getAccessToken } = useAuth();

  const updateRestaurantRequest = async (
    restaurantFormData: FormData
  ): Promise<Restaurant> => {
    return apiFetch<Restaurant>("/api/my/restaurant", {
      token: getAccessToken(),
      method: "PUT",
      body: restaurantFormData,
    });
  };

  const {
    mutate: updateRestaurant,
    isPending,
    error,
    isSuccess,
  } = useMutation({ mutationFn: updateRestaurantRequest });

  if (isSuccess) {
    toast.success("Restaurant Updated");
  }
  if (error) {
    toast.error("Unable to update restaurant");
  }

  return { updateRestaurant, isLoading: isPending };
};
