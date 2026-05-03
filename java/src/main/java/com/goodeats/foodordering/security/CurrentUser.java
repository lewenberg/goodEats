package com.goodeats.foodordering.security;

import com.goodeats.foodordering.domain.UserRole;

public record CurrentUser(String userId, String email, UserRole role) {

    public String authority() {
        return "ROLE_" + role.name();
    }
}
