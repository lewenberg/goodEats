package com.goodeats.foodordering.api;

import com.goodeats.foodordering.api.dto.UserDto;
import com.goodeats.foodordering.api.request.CreateUserRequest;
import com.goodeats.foodordering.api.request.UpdateUserRequest;
import com.goodeats.foodordering.security.CurrentUser;
import com.goodeats.foodordering.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/my/user")
public class MyUserController {

    private final UserService userService;

    public MyUserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public UserDto get(@AuthenticationPrincipal CurrentUser currentUser) {
        return userService.currentUser(currentUser);
    }

    @PostMapping
    public ResponseEntity<UserDto> create(@AuthenticationPrincipal CurrentUser currentUser, @Valid @RequestBody CreateUserRequest request) {
        boolean exists = userService.exists(request.userId());
        UserDto user = userService.createOrGet(currentUser, request);
        return ResponseEntity.status(exists ? HttpStatus.OK : HttpStatus.CREATED).body(user);
    }

    @PutMapping
    public UserDto update(@AuthenticationPrincipal CurrentUser currentUser, @RequestBody UpdateUserRequest request) {
        return userService.update(currentUser, request);
    }
}
