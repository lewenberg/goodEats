package com.goodeats.foodordering.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.goodeats.foodordering.api.ErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class ApiKeyFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;
    private final String configuredApiKey;
    private final Path apiKeyFile;

    public ApiKeyFilter(ObjectMapper objectMapper,
                        @Value("${app.security.api-key:}") String configuredApiKey,
                        @Value("${app.security.api-key-file:}") String apiKeyFile) {
        this.objectMapper = objectMapper;
        this.configuredApiKey = configuredApiKey == null ? "" : configuredApiKey.trim();
        this.apiKeyFile = apiKeyFile == null || apiKeyFile.isBlank() ? null : Path.of(apiKeyFile);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return "OPTIONS".equalsIgnoreCase(request.getMethod()) || !request.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String expectedApiKey = expectedApiKey();
        if (expectedApiKey.isBlank()) {
            writeError(response, HttpStatus.INTERNAL_SERVER_ERROR, "API key is not configured. Set GOOD_EATS_API_KEY or GOOD_EATS_API_KEY_FILE.");
            return;
        }

        if (!expectedApiKey.equals(request.getHeader("X-API-KEY"))) {
            writeError(response, HttpStatus.UNAUTHORIZED, "Missing or invalid X-API-KEY header");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String expectedApiKey() throws IOException {
        if (!configuredApiKey.isBlank()) {
            return configuredApiKey;
        }
        if (apiKeyFile != null && Files.isRegularFile(apiKeyFile)) {
            return Files.readString(apiKeyFile).trim();
        }
        return "";
    }

    private void writeError(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), new ErrorResponse(message));
    }
}
