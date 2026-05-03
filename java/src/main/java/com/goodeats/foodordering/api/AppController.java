package com.goodeats.foodordering.api;

import com.goodeats.foodordering.api.dto.OkResponse;
import com.goodeats.foodordering.api.dto.OrderDto;
import com.goodeats.foodordering.api.dto.RestaurantDto;
import com.goodeats.foodordering.api.dto.UserDto;
import com.goodeats.foodordering.api.request.CreateOrderRequest;
import com.goodeats.foodordering.api.request.RestaurantRequest;
import com.goodeats.foodordering.api.request.UpdateOrderStatusRequest;
import com.goodeats.foodordering.security.CurrentUser;
import com.goodeats.foodordering.service.OrderService;
import com.goodeats.foodordering.service.RestaurantService;
import com.goodeats.foodordering.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/app")
public class AppController {

    private final UserService userService;
    private final RestaurantService restaurantService;
    private final OrderService orderService;

    public AppController(UserService userService, RestaurantService restaurantService, OrderService orderService) {
        this.userService = userService;
        this.restaurantService = restaurantService;
        this.orderService = orderService;
    }

    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal CurrentUser currentUser) {
        return userService.currentUser(currentUser);
    }

    @GetMapping("/users")
    public List<UserDto> users(@AuthenticationPrincipal CurrentUser currentUser) {
        requireAdmin(currentUser);
        return userService.allUsers();
    }

    @GetMapping("/restaurants")
    public List<RestaurantDto> restaurants(@AuthenticationPrincipal CurrentUser currentUser) {
        return restaurantService.restaurantsFor(currentUser);
    }

    @PostMapping("/restaurants")
    @ResponseStatus(HttpStatus.CREATED)
    public RestaurantDto createRestaurant(@AuthenticationPrincipal CurrentUser currentUser, @Valid @RequestBody RestaurantRequest request) {
        return restaurantService.createAsAdmin(currentUser, request);
    }

    @PutMapping("/restaurants/{id}")
    public RestaurantDto updateRestaurant(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable Long id, @Valid @RequestBody RestaurantRequest request) {
        return restaurantService.updateAsAdminOrOwner(currentUser, id, request);
    }

    @DeleteMapping("/restaurants/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRestaurant(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable Long id) {
        restaurantService.deleteAsAdmin(currentUser, id);
    }

    @GetMapping("/orders")
    public List<OrderDto> orders(@AuthenticationPrincipal CurrentUser currentUser) {
        return orderService.ordersFor(currentUser);
    }

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderDto createOrder(@AuthenticationPrincipal CurrentUser currentUser, @Valid @RequestBody CreateOrderRequest request) {
        return orderService.create(currentUser, request);
    }

    @PatchMapping("/orders/{id}/status")
    public OkResponse updateOrderStatus(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable Long id, @RequestBody UpdateOrderStatusRequest request) {
        orderService.updateStatus(currentUser, id, request.status());
        return new OkResponse(true);
    }

    private static void requireAdmin(CurrentUser currentUser) {
        if (!"admin".equals(currentUser.role().apiValue())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission for this action");
        }
    }
}
