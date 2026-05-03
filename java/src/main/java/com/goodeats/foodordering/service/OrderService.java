package com.goodeats.foodordering.service;

import com.goodeats.foodordering.api.ApiException;
import com.goodeats.foodordering.api.dto.MenuItemDto;
import com.goodeats.foodordering.api.dto.OrderDto;
import com.goodeats.foodordering.api.dto.OrderItemDto;
import com.goodeats.foodordering.api.request.CreateOrderRequest;
import com.goodeats.foodordering.domain.AppUser;
import com.goodeats.foodordering.domain.FoodOrder;
import com.goodeats.foodordering.domain.Restaurant;
import com.goodeats.foodordering.domain.UserRole;
import com.goodeats.foodordering.repository.AppUserRepository;
import com.goodeats.foodordering.repository.FoodOrderRepository;
import com.goodeats.foodordering.security.CurrentUser;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final FoodOrderRepository orders;
    private final AppUserRepository users;
    private final RestaurantService restaurantService;
    private final JsonPayloads jsonPayloads;
    private final ApiMapper mapper;

    public OrderService(FoodOrderRepository orders, AppUserRepository users, RestaurantService restaurantService,
                        JsonPayloads jsonPayloads, ApiMapper mapper) {
        this.orders = orders;
        this.users = users;
        this.restaurantService = restaurantService;
        this.jsonPayloads = jsonPayloads;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<OrderDto> ordersFor(CurrentUser currentUser) {
        List<FoodOrder> rows;
        if (currentUser.role() == UserRole.ADMIN) {
            rows = orders.findAllByOrderByCreatedAtDesc();
        } else if (currentUser.role() == UserRole.OWNER) {
            rows = orders.findByRestaurant_OwnerIdOrderByCreatedAtDesc(currentUser.userId());
        } else {
            rows = orders.findByCustomerIdOrderByCreatedAtDesc(currentUser.userId());
        }
        return rows.stream().map(this::toDto).toList();
    }

    @Transactional
    public OrderDto create(CurrentUser currentUser, CreateOrderRequest request) {
        if (currentUser.role() != UserRole.CUSTOMER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission for this action");
        }

        Restaurant restaurant = restaurantService.findRestaurant(parseRestaurantId(request.restaurantId()));
        if (!restaurant.isActive()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Restaurant not available");
        }

        List<MenuItemDto> menu = jsonPayloads.menuItems(restaurant.getMenuItemsJson());
        List<OrderItemDto> orderItems = request.items() == null
                ? List.of()
                : request.items().stream()
                .map(item -> toOrderItem(menu, item))
                .filter(item -> item != null)
                .toList();

        if (orderItems.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cart is empty");
        }

        int subtotal = orderItems.stream().mapToInt(item -> item.price() * item.quantity()).sum();
        int total = subtotal + restaurant.getDeliveryPrice();
        FoodOrder order = new FoodOrder(
                "ord-" + Instant.now().toEpochMilli(),
                currentUser.userId(),
                restaurant,
                jsonPayloads.write(orderItems),
                subtotal,
                restaurant.getDeliveryPrice(),
                total,
                request.deliveryName(),
                request.deliveryAddress()
        );
        return toDto(orders.save(order));
    }

    @Transactional
    public void updateStatus(CurrentUser currentUser, Long orderId, String status) {
        if (currentUser.role() != UserRole.ADMIN && currentUser.role() != UserRole.OWNER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission for this action");
        }
        FoodOrder order = orders.findById(orderId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));
        if (currentUser.role() == UserRole.OWNER && !currentUser.userId().equals(order.getRestaurant().getOwnerId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only update your restaurant orders");
        }
        order.setStatus(status);
    }

    private OrderDto toDto(FoodOrder order) {
        String customerName = users.findByUserId(order.getCustomerId()).map(AppUser::getName).orElse("");
        return mapper.order(order, customerName);
    }

    private OrderItemDto toOrderItem(List<MenuItemDto> menu, CreateOrderRequest.CartItemRequest item) {
        return menu.stream()
                .filter(menuItem -> menuItem.id() != null && menuItem.id().equals(item.menuItemId()))
                .findFirst()
                .map(menuItem -> new OrderItemDto(menuItem.id(), menuItem.name(), menuItem.price(), Math.max(1, item.quantity())))
                .orElse(null);
    }

    private Long parseRestaurantId(String restaurantId) {
        try {
            return Long.parseLong(restaurantId);
        } catch (NumberFormatException exception) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Restaurant not available");
        }
    }
}
