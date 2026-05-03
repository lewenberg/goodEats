package com.goodeats.foodordering.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record OrderItemDto(
        @NotBlank String menuItemId,
        String name,
        int price,
        @Min(1) int quantity
) {
}
