package com.goodeats.foodordering.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record RestaurantDto(
        @JsonProperty("_id") String id,
        String user,
        String ownerId,
        String restaurantName,
        String city,
        String country,
        int deliveryPrice,
        int estimatedDeliveryTime,
        List<String> cuisines,
        List<MenuItemDto> menuItems,
        String imageUrl,
        String lastUpdated,
        boolean isActive
) {
}
