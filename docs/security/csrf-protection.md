# CSRF Protection Implementation

## Overview

Cross-Site Request Forgery (CSRF) protection has been implemented in the Secure Wellbeing Blog application to prevent attackers from tricking authenticated users into performing unwanted actions. The implementation uses the "double submit cookie" pattern, which is a well-established technique for CSRF protection.

## Implementation Details

### 1. CSRF Token Generation and Storage

- A secure random token is generated using `crypto.randomBytes(32).toString('hex')`
- The token is stored as an HTTP-only cookie with `SameSite=Strict` attribute
- The same token is also made available in `res.locals.csrfToken` for use in templates

### 2. Token Inclusion in Forms

- A middleware (`csrfInjection.js`) automatically injects CSRF tokens into all HTML forms
- Each form receives a hidden input field: `<input type="hidden" name="csrf_token" value="[token]">`
- For AJAX requests, the token can be included in headers or request body

### 3. Token Validation

- All non-idempotent requests (POST, PUT, DELETE) are protected by CSRF validation
- The validation middleware checks that the token in the request matches the token in the cookie
- If validation fails, the request is rejected with a 403 Forbidden status

## Protected Routes

The following routes are protected by CSRF validation:

- `/register` - User registration
- `/login` - User login
- `/2fa/verify` - 2FA verification
- `/2fa/resend` - Resend 2FA code

## Testing

You can test the CSRF protection with:

```
npm run test-csrf
```

This script demonstrates:
1. How to obtain a valid CSRF token
2. How requests with a valid token succeed
3. How requests without a token are rejected

## Security Considerations

- The token is stored in a cookie with the `HttpOnly` flag to prevent client-side JavaScript access
- The SameSite attribute is set to `Strict` to ensure the cookie is only sent in same-site requests
- Token validation is enforced on all state-changing operations (POST/PUT/DELETE)
- The secure flag is enabled in production to ensure tokens are only sent over HTTPS

## References

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [CSRF Prevention in Express.js](https://expressjs.com/en/resources/middleware/csurf.html)