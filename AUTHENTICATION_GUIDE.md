# OAuth2 JWT Authentication Guide

## Overview

Your application now uses OAuth2 JWT (JSON Web Token) token-based authentication. This provides secure, stateless authentication for your API.

## Features

- **JWT Token-based authentication**: Secure token generation and validation
- **Password hashing**: PBKDF2 with SHA256 for secure password storage
- **Role-based authorization**: Support for admin, manager, and client roles
- **Protected endpoints**: API endpoints require authentication

## Configuration

### 1. Production Environment Setup

Before deploying, you **MUST** update the JWT secret key in Azure:

1. Go to Azure Portal → Your App Service → Configuration
2. Add/Update these Application Settings:

```
JwtSettings__SecretKey = <generate-a-strong-random-key-at-least-32-characters>
ConnectionStrings__DefaultConnection = <your-database-connection-string>
```

**Important**: Generate a strong, random secret key for production. You can use PowerShell:

```powershell
# Generate a secure random key (64 characters)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

### 2. Application Settings Structure

In `appsettings.Production.json`:

```json
{
  "JwtSettings": {
    "SecretKey": "",  // Set via Azure App Settings
    "Issuer": "skaiciuokle-api",
    "Audience": "skaiciuokle-client",
    "ExpirationMinutes": "60"
  }
}
```

## API Endpoints

### Authentication Endpoints (Public)

#### 1. Register a New User

**POST** `/api/auth/register`

Request body:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!"
}
```

Response (201 Created):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiration": "2024-12-03T10:45:00Z",
  "username": "john_doe",
  "email": "john@example.com",
  "role": "client"
}
```

#### 2. Login

**POST** `/api/auth/login`

Request body:
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

Response (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiration": "2024-12-03T10:45:00Z",
  "username": "john_doe",
  "email": "john@example.com",
  "role": "client"
}
```

#### 3. Get Current User

**GET** `/api/auth/me`

Headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Response (200 OK):
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "role": "client",
  "createdAt": "2024-12-01T08:00:00Z"
}
```

## Protected Endpoints

All API endpoints now require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Authorization Levels

1. **Public Endpoints** (No auth required):
   - `GET /api/products` - View all products
   - `GET /api/products/{id}` - View a product

2. **Authenticated Endpoints** (Any logged-in user):
   - `GET /api/orders` - View orders
   - `POST /api/orders` - Create order
   - `GET /api/documents` - View documents
   - `GET /api/comments` - View comments

3. **Manager/Admin Only**:
   - `POST /api/products` - Create product
   - `PUT /api/products/{id}` - Update product
   - `DELETE /api/orders/{id}` - Delete order
   - `DELETE /api/documents/{id}` - Delete document
   - `DELETE /api/comments/{id}` - Delete comment

4. **Admin Only**:
   - `DELETE /api/products/{id}` - Delete product
   - All `/api/users` endpoints - User management

## Usage Examples

### Using with Fetch API (JavaScript)

```javascript
// 1. Login
const loginResponse = await fetch('https://your-api.azurewebsites.net/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePassword123!'
  })
});

const { token } = await loginResponse.json();

// 2. Use token for authenticated requests
const ordersResponse = await fetch('https://your-api.azurewebsites.net/api/orders', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const orders = await ordersResponse.json();
```

### Using with cURL

```bash
# Login
curl -X POST https://your-api.azurewebsites.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePassword123!"}'

# Use the token from response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Make authenticated request
curl https://your-api.azurewebsites.net/api/orders \
  -H "Authorization: Bearer $TOKEN"
```

### Using with Postman

1. **Login** to get a token:
   - Method: POST
   - URL: `https://your-api.azurewebsites.net/api/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "john@example.com",
       "password": "SecurePassword123!"
     }
     ```
   - Copy the `token` from the response

2. **Use the token** in subsequent requests:
   - Go to the request you want to make
   - Click on "Authorization" tab
   - Type: Bearer Token
   - Token: Paste the JWT token

## User Roles

- **client** (default): Can view and create orders, documents, comments
- **manager**: Can manage products, orders, documents, and comments
- **admin**: Full access to all endpoints including user management

## Security Best Practices

1. **HTTPS Only**: Always use HTTPS in production
2. **Token Storage**: Store tokens securely (HttpOnly cookies or secure storage)
3. **Token Expiration**: Tokens expire after 60 minutes by default
4. **Password Requirements**: Minimum 6 characters (enforce stronger rules in production)
5. **Secret Key**: Use a strong, randomly generated secret key in production

## Troubleshooting

### 401 Unauthorized

- Token is missing: Include `Authorization: Bearer <token>` header
- Token expired: Login again to get a new token
- Invalid token: Ensure you copied the full token correctly

### 403 Forbidden

- Insufficient permissions: User role doesn't have access to this endpoint
- Check user role with `GET /api/auth/me`

## Migration Notes

### Existing Users

Existing users in the database will need to have their passwords re-hashed using the new password hashing system. You have two options:

1. **Password Reset**: Require users to reset passwords
2. **Manual Migration**: Run a migration script to update existing password hashes

### Creating Initial Admin User

You can manually create an admin user in the database or use the registration endpoint and update the role:

```sql
UPDATE users SET role = 1 WHERE email = 'admin@example.com';
-- Roles: 1 = admin, 2 = manager, 3 = client
```

## Deployment Checklist

Before deploying to production:

- [ ] Set strong JWT secret key in Azure App Settings
- [ ] Update connection string in Azure App Settings
- [ ] Enable HTTPS only in Azure App Service
- [ ] Create initial admin user
- [ ] Test all authentication endpoints
- [ ] Update frontend to use JWT tokens
- [ ] Configure CORS if needed

## Additional Resources

- [JWT.io](https://jwt.io/) - Debug and decode JWT tokens
- [ASP.NET Core Authentication](https://docs.microsoft.com/en-us/aspnet/core/security/authentication/)
