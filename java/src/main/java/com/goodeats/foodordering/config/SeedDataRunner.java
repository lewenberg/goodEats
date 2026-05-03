package com.goodeats.foodordering.config;

import com.goodeats.foodordering.api.dto.MenuItemDto;
import com.goodeats.foodordering.domain.AppUser;
import com.goodeats.foodordering.domain.Restaurant;
import com.goodeats.foodordering.domain.UserRole;
import com.goodeats.foodordering.repository.AppUserRepository;
import com.goodeats.foodordering.repository.FoodOrderRepository;
import com.goodeats.foodordering.repository.RestaurantRepository;
import com.goodeats.foodordering.service.JsonPayloads;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class SeedDataRunner implements CommandLineRunner {

    private final AppUserRepository users;
    private final RestaurantRepository restaurants;
    private final FoodOrderRepository orders;
    private final JsonPayloads jsonPayloads;

    public SeedDataRunner(AppUserRepository users, RestaurantRepository restaurants, FoodOrderRepository orders, JsonPayloads jsonPayloads) {
        this.users = users;
        this.restaurants = restaurants;
        this.orders = orders;
        this.jsonPayloads = jsonPayloads;
    }

    @Override
    @Transactional
    public void run(String... args) {
        upsertUser("admin-001", "admin@goodeats.test", "Avery Admin", "1 Platform Plaza", "New York", "USA", UserRole.ADMIN);
        upsertUser("owner-001", "maria@copperkettle.test", "Maria Santos", "88 Orchard Street", "New York", "USA", UserRole.OWNER);
        upsertUser("owner-002", "kenji@noodleworks.test", "Kenji Tanaka", "400 Sunset Blvd", "Los Angeles", "USA", UserRole.OWNER);
        upsertUser("customer-001", "jordan@example.test", "Jordan Lee", "42 Grove Street", "New York", "USA", UserRole.CUSTOMER);
        upsertUser("customer-002", "priya@example.test", "Priya Shah", "77 Bay Road", "New York", "USA", UserRole.CUSTOMER);
        upsertUser("customer-003", "sam@example.test", "Sam Rivera", "210 Hillcrest Ave", "Los Angeles", "USA", UserRole.CUSTOMER);

        if (restaurants.findByRestaurantName("Copper Kettle Kitchen").isPresent()) {
            return;
        }

        orders.deleteAll();
        restaurants.deleteAll();

        restaurants.save(new Restaurant(
                "admin-001",
                "owner-001",
                "Copper Kettle Kitchen",
                "New York",
                "USA",
                399,
                28,
                jsonPayloads.write(List.of("Comfort", "American", "Brunch")),
                jsonPayloads.write(List.of(
                        new MenuItemDto("ck-1", "Short Rib Mac", 1699, "Braised short rib, cheddar cream, toasted crumbs"),
                        new MenuItemDto("ck-2", "Hot Honey Chicken", 1499, "Crispy chicken, pepper honey, herb slaw"),
                        new MenuItemDto("ck-3", "Market Greens", 1199, "Greens, apple, goat cheese, cider vinaigrette"),
                        new MenuItemDto("ck-4", "Skillet Cookie", 799, "Brown butter cookie with vanilla cream")
                )),
                "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&auto=format&fit=crop",
                true
        ));

        restaurants.save(new Restaurant(
                "admin-001",
                "owner-002",
                "Noodleworks Social",
                "Los Angeles",
                "USA",
                299,
                24,
                jsonPayloads.write(List.of("Japanese", "Noodles", "Street Food")),
                jsonPayloads.write(List.of(
                        new MenuItemDto("nw-1", "Shoyu Ramen", 1599, "Chicken broth, soy tare, egg, scallion"),
                        new MenuItemDto("nw-2", "Spicy Miso Ramen", 1699, "Miso broth, chili crisp, pork, corn"),
                        new MenuItemDto("nw-3", "Crispy Gyoza", 899, "Pan-seared dumplings with ponzu"),
                        new MenuItemDto("nw-4", "Yuzu Lemonade", 499, "Bright citrus soda over ice")
                )),
                "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200&auto=format&fit=crop",
                true
        ));

        restaurants.save(new Restaurant(
                "admin-001",
                null,
                "Taco Atlas",
                "New York",
                "USA",
                199,
                18,
                jsonPayloads.write(List.of("Mexican", "Tacos", "Vegan")),
                jsonPayloads.write(List.of(
                        new MenuItemDto("ta-1", "Carne Asada Trio", 1399, "Three tacos, salsa roja, onion, cilantro"),
                        new MenuItemDto("ta-2", "Mushroom Al Pastor", 1299, "Pineapple, achiote, roasted mushrooms"),
                        new MenuItemDto("ta-3", "Chips and Guac", 799, "Avocado, lime, pepitas, warm chips"),
                        new MenuItemDto("ta-4", "Hibiscus Agua Fresca", 399, "Tart hibiscus tea, citrus, mint")
                )),
                "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&auto=format&fit=crop",
                true
        ));
    }

    private void upsertUser(String userId, String email, String name, String address, String city, String country, UserRole role) {
        AppUser user = users.findByUserId(userId)
                .orElseGet(() -> new AppUser(userId, email, name, address, city, country, role));
        user.setEmail(email);
        user.setName(name);
        user.setAddressLine1(address);
        user.setCity(city);
        user.setCountry(country);
        user.setRole(role);
        users.save(user);
    }
}
