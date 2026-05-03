package com.goodeats.foodordering.api;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RootController {

    @GetMapping("/")
    public Map<String, String> health() {
        return Map.of("message", "Food ordering API is running");
    }
}
