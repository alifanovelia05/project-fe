# Fitur Kendaraan

## Ringkasan

Fitur ini menangani manajemen data kendaraan: menampilkan daftar, menambah, mengubah, dan menghapus kendaraan melalui API.

## Struktur Folder

```bash
src/features/vehicles/
├── components/
│   ├── VehicleDataTable.tsx
│   ├── AddVehicleForm.tsx
│   └── EditVehicleForm.tsx
├── services/
│   └── vehicle.service.ts
├── index.ts
└── README.md
```

## Komponen Utama

- VehicleDataTable menampilkan data kendaraan, pencarian, dan pagination.
- AddVehicleForm menampilkan modal untuk menambah kendaraan.
- EditVehicleForm menampilkan modal untuk mengubah sekaligus menghapus kendaraan.

## Service

VehicleService menggunakan endpoint `/fleet/vehicle` dengan autentikasi token dari `sessionStorage`/`localStorage`.
Metode utama: `getVehicles`, `createVehicle`, `updateVehicle`, `deleteVehicle`.

## Contoh Penggunaan

```ts
import { VehicleDataTable } from "@/features/vehicles";

export default function KendaraanPage() {
    return <VehicleDataTable />;
}
```

```ts
import { VehicleService } from "@/features/vehicles";

const response = await VehicleService.getVehicles();
```
