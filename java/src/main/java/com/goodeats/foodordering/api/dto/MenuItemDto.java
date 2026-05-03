package com.goodeats.foodordering.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record MenuItemDto(
        @JsonProperty("_id") String id,
        @NotBlank String name,
        @Min(0) int price,
        String description
) {
}
