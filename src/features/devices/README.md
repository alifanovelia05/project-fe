# Fitur Device

## Ringkasan

Fitur ini menangani manajemen device/GPS: menampilkan daftar, menambah, mengubah, menghapus, dan pencarian device.

## Struktur Folder

```bash
src/features/devices/
├── components/
│   ├── DeviceDataTable.tsx
│   ├── AddDeviceForm.tsx
│   └── EditDeviceForm.tsx
├── services/
│   └── device.service.ts
├── index.ts
└── README.md
```

## Komponen Utama

- DeviceDataTable menampilkan data device, pencarian, pagination, dan modal tambah/ubah.
- AddDeviceForm dan EditDeviceForm menangani input data device.

## Service

DeviceService memakai endpoint `/device` dengan token di header `Authorization` dan `x-access-token`.
Metode utama: `getDevices`, `getDeviceById`, `createDevice`, `updateDevice`, `deleteDevice`.

## Contoh Penggunaan

```ts
import { DeviceDataTable } from "@/features/devices";

export default function DevicePage() {
  return <DeviceDataTable />;
}
```

```ts
import { DeviceService } from "@/features/devices";

const response = await DeviceService.getDevices();
```
