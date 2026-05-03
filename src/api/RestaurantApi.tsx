import { SearchState } from "@/pages/SearchPage";
import { RestaurantSearchResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./apiClient";

export const useSearchRestaurants = (
  searchState: SearchState,
  city?: string
) => {
  const createSearchRequest = async (): Promise<RestaurantSearchResponse> => {
    const params = new URLSearchParams();
    params.set("searchQuery", searchState.searchQuery);
    params.set("page", searchState.page.toString());
    params.set("selectedCuisines", searchState.selectedCuisines.join(","));
    params.set("sortOption", searchState.sortOption);

    return apiFetch<RestaurantSearchResponse>(`/api/restaurant/search/${city}?${params.toString()}`);
  };

  const { data: results, isLoading } = useQuery(
    { queryKey: ["searchRestaurants", searchState], queryFn: createSearchRequest, enabled: !!city }
  );

  return {
    results,
    isLoading,
  };
};
