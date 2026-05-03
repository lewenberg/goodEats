package com.goodeats.foodordering.repository;

import com.goodeats.foodordering.domain.FoodOrder;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FoodOrderRepository extends JpaRepository<FoodOrder, Long> {

    @EntityGraph(attributePaths = "restaurant")
    List<FoodOrder> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "restaurant")
    List<FoodOrder> findByCustomerIdOrderByCreatedAtDesc(String customerId);

    @EntityGraph(attributePaths = "restaurant")
    List<FoodOrder> findByRestaurant_OwnerIdOrderByCreatedAtDesc(String ownerId);
}
