package com.goodeats.foodordering.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "restaurants")
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, length = 80)
    private String createdByUserId;

    @Column(name = "owner_id", length = 80)
    private String ownerId;

    @Column(name = "restaurant_name", nullable = false)
    private String restaurantName;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String country;

    @Column(name = "delivery_price", nullable = false)
    private int deliveryPrice;

    @Column(name = "estimated_delivery_time", nullable = false)
    private int estimatedDeliveryTime;

    @Lob
    @Column(nullable = false)
    private String cuisinesJson = "[]";

    @Lob
    @Column(name = "menu_items", nullable = false)
    private String menuItemsJson = "[]";

    @Column(name = "image_url", nullable = false)
    private String imageUrl = "";

    @Column(name = "last_updated", nullable = false)
    private Instant lastUpdated = Instant.now();

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    protected Restaurant() {
    }

    public Restaurant(String createdByUserId, String ownerId, String restaurantName, String city, String country,
                      int deliveryPrice, int estimatedDeliveryTime, String cuisinesJson, String menuItemsJson,
                      String imageUrl, boolean active) {
        this.createdByUserId = createdByUserId;
        this.ownerId = ownerId;
        this.restaurantName = restaurantName;
        this.city = city;
        this.country = country;
        this.deliveryPrice = deliveryPrice;
        this.estimatedDeliveryTime = estimatedDeliveryTime;
        this.cuisinesJson = cuisinesJson;
        this.menuItemsJson = menuItemsJson;
        this.imageUrl = imageUrl == null ? "" : imageUrl;
        this.active = active;
    }

    public Long getId() {
        return id;
    }

    public String getCreatedByUserId() {
        return createdByUserId;
    }

    public String getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(String ownerId) {
        this.ownerId = ownerId;
    }

    public String getRestaurantName() {
        return restaurantName;
    }

    public void setRestaurantName(String restaurantName) {
        this.restaurantName = restaurantName;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public int getDeliveryPrice() {
        return deliveryPrice;
    }

    public void setDeliveryPrice(int deliveryPrice) {
        this.deliveryPrice = deliveryPrice;
    }

    public int getEstimatedDeliveryTime() {
        return estimatedDeliveryTime;
    }

    public void setEstimatedDeliveryTime(int estimatedDeliveryTime) {
        this.estimatedDeliveryTime = estimatedDeliveryTime;
    }

    public String getCuisinesJson() {
        return cuisinesJson;
    }

    public void setCuisinesJson(String cuisinesJson) {
        this.cuisinesJson = cuisinesJson;
    }

    public String getMenuItemsJson() {
        return menuItemsJson;
    }

    public void setMenuItemsJson(String menuItemsJson) {
        this.menuItemsJson = menuItemsJson;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl == null ? "" : imageUrl;
    }

    public Instant getLastUpdated() {
        return lastUpdated;
    }

    public void touch() {
        this.lastUpdated = Instant.now();
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
