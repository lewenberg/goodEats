package com.goodeats.foodordering.security;

import org.springframework.security.authentication.AbstractAuthenticationToken;

public class BearerTokenAuthentication extends AbstractAuthenticationToken {

    private final String token;

    public BearerTokenAuthentication(String token) {
        super(null);
        this.token = token;
        setAuthenticated(false);
    }

    @Override
    public Object getCredentials() {
        return token;
    }

    @Override
    public Object getPrincipal() {
        return token;
    }
}
