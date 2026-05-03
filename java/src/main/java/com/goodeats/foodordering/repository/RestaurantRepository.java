package com.goodeats.foodordering.repository;

import com.goodeats.foodordering.domain.Restaurant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    Optional<Restaurant> findByCreatedByUserId(String userId);

    boolean existsByCreatedByUserId(String userId);

    Optional<Restaurant> findByRestaurantName(String restaurantName);

    List<Restaurant> findByCityIgnoreCaseOrderByIdAsc(String city);

    List<Restaurant> findByOwnerIdOrderByRestaurantNameAsc(String ownerId);

    List<Restaurant> findAllByOrderByRestaurantNameAsc();
}
