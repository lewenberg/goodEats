package com.goodeats.foodordering.security;

import java.util.List;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

@Component
public class DemoTokenAuthenticationProvider implements AuthenticationProvider {

    private final DemoTokenProperties properties;

    public DemoTokenAuthenticationProvider(DemoTokenProperties properties) {
        this.properties = properties;
    }

    @Override
    public Authentication authenticate(Authentication authentication) {
        String token = String.valueOf(authentication.getCredentials());
        DemoTokenProperties.DemoTokenUser tokenUser = properties.getDemoTokens().get(token);
        if (tokenUser == null) {
            throw new BadCredentialsException("Invalid token");
        }
        CurrentUser currentUser = tokenUser.toCurrentUser();
        return UsernamePasswordAuthenticationToken.authenticated(
                currentUser,
                token,
                List.of(new SimpleGrantedAuthority(currentUser.authority()))
        );
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return BearerTokenAuthentication.class.isAssignableFrom(authentication);
    }
}
