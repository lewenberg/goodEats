package com.goodeats.foodordering.api.dto;

import java.util.List;

public record RestaurantSearchResponse(List<RestaurantDto> data, PaginationDto pagination) {
}
