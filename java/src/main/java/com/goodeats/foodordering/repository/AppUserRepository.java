package com.goodeats.foodordering.repository;

import com.goodeats.foodordering.domain.AppUser;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByUserId(String userId);

    boolean existsByUserId(String userId);

    List<AppUser> findAllByOrderByRoleAscNameAsc();
}
