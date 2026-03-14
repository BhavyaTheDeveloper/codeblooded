# API Examples

Base URL: `http://localhost:4000/api`

## Auth (no token required)

### Signup
```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'
```

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```
Use the returned `token` in subsequent requests: `Authorization: Bearer <token>`.

### Forgot password
```bash
curl -X POST http://localhost:4000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

### Reset password (with OTP)
```bash
curl -X POST http://localhost:4000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","otpCode":"123456","newPassword":"newpassword123"}'
```

---

## Categories (Bearer token required)

```bash
export TOKEN="<your-jwt>"
```

- List: `curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/categories`
- Create: `curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"Electronics","description":"Tech items"}' http://localhost:4000/api/categories`
- Get: `curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/categories/:id`
- Update: `curl -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"Updated"}' http://localhost:4000/api/categories/:id`
- Delete: `curl -X DELETE -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/categories/:id`

---

## Products

- List (with search/category): `curl -H "Authorization: Bearer $TOKEN" "http://localhost:4000/api/products?search=widget&categoryId=<id>&skip=0&take=20"`
- Create: `curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"sku":"SKU-001","name":"Widget","unit":"UNIT","minStock":10}' http://localhost:4000/api/products`
- Get / Update / Delete: same pattern as categories with `/api/products/:id`

---

## Warehouses

- List: `GET /api/warehouses`
- Create: `POST /api/warehouses` body `{"code":"WH-1","name":"Main","address":"..."}`
- Locations: `GET /api/warehouses/:id/locations`, `POST /api/warehouses/:id/locations` body `{"code":"A-01","name":"Aisle A"}`

---

## Receipts (incoming stock)

- List: `GET /api/receipts?warehouseId=&status=DRAFT`
- Create: `POST /api/receipts` body `{"warehouseId":"<wh-id>","supplier":"Acme","items":[{"productId":"<pid>","locationId":"<loc-id>","quantity":10}]}`
- Validate (increases stock + ledger): `POST /api/receipts/:id/validate`

---

## Deliveries (outgoing stock)

- List: `GET /api/deliveries?warehouseId=&status=DRAFT`
- Create: `POST /api/deliveries` body `{"warehouseId":"<wh-id>","customer":"Client","items":[{"productId":"<pid>","locationId":"<loc-id>","quantity":5}]}`
- Update status: `PATCH /api/deliveries/:id/status` body `{"status":"PICKED"}` or `PACKED`
- Validate: `POST /api/deliveries/:id/validate`

---

## Transfers (internal move)

- List: `GET /api/transfers?fromWarehouseId=&toWarehouseId=&status=`
- Create: `POST /api/transfers` body `{"fromWarehouseId":"<id>","toWarehouseId":"<id>","items":[{"productId":"<pid>","fromLocationId":"<id>","toLocationId":"<id>","quantity":5}]}`
- Validate: `POST /api/transfers/:id/validate`

---

## Adjustments

- List: `GET /api/adjustments?warehouseId=&status=`
- Create: `POST /api/adjustments` body `{"warehouseId":"<id>","reason":"Physical count","items":[{"productId":"<pid>","locationId":"<id>","quantityDelta":-2,"reason":"Damaged"}]}`
- Validate: `POST /api/adjustments/:id/validate`

---

## Inventory & Ledger

- List inventory: `GET /api/inventory?warehouseId=&productId=&locationId=&skip=0&take=50`
- Stock ledger: `GET /api/inventory/ledger?documentType=RECEIPT&productId=&warehouseId=&fromDate=&toDate=&skip=0&take=50`

---

## Dashboard

- KPIs: `GET /api/dashboard/kpis`
- Recent activities: `GET /api/dashboard/activities?documentType=RECEIPT&warehouseId=&limit=20`
