import { User } from "@/types";
import { useAuth } from "@/auth/AuthContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "./apiClient";

// ── GET current user ─────────────────────────────────────────────────────────

export const useGetMyUser = () => {
  const { getAccessToken } = useAuth();

  const getMyUserRequest = async (): Promise<User> => {
    return apiFetch<User>("/api/my/user", { token: getAccessToken() });
  };

  const {
    data: currentUser,
    isLoading,
    error,
  } = useQuery({ queryKey: ["fetchCurrentUser"], queryFn: getMyUserRequest });

  if (error) {
    toast.error((error as Error).toString());
  }

  return { currentUser, isLoading };
};

// ── CREATE user (called on first login – no-op now that we seed the DB) ──────

type CreateUserRequest = {
  userId: string;
  email: string;
};

export const useCreateMyUser = () => {
  const { getAccessToken } = useAuth();

  const createMyUserRequest = async (user: CreateUserRequest) => {
    return apiFetch<void>("/api/my/user", { token: getAccessToken(), method: "POST", body: user });
  };

  const {
    mutateAsync: createUser,
    isPending,
    isError,
    isSuccess,
  } = useMutation({ mutationFn: createMyUserRequest });

  return { createUser, isLoading: isPending, isError, isSuccess };
};

// ── UPDATE user profile ───────────────────────────────────────────────────────

type UpdateMyUserRequest = {
  name: string;
  addressLine1: string;
  city: string;
  country: string;
};

export const useUpdateMyUser = () => {
  const { getAccessToken } = useAuth();

  const updateMyUserRequest = async (formData: UpdateMyUserRequest) => {
    return apiFetch<User>("/api/my/user", { token: getAccessToken(), method: "PUT", body: formData });
  };

  const {
    mutateAsync: updateUser,
    isPending,
    isSuccess,
    isError,
    reset,
  } = useMutation({ mutationFn: updateMyUserRequest });

  if (isSuccess) {
    toast.success("User profile updated!");
  }
  if (isError) {
    toast.error("Failed to update user");
    reset();
  }

  return { updateUser, isLoading: isPending };
};
