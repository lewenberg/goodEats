package com.goodeats.foodordering.service;

import com.goodeats.foodordering.api.dto.MenuItemDto;
import com.goodeats.foodordering.api.request.RestaurantRequest;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;

@Component
public class RestaurantFormParser {

    public RestaurantRequest parse(MultiValueMap<String, String> form) {
        List<String> cuisines = new ArrayList<>();
        Map<Integer, MenuDraft> menuDrafts = new HashMap<>();

        form.forEach((key, values) -> {
            String value = values == null || values.isEmpty() ? null : values.get(0);
            Integer cuisineIndex = bracketIndex(key, "cuisines");
            if (cuisineIndex != null && value != null) {
                cuisines.add(value);
            }

            Integer menuIndex = bracketIndex(key, "menuItems");
            if (menuIndex != null) {
                MenuDraft draft = menuDrafts.computeIfAbsent(menuIndex, ignored -> new MenuDraft());
                if (key.endsWith("[name]")) {
                    draft.name = value;
                } else if (key.endsWith("[price]")) {
                    draft.price = parseInt(value, 0);
                } else if (key.endsWith("[description]")) {
                    draft.description = value;
                } else if (key.endsWith("[_id]")) {
                    draft.id = value;
                }
            }
        });

        List<MenuItemDto> menuItems = menuDrafts.entrySet().stream()
                .sorted(Comparator.comparingInt(Map.Entry::getKey))
                .map(entry -> entry.getValue().toDto())
                .toList();

        return new RestaurantRequest(
                first(form, "restaurantName"),
                first(form, "city"),
                first(form, "country"),
                parseOptionalInt(first(form, "deliveryPrice")),
                parseOptionalInt(first(form, "estimatedDeliveryTime")),
                cuisines,
                menuItems,
                first(form, "imageUrl"),
                first(form, "ownerId"),
                parseOptionalBoolean(first(form, "isActive"))
        );
    }

    private static String first(MultiValueMap<String, String> form, String key) {
        return form.getFirst(key);
    }

    private static Integer parseOptionalInt(String value) {
        return value == null || value.isBlank() ? null : parseInt(value, 0);
    }

    private static int parseInt(String value, int fallback) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException exception) {
            return fallback;
        }
    }

    private static Boolean parseOptionalBoolean(String value) {
        return value == null || value.isBlank() ? null : Boolean.parseBoolean(value);
    }

    private static Integer bracketIndex(String key, String prefix) {
        if (!key.startsWith(prefix + "[")) {
            return null;
        }
        int end = key.indexOf(']', prefix.length() + 1);
        if (end < 0) {
            return null;
        }
        return parseInt(key.substring(prefix.length() + 1, end), -1);
    }

    private static class MenuDraft {
        private String id;
        private String name;
        private int price;
        private String description;

        private MenuItemDto toDto() {
            return new MenuItemDto(id, name, price, description);
        }
    }
}
