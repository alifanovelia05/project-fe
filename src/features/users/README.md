# Fitur Pengguna

## Ringkasan

Fitur ini menangani manajemen pengguna: melihat daftar, menambah, mengubah, dan menghapus data user.

## Struktur Folder

```bash
src/features/users/
├── components/
│   └── UserDataTable.tsx
├── services/
│   └── user.service.ts
├── index.ts
└── README.md
```

## Komponen Utama

- UserDataTable menampilkan data pengguna, pencarian, pagination, dan form tambah/ubah di dalam modal.

## Service

UserService menggunakan endpoint `/users` dan aturan khusus backend:

- `getUsers` hanya menggunakan query `username` untuk filter.
- `getUserByUsername` memakai `/users?username=...` (bukan `/users/:id`).
- `createUser` mengirim payload object tunggal.
- `updateUser` membungkus payload dalam array sesuai requirement backend.

## Contoh Penggunaan

```ts
import { UserDataTable } from "@/features/users";

export default function UsersPage() {
 return <UserDataTable />;
}
```

```ts
import { UserService } from "@/features/users";

const response = await UserService.getUsers();
```
