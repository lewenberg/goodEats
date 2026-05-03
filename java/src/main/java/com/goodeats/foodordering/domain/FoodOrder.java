package com.goodeats.foodordering.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "orders")
public class FoodOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, unique = true, length = 80)
    private String orderId;

    @Column(name = "customer_id", nullable = false, length = 80)
    private String customerId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Lob
    @Column(nullable = false)
    private String itemsJson = "[]";

    @Column(nullable = false)
    private int subtotal;

    @Column(name = "delivery_price", nullable = false)
    private int deliveryPrice;

    @Column(nullable = false)
    private int total;

    @Column(nullable = false, length = 40)
    private String status = "Placed";

    @Column(name = "delivery_name", nullable = false)
    private String deliveryName = "";

    @Column(name = "delivery_address", nullable = false)
    private String deliveryAddress = "";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected FoodOrder() {
    }

    public FoodOrder(String orderId, String customerId, Restaurant restaurant, String itemsJson, int subtotal,
                     int deliveryPrice, int total, String deliveryName, String deliveryAddress) {
        this.orderId = orderId;
        this.customerId = customerId;
        this.restaurant = restaurant;
        this.itemsJson = itemsJson;
        this.subtotal = subtotal;
        this.deliveryPrice = deliveryPrice;
        this.total = total;
        this.deliveryName = deliveryName == null ? "" : deliveryName;
        this.deliveryAddress = deliveryAddress == null ? "" : deliveryAddress;
    }

    public Long getId() {
        return id;
    }

    public String getOrderId() {
        return orderId;
    }

    public String getCustomerId() {
        return customerId;
    }

    public Restaurant getRestaurant() {
        return restaurant;
    }

    public String getItemsJson() {
        return itemsJson;
    }

    public int getSubtotal() {
        return subtotal;
    }

    public int getDeliveryPrice() {
        return deliveryPrice;
    }

    public int getTotal() {
        return total;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status == null || status.isBlank() ? "Preparing" : status;
    }

    public String getDeliveryName() {
        return deliveryName;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
