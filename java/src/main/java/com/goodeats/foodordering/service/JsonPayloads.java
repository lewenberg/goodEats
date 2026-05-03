package com.goodeats.foodordering.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.goodeats.foodordering.api.ApiException;
import com.goodeats.foodordering.api.dto.MenuItemDto;
import com.goodeats.foodordering.api.dto.OrderItemDto;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class JsonPayloads {

    private static final TypeReference<List<String>> STRING_LIST = new TypeReference<>() {
    };
    private static final TypeReference<List<MenuItemDto>> MENU_ITEMS = new TypeReference<>() {
    };
    private static final TypeReference<List<OrderItemDto>> ORDER_ITEMS = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;

    public JsonPayloads(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public List<String> cuisines(String json) {
        return read(json, STRING_LIST);
    }

    public List<MenuItemDto> menuItems(String json) {
        return read(json, MENU_ITEMS);
    }

    public List<OrderItemDto> orderItems(String json) {
        return read(json, ORDER_ITEMS);
    }

    public String write(Object value) {
        try {
            return objectMapper.writeValueAsString(value == null ? List.of() : value);
        } catch (JsonProcessingException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid request");
        }
    }

    private <T> T read(String json, TypeReference<T> type) {
        try {
            return objectMapper.readValue(json == null || json.isBlank() ? "[]" : json, type);
        } catch (JsonProcessingException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Stored data is invalid");
        }
    }
}
