package com.goodeats.foodordering.security;

import com.goodeats.foodordering.domain.UserRole;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security")
public class DemoTokenProperties {

    private Map<String, DemoTokenUser> demoTokens = defaultTokens();

    public Map<String, DemoTokenUser> getDemoTokens() {
        return demoTokens;
    }

    public void setDemoTokens(Map<String, DemoTokenUser> demoTokens) {
        this.demoTokens = demoTokens == null || demoTokens.isEmpty() ? defaultTokens() : demoTokens;
    }

    public static class DemoTokenUser {
        private String userId;
        private String email;
        private String role;

        public DemoTokenUser() {
        }

        public DemoTokenUser(String userId, String email, String role) {
            this.userId = userId;
            this.email = email;
            this.role = role;
        }

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }

        CurrentUser toCurrentUser() {
            return new CurrentUser(userId, email, UserRole.fromApiValue(role));
        }
    }

    private static Map<String, DemoTokenUser> defaultTokens() {
        Map<String, DemoTokenUser> tokens = new LinkedHashMap<>();
        tokens.put("token-admin-001", new DemoTokenUser("admin-001", "admin@goodeats.test", "admin"));
        tokens.put("token-owner-001", new DemoTokenUser("owner-001", "maria@copperkettle.test", "owner"));
        tokens.put("token-owner-002", new DemoTokenUser("owner-002", "kenji@noodleworks.test", "owner"));
        tokens.put("token-customer-001", new DemoTokenUser("customer-001", "jordan@example.test", "customer"));
        tokens.put("token-customer-002", new DemoTokenUser("customer-002", "priya@example.test", "customer"));
        tokens.put("token-customer-003", new DemoTokenUser("customer-003", "sam@example.test", "customer"));
        return tokens;
    }
}
