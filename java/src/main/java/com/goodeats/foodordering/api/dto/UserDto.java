package com.goodeats.foodordering.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record UserDto(
        @JsonProperty("_id") String id,
        String userId,
        String email,
        String name,
        String addressLine1,
        String city,
        String country,
        String role
) {
}
