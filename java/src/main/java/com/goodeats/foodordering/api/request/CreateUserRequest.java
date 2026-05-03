package com.goodeats.foodordering.api.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateUserRequest(@NotBlank String userId, @Email @NotBlank String email) {
}
