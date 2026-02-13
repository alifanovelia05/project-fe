# Fitur Autentikasi

## Ringkasan

Fitur ini menangani proses login dan registrasi melalui form client dan server action.

## Struktur Folder

```bash
src/features/auth/
├── components/
│   ├── SignInForm.tsx
│   └── SignUpForm.tsx
├── services/
│   └── auth.service.ts
├── index.ts
└── README.md
```

## Komponen Utama

- SignInForm mengirim kredensial ke `loginAction`, menyimpan token di `sessionStorage` dan `localStorage`, lalu redirect.
- SignUpForm mengirim data registrasi ke `registerAction` dan redirect ke halaman login saat sukses.

## Service

AuthService menyediakan API untuk `login`, `register`, dan `getProfile`. Service ini digunakan di server action pada [src/lib/actions/auth.actions.ts](src/lib/actions/auth.actions.ts).

## Contoh Penggunaan

```ts
import { SignInForm, SignUpForm } from "@/features/auth";
```
