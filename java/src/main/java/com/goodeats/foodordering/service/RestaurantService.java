package com.goodeats.foodordering.service;

import com.goodeats.foodordering.api.ApiException;
import com.goodeats.foodordering.api.dto.MenuItemDto;
import com.goodeats.foodordering.api.dto.PaginationDto;
import com.goodeats.foodordering.api.dto.RestaurantDto;
import com.goodeats.foodordering.api.dto.RestaurantSearchResponse;
import com.goodeats.foodordering.api.request.RestaurantRequest;
import com.goodeats.foodordering.domain.Restaurant;
import com.goodeats.foodordering.domain.UserRole;
import com.goodeats.foodordering.repository.RestaurantRepository;
import com.goodeats.foodordering.security.CurrentUser;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RestaurantService {

    private static final int PAGE_SIZE = 10;

    private final RestaurantRepository restaurants;
    private final JsonPayloads jsonPayloads;
    private final ApiMapper mapper;

    public RestaurantService(RestaurantRepository restaurants, JsonPayloads jsonPayloads, ApiMapper mapper) {
        this.restaurants = restaurants;
        this.jsonPayloads = jsonPayloads;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public RestaurantDto myRestaurant(CurrentUser currentUser) {
        return mapper.restaurant(restaurants.findByCreatedByUserId(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Restaurant not found")));
    }

    @Transactional
    public RestaurantDto createMyRestaurant(CurrentUser currentUser, RestaurantRequest request) {
        if (restaurants.existsByCreatedByUserId(currentUser.userId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Restaurant already exists. Use PUT to update.");
        }
        Restaurant restaurant = createRestaurant(currentUser.userId(), currentUser.role() == UserRole.OWNER ? currentUser.userId() : request.ownerId(), request);
        return mapper.restaurant(restaurants.save(restaurant));
    }

    @Transactional
    public RestaurantDto updateMyRestaurant(CurrentUser currentUser, RestaurantRequest request) {
        Restaurant restaurant = restaurants.findByCreatedByUserId(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Restaurant not found. Create one first."));
        applyRestaurantFields(restaurant, request, true, false);
        return mapper.restaurant(restaurant);
    }

    @Transactional(readOnly = true)
    public List<RestaurantDto> restaurantsFor(CurrentUser currentUser) {
        List<Restaurant> rows = currentUser.role() == UserRole.OWNER
                ? restaurants.findByOwnerIdOrderByRestaurantNameAsc(currentUser.userId())
                : restaurants.findAllByOrderByRestaurantNameAsc();
        return rows.stream().map(mapper::restaurant).toList();
    }

    @Transactional
    public RestaurantDto createAsAdmin(CurrentUser currentUser, RestaurantRequest request) {
        requireAdmin(currentUser);
        if (blank(request.restaurantName()) || blank(request.city()) || blank(request.country())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Restaurant name, city, and country are required");
        }
        Restaurant restaurant = createRestaurant(currentUser.userId(), request.ownerId(), request);
        return mapper.restaurant(restaurants.save(restaurant));
    }

    @Transactional
    public RestaurantDto updateAsAdminOrOwner(CurrentUser currentUser, Long id, RestaurantRequest request) {
        Restaurant restaurant = findRestaurant(id);
        assertCanManageRestaurant(currentUser, restaurant);
        boolean admin = currentUser.role() == UserRole.ADMIN;
        applyRestaurantFields(restaurant, request, admin, admin);
        return mapper.restaurant(restaurant);
    }

    @Transactional
    public void deleteAsAdmin(CurrentUser currentUser, Long id) {
        requireAdmin(currentUser);
        restaurants.deleteById(id);
    }

    @Transactional(readOnly = true)
    public RestaurantSearchResponse search(String city, String searchQuery, int page, String selectedCuisines, String sortOption) {
        List<Restaurant> rows = new ArrayList<>(restaurants.findByCityIgnoreCaseOrderByIdAsc(city));
        if (!blank(searchQuery)) {
            String q = searchQuery.toLowerCase(Locale.ROOT);
            rows = rows.stream()
                    .filter(restaurant -> restaurant.getRestaurantName().toLowerCase(Locale.ROOT).contains(q)
                            || restaurant.getCuisinesJson().toLowerCase(Locale.ROOT).contains(q))
                    .toList();
        }

        List<String> cuisineList = selectedCuisines == null || selectedCuisines.isBlank()
                ? List.of()
                : List.of(selectedCuisines.split(","));
        if (!cuisineList.isEmpty()) {
            rows = rows.stream()
                    .filter(restaurant -> {
                        List<String> restaurantCuisines = jsonPayloads.cuisines(restaurant.getCuisinesJson()).stream()
                                .map(cuisine -> cuisine.toLowerCase(Locale.ROOT))
                                .toList();
                        return cuisineList.stream()
                                .filter(cuisine -> !cuisine.isBlank())
                                .anyMatch(cuisine -> restaurantCuisines.contains(cuisine.toLowerCase(Locale.ROOT)));
                    })
                    .toList();
        }

        if ("deliveryPrice".equals(sortOption)) {
            rows = rows.stream().sorted(Comparator.comparingInt(Restaurant::getDeliveryPrice)).toList();
        } else if ("estimatedDeliveryTime".equals(sortOption)) {
            rows = rows.stream().sorted(Comparator.comparingInt(Restaurant::getEstimatedDeliveryTime)).toList();
        }

        int pageNumber = Math.max(1, page);
        int total = rows.size();
        int pages = Math.max(1, (int) Math.ceil(total / (double) PAGE_SIZE));
        int start = Math.min((pageNumber - 1) * PAGE_SIZE, total);
        int end = Math.min(start + PAGE_SIZE, total);
        return new RestaurantSearchResponse(
                rows.subList(start, end).stream().map(mapper::restaurant).toList(),
                new PaginationDto(total, pageNumber, pages)
        );
    }

    @Transactional(readOnly = true)
    public Restaurant findRestaurant(Long id) {
        return restaurants.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Restaurant not found"));
    }

    private Restaurant createRestaurant(String createdBy, String ownerId, RestaurantRequest request) {
        return new Restaurant(
                createdBy,
                normalizeOwner(ownerId),
                requireText(request.restaurantName(), "Restaurant name, city, and country are required"),
                requireText(request.city(), "Restaurant name, city, and country are required"),
                requireText(request.country(), "Restaurant name, city, and country are required"),
                numberOrDefault(request.deliveryPrice(), 0),
                numberOrDefault(request.estimatedDeliveryTime(), 30),
                jsonPayloads.write(request.cuisines() == null ? List.of() : request.cuisines()),
                jsonPayloads.write(normalizeMenuItems(request.menuItems())),
                request.imageUrl(),
                request.isActive() == null || request.isActive()
        );
    }

    private void applyRestaurantFields(Restaurant restaurant, RestaurantRequest request, boolean canChangeName, boolean canChangeOwnerAndActive) {
        if (canChangeOwnerAndActive) {
            restaurant.setOwnerId(normalizeOwner(request.ownerId()));
            restaurant.setActive(Boolean.TRUE.equals(request.isActive()));
        }
        if (canChangeName && !blank(request.restaurantName())) {
            restaurant.setRestaurantName(request.restaurantName());
        }
        restaurant.setCity(blank(request.city()) ? restaurant.getCity() : request.city());
        restaurant.setCountry(blank(request.country()) ? restaurant.getCountry() : request.country());
        restaurant.setDeliveryPrice(request.deliveryPrice() == null ? restaurant.getDeliveryPrice() : request.deliveryPrice());
        restaurant.setEstimatedDeliveryTime(request.estimatedDeliveryTime() == null ? restaurant.getEstimatedDeliveryTime() : request.estimatedDeliveryTime());
        restaurant.setCuisinesJson(jsonPayloads.write(request.cuisines() == null ? jsonPayloads.cuisines(restaurant.getCuisinesJson()) : request.cuisines()));
        restaurant.setMenuItemsJson(jsonPayloads.write(request.menuItems() == null ? jsonPayloads.menuItems(restaurant.getMenuItemsJson()) : normalizeMenuItems(request.menuItems())));
        restaurant.setImageUrl(request.imageUrl() == null ? restaurant.getImageUrl() : request.imageUrl());
        restaurant.touch();
    }

    private List<MenuItemDto> normalizeMenuItems(List<MenuItemDto> menuItems) {
        if (menuItems == null) {
            return List.of();
        }
        return menuItems.stream()
                .filter(item -> item != null && !blank(item.name()))
                .map(item -> new MenuItemDto(
                        blank(item.id()) ? "menu-" + UUID.randomUUID() : item.id(),
                        item.name(),
                        item.price(),
                        item.description()
                ))
                .toList();
    }

    private void assertCanManageRestaurant(CurrentUser currentUser, Restaurant restaurant) {
        if (currentUser.role() == UserRole.ADMIN) {
            return;
        }
        if (currentUser.role() == UserRole.OWNER && currentUser.userId().equals(restaurant.getOwnerId())) {
            return;
        }
        throw new ApiException(HttpStatus.FORBIDDEN, "You can only manage your assigned restaurant");
    }

    private void requireAdmin(CurrentUser currentUser) {
        if (currentUser.role() != UserRole.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission for this action");
        }
    }

    private static String requireText(String value, String message) {
        if (blank(value)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, message);
        }
        return value;
    }

    private static int numberOrDefault(Integer value, int fallback) {
        return value == null ? fallback : value;
    }

    private static String normalizeOwner(String ownerId) {
        return blank(ownerId) ? null : ownerId;
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
