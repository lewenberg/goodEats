# GoodEats Spring Boot API

This folder is the Spring Boot 3 backend for the food-ordering frontend. It replaces the old Express/SQLite demo API with Spring Web, Spring Data JPA, Spring Security, stateless bearer authentication, API-key enforcement, role authorization, validation, and centralized JSON error handling.

## Runtime Contract

- `GET /` returns `{ "message": "Food ordering API is running" }`.
- Public restaurant search remains at `GET /api/restaurant/search/{city}` but still requires `X-API-KEY`, matching the Express middleware.
- Authenticated profile and owner routes remain under `/api/my/user` and `/api/my/restaurant`.
- Admin/owner/customer app routes remain under `/api/app`.
- Demo bearer tokens from the React app are authenticated through Spring Security and mapped to `ROLE_ADMIN`, `ROLE_OWNER`, or `ROLE_CUSTOMER`.

## Configuration

Set `GOOD_EATS_API_KEY` for production. For local development, the app can also read `java/.api-key`.

The normal Maven startup path creates `java/.api-key` automatically if it does not already exist:

```bash
./mvnw spring-boot:run
```

The default database is a file-backed H2 database:

```properties
GOOD_EATS_DATABASE_URL=jdbc:h2:file:./data/food-ordering;MODE=MySQL;DATABASE_TO_LOWER=TRUE
GOOD_EATS_DATABASE_USERNAME=sa
GOOD_EATS_DATABASE_PASSWORD=
```

The app seeds the same users and restaurants as the Express demo on startup if the restaurant table has not already been populated.

## Security Model

- `ApiKeyFilter` enforces `X-API-KEY` for every `/api/**` route.
- `BearerTokenFilter` enforces `Authorization: Bearer ...` for protected routes.
- `DemoTokenAuthenticationProvider` is a real Spring `AuthenticationProvider`, so controllers receive a typed authenticated principal.
- Admin-only, owner-only, and customer-only operations are checked in services with consistent `403` JSON responses.

## API Coverage

- Users: get current user, create/upsert first login user, update profile, admin list users.
- Restaurants: owner restaurant get/create/update, admin create/update/delete, owner-scoped management, city search, cuisine filtering, sorting, pagination.
- Orders: customer checkout, role-scoped order listing, admin/owner status updates.
