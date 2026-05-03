package com.goodeats.foodordering.api;

import com.goodeats.foodordering.api.dto.RestaurantDto;
import com.goodeats.foodordering.api.request.RestaurantRequest;
import com.goodeats.foodordering.security.CurrentUser;
import com.goodeats.foodordering.service.RestaurantFormParser;
import com.goodeats.foodordering.service.RestaurantService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/my/restaurant")
public class MyRestaurantController {

    private final RestaurantService restaurantService;
    private final RestaurantFormParser formParser;

    public MyRestaurantController(RestaurantService restaurantService, RestaurantFormParser formParser) {
        this.restaurantService = restaurantService;
        this.formParser = formParser;
    }

    @GetMapping
    public RestaurantDto get(@AuthenticationPrincipal CurrentUser currentUser) {
        return restaurantService.myRestaurant(currentUser);
    }

    @PostMapping(consumes = "application/json")
    @ResponseStatus(HttpStatus.CREATED)
    public RestaurantDto createJson(@AuthenticationPrincipal CurrentUser currentUser, @Valid @RequestBody RestaurantRequest request) {
        return restaurantService.createMyRestaurant(currentUser, request);
    }

    @PostMapping(consumes = {"multipart/form-data", "application/x-www-form-urlencoded"})
    @ResponseStatus(HttpStatus.CREATED)
    public RestaurantDto createForm(@AuthenticationPrincipal CurrentUser currentUser, @RequestParam MultiValueMap<String, String> form) {
        return restaurantService.createMyRestaurant(currentUser, formParser.parse(form));
    }

    @PutMapping(consumes = "application/json")
    public RestaurantDto updateJson(@AuthenticationPrincipal CurrentUser currentUser, @Valid @RequestBody RestaurantRequest request) {
        return restaurantService.updateMyRestaurant(currentUser, request);
    }

    @PutMapping(consumes = {"multipart/form-data", "application/x-www-form-urlencoded"})
    public RestaurantDto updateForm(@AuthenticationPrincipal CurrentUser currentUser, @RequestParam MultiValueMap<String, String> form) {
        return restaurantService.updateMyRestaurant(currentUser, formParser.parse(form));
    }
}
