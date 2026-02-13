# Fitur Profil

## Ringkasan

Fitur ini menampilkan ringkasan profil pengguna dan data akun dengan komponen kartu.

## Struktur Folder

```bash
src/features/profile/
├── components/
│   ├── UserMetaCard.tsx
│   ├── UserInfoCard.tsx
│   └── UserAddressCard.tsx
├── services/
│   └── profile.service.ts
├── index.ts
└── README.md
```

## Komponen Utama

- UserMetaCard menampilkan ringkasan identitas dan status user.
- UserInfoCard menampilkan informasi personal (username, nama, email, login terakhir).
- UserAddressCard menampilkan detail akun dan akses menu.

## Service

ProfileService menyediakan `getCurrentUser` untuk mengambil data profil dari endpoint `/users/me`.

## Contoh Penggunaan

```ts
import { UserMetaCard, UserInfoCard, UserAddressCard } from "@/features/profile";
```

```ts
import { ProfileService } from "@/features/profile";

const response = await ProfileService.getCurrentUser();
```
