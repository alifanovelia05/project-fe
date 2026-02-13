# Panduan Testing User API dengan Postman

## Base URL

```text
http://149.28.151.39:3000
```

## Headers untuk Request dengan Auth

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <your_token_here>"
}
```

---

## 1. GET All Users / Search Users

### Endpoint GET All

```text
GET /users
```

### ATURAN PENTING GET All ⚠️

- **JANGAN** gunakan query `?id=...` karena middleware backend akan otomatis menghapusnya
- Gunakan parameter `username` untuk mencari data spesifik

### Query Parameters (Optional)

```text
?username=testuser1
```

### Contoh Request GET All Users

**Method:** `GET`  
**URL:** `http://149.28.151.39:3000/users`  
**Headers:**

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"
}
```

### Contoh Response GET All Users

```json
[
  {
    "id": 1,
    "username": "testuser1",
    "email": "test1@example.com",
    "name": "Test User 1",
    "status": 1,
    "type": 4,
    "parent": 1,
    "group": 0,
    "usergroup": 4,
    "menu": "",
    "lastlogin": "2026-02-11T10:30:00.000Z",
    "registered": "2026-02-10T08:00:00.000Z"
  }
]
```

---

## 2. GET User Detail

### Endpoint GET Detail

```text
GET /users?username=<username>
```

### ATURAN PENTING GET Detail ⚠️

- **JANGAN** gunakan `/users/:id` karena akan menghasilkan **404**
- **WAJIB** gunakan query string `?username=...` untuk mendapatkan detail user

### Contoh Request GET User Detail

**Method:** `GET`  
**URL:** `http://149.28.151.39:3000/users?username=testuser1`  
**Headers:**

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"
}
```

### Contoh Response GET User Detail

```json
[
  {
    "id": 1,
    "username": "testuser1",
    "email": "test1@example.com",
    "name": "Test User 1",
    "status": 1,
    "type": 4,
    "parent": 1,
    "group": 0,
    "usergroup": 4,
    "menu": "",
    "lastlogin": "2026-02-11T10:30:00.000Z",
    "registered": "2026-02-10T08:00:00.000Z"
  }
]
```

---

## 3. POST Create User

### Endpoint POST Create

```text
POST /users
```

### ATURAN PENTING POST Create ⚠️

- Kirim data sebagai **Object JSON tunggal** (BUKAN array)
- Field **WAJIB**: `email`, `password`, `username` (divalidasi ketat oleh backend)

### Contoh Request POST Create User

**Method:** `POST`  
**URL:** `http://149.28.151.39:3000/users`  
**Headers:**

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"
}
```

**Body (raw JSON):**

```json
{
  "username": "newuser123",
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "name": "New User",
  "status": 1,
  "type": 4,
  "usergroup": 4,
  "parent": 1,
  "group": "",
  "menu": ""
}
```

### Field Descriptions

| Field | Type | Required | Default | Description |
| ----- | ---- | -------- | ------- | ----------- |
| username | string | ✅ Yes | - | Username unik |
| email | string | ✅ Yes | - | Email valid |
| password | string | ✅ Yes | - | Password (akan di-hash md5) |
| name | string | No | username/email | Nama lengkap |
| status | number | No | 1 | 1=Aktif, 2=Nonaktif |
| type | number | No | 4 | 1=Super Admin, 2=Admin, 3=Manager, 4=Pengguna |
| usergroup | number | No | 4 | Group ID |
| parent | number | No | 1 | Parent user ID |
| group | string/number | No | "" | Group info |
| menu | string | No | "" | Menu permissions |

### Contoh Response POST Success

```json
{
  "success": true,
  "message": "User berhasil ditambah",
  "data": {
    "id": 42,
    "username": "newuser123",
    "email": "newuser@example.com",
    "name": "New User"
  }
}
```

### Contoh Response POST Error

```json
{
  "success": false,
  "message": "Please input correct email address"
}
```

---

## 4. PATCH Update User

### Endpoint PATCH Update

```text
PATCH /users/:id
```

### ATURAN PENTING PATCH Update ⚠️

- Server **WAJIB** menerima data dalam bentuk **ARRAY []**
- Jika mengirim Object tunggal, server akan return **400 Bad Request**
- Pastikan membungkus payload dalam array: `[{ id: ..., field: value }]`

### Contoh Request PATCH Update User

**Method:** `PATCH`  
**URL:** `http://149.28.151.39:3000/users/42`  
**Headers:**

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"
}
```

**Body (raw JSON) - HARUS ARRAY:**

```json
[
  {
    "id": 42,
    "username": "updateduser123",
    "email": "updated@example.com",
    "name": "Updated User Name",
    "status": 1,
    "type": 3
  }
]
```

### Update Password

Jika ingin update password, tambahkan field `password` dan `confirm_password`:

```json
[
  {
    "id": 42,
    "password": "NewSecurePass456!",
    "confirm_password": "NewSecurePass456!"
  }
]
```

### Contoh Response PATCH Success

```json
{
  "success": true,
  "message": "User berhasil diperbarui",
  "data": {
    "id": 42
  }
}
```

### Contoh Response PATCH Error

```json
{
  "success": false,
  "message": "Need array of users, even in single mode"
}
```

---

## 5. DELETE User (Soft Delete)

### Endpoint DELETE Soft Delete

```text
PATCH /users/:id
```

### ATURAN PENTING DELETE Soft Delete ⚠️

- Tidak ada endpoint `DELETE` eksplisit
- Gunakan method `PATCH` untuk soft-delete
- Ubah field `status` menjadi `0` atau `2` untuk menonaktifkan user
- Kirim sebagai **ARRAY** (sesuai aturan PATCH)

### Contoh Request DELETE Soft Delete

**Method:** `PATCH`  
**URL:** `http://149.28.151.39:3000/users/42`  
**Headers:**

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"
}
```

**Body (raw JSON) - Soft Delete:**

```json
[
  {
    "id": 42,
    "status": 0
  }
]
```

### Contoh Response DELETE Success

```json
{
  "success": true,
  "message": "User berhasil dihapus",
  "data": {
    "id": 42
  }
}
```

---

## Catatan Penting untuk Frontend Developer

### 1. GET Request - Filter by Username, NOT ID

```javascript
// ❌ SALAH - Backend akan delete params.id
axios.get('/users', { params: { id: 42 } });

