package com.goodeats.foodordering.api.request;

import com.goodeats.foodordering.api.dto.MenuItemDto;
import jakarta.validation.Valid;
import java.util.List;

public record RestaurantRequest(
        String restaurantName,
        String city,
        String country,
        Integer deliveryPrice,
        Integer estimatedDeliveryTime,
        List<String> cuisines,
        @Valid List<MenuItemDto> menuItems,
        String imageUrl,
        String ownerId,
        Boolean isActive
) {
}
