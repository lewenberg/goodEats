package com.goodeats.foodordering.api;

import com.goodeats.foodordering.api.dto.RestaurantSearchResponse;
import com.goodeats.foodordering.service.RestaurantService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/restaurant/search")
public class SearchController {

    private final RestaurantService restaurantService;

    public SearchController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @GetMapping("/{city}")
    public RestaurantSearchResponse search(
            @PathVariable String city,
            @RequestParam(defaultValue = "") String searchQuery,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "") String selectedCuisines,
            @RequestParam(defaultValue = "bestMatch") String sortOption) {
        return restaurantService.search(city, searchQuery, page, selectedCuisines, sortOption);
    }
}
