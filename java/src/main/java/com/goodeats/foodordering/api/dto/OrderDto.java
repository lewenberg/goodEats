package com.goodeats.foodordering.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record OrderDto(
        @JsonProperty("_id") String id,
        String orderId,
        String customerId,
        String restaurantId,
        List<OrderItemDto> items,
        int subtotal,
        int deliveryPrice,
        int total,
        String status,
        String deliveryName,
        String deliveryAddress,
        String createdAt,
        String restaurantName,
        String customerName
) {
}