// ✅ BENAR - Gunakan username
axios.get('/users', { params: { username: 'testuser1' } });
```

### 2. GET User Detail - Gunakan Query String

```javascript
// ❌ SALAH - Akan 404
axios.get('/users/42');

// ✅ BENAR - Gunakan query string username
axios.get('/users', { params: { username: 'testuser1' } });
```

### 3. POST Create - Object Tunggal

```javascript
// ✅ BENAR - Kirim sebagai object
axios.post('/users', {
  username: 'newuser',
  email: 'test@example.com',
  password: 'secret123'
});
```

### 4. PATCH Update - WAJIB Array

```javascript
// ❌ SALAH - Object tunggal akan error 400
axios.patch('/users/42', {
  id: 42,
  name: 'Updated'
});

// ✅ BENAR - Bungkus dalam array
axios.patch('/users/42', [
  {
    id: 42,
    name: 'Updated'
  }
]);
```

### 5. DELETE - Soft Delete dengan PATCH

```javascript
// ❌ SALAH - Tidak ada endpoint DELETE
axios.delete('/users/42');

// ✅ BENAR - Soft delete dengan PATCH status
axios.patch('/users/42', [
  {
    id: 42,
    status: 0
  }
]);
```

---

## Testing Checklist

- [ ] Test GET all users tanpa query parameter
- [ ] Test GET users dengan filter `?username=...`
- [ ] Test GET user detail dengan `?username=...`
- [ ] Test POST create user dengan payload lengkap
- [ ] Test POST create user tanpa field wajib (harus error)
- [ ] Test PATCH update user dengan array payload
- [ ] Test PATCH update user dengan object tunggal (harus error 400)
- [ ] Test PATCH update password
- [ ] Test PATCH soft delete (ubah status jadi 0)

---

## Troubleshooting

### Error: "Need array of users, even in single mode"

**Penyebab:** Mengirim object tunggal pada PATCH request  
**Solusi:** Bungkus payload dalam array `[{ id, field: value }]`

### Error: "Please input all required fields"

**Penyebab:** Field wajib (email/password/username) tidak ada pada POST  
**Solusi:** Pastikan semua field wajib terisi

### Error: 404 pada GET /users/:id

**Penyebab:** Backend tidak support endpoint dengan path parameter ID  
**Solusi:** Gunakan query string `?username=...` untuk filter

### Filter by ID tidak bekerja

**Penyebab:** Middleware backend menghapus `params.id`  
**Solusi:** Gunakan `username` untuk filtering, bukan `id`
