package com.goodeats.foodordering.service;

import com.goodeats.foodordering.api.dto.OrderDto;
import com.goodeats.foodordering.api.dto.RestaurantDto;
import com.goodeats.foodordering.api.dto.UserDto;
import com.goodeats.foodordering.domain.AppUser;
import com.goodeats.foodordering.domain.FoodOrder;
import com.goodeats.foodordering.domain.Restaurant;
import java.time.format.DateTimeFormatter;
import org.springframework.stereotype.Component;

@Component
public class ApiMapper {

    private final JsonPayloads jsonPayloads;

    public ApiMapper(JsonPayloads jsonPayloads) {
        this.jsonPayloads = jsonPayloads;
    }

    public UserDto user(AppUser user) {
        return new UserDto(
                String.valueOf(user.getId()),
                user.getUserId(),
                user.getEmail(),
                user.getName(),
                user.getAddressLine1(),
                user.getCity(),
                user.getCountry(),
                user.getRole().apiValue()
        );
    }

    public RestaurantDto restaurant(Restaurant restaurant) {
        return new RestaurantDto(
                String.valueOf(restaurant.getId()),
                restaurant.getCreatedByUserId(),
                restaurant.getOwnerId(),
                restaurant.getRestaurantName(),
                restaurant.getCity(),
                restaurant.getCountry(),
                restaurant.getDeliveryPrice(),
                restaurant.getEstimatedDeliveryTime(),
                jsonPayloads.cuisines(restaurant.getCuisinesJson()),
                jsonPayloads.menuItems(restaurant.getMenuItemsJson()),
                restaurant.getImageUrl(),
                DateTimeFormatter.ISO_INSTANT.format(restaurant.getLastUpdated()),
                restaurant.isActive()
        );
    }

    public OrderDto order(FoodOrder order, String customerName) {
        return new OrderDto(
                String.valueOf(order.getId()),
                order.getOrderId(),
                order.getCustomerId(),
                String.valueOf(order.getRestaurant().getId()),
                jsonPayloads.orderItems(order.getItemsJson()),
                order.getSubtotal(),
                order.getDeliveryPrice(),
                order.getTotal(),
                order.getStatus(),
                order.getDeliveryName(),
                order.getDeliveryAddress(),
                DateTimeFormatter.ISO_INSTANT.format(order.getCreatedAt()),
                order.getRestaurant().getRestaurantName(),
                customerName
        );
    }
}
