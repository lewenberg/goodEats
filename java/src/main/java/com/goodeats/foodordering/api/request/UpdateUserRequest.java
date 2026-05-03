package com.goodeats.foodordering.api.request;

public record UpdateUserRequest(String name, String addressLine1, String city, String country) {
}
