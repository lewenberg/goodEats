package com.goodeats.foodordering.service;

import com.goodeats.foodordering.api.ApiException;
import com.goodeats.foodordering.api.dto.UserDto;
import com.goodeats.foodordering.api.request.CreateUserRequest;
import com.goodeats.foodordering.api.request.UpdateUserRequest;
import com.goodeats.foodordering.domain.AppUser;
import com.goodeats.foodordering.domain.UserRole;
import com.goodeats.foodordering.repository.AppUserRepository;
import com.goodeats.foodordering.security.CurrentUser;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final AppUserRepository users;
    private final ApiMapper mapper;

    public UserService(AppUserRepository users, ApiMapper mapper) {
        this.users = users;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public UserDto currentUser(CurrentUser currentUser) {
        return mapper.user(findByUserId(currentUser.userId()));
    }

    @Transactional
    public UserDto createOrGet(CurrentUser currentUser, CreateUserRequest request) {
        if (!currentUser.userId().equals(request.userId()) && currentUser.role() != UserRole.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission for this action");
        }
        return users.findByUserId(request.userId())
                .map(mapper::user)
                .orElseGet(() -> mapper.user(users.save(new AppUser(request.userId(), request.email(), "", "", "", "", UserRole.CUSTOMER))));
    }

    @Transactional
    public UserDto update(CurrentUser currentUser, UpdateUserRequest request) {
        AppUser user = findByUserId(currentUser.userId());
        user.setName(request.name());
        user.setAddressLine1(request.addressLine1());
        user.setCity(request.city());
        user.setCountry(request.country());
        return mapper.user(user);
    }

    @Transactional(readOnly = true)
    public List<UserDto> allUsers() {
        return users.findAllByOrderByRoleAscNameAsc().stream().map(mapper::user).toList();
    }

    @Transactional(readOnly = true)
    public boolean exists(String userId) {
        return users.existsByUserId(userId);
    }

    @Transactional(readOnly = true)
    public AppUser findByUserId(String userId) {
        return users.findByUserId(userId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
