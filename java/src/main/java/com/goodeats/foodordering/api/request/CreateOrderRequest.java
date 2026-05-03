package com.goodeats.foodordering.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record CreateOrderRequest(
        @NotBlank String restaurantId,
        @Valid List<CartItemRequest> items,
        String deliveryName,
        String deliveryAddress
) {

    public record CartItemRequest(@NotBlank String menuItemId, int quantity) {
    }
}
