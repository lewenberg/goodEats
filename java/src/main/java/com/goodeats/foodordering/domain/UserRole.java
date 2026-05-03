package com.goodeats.foodordering.domain;

public enum UserRole {
    ADMIN("admin"),
    OWNER("owner"),
    CUSTOMER("customer");

    private final String apiValue;

    UserRole(String apiValue) {
        this.apiValue = apiValue;
    }

    public String apiValue() {
        return apiValue;
    }

    public static UserRole fromApiValue(String value) {
        for (UserRole role : values()) {
            if (role.apiValue.equalsIgnoreCase(value)) {
                return role;
            }
        }
        throw new IllegalArgumentException("Unsupported role: " + value);
    }
}
