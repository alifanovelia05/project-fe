# Vehicle Fleet Management Feature

## Overview

This is a complete vehicle fleet management feature built with Next.js 16, React 19, and TypeScript. It provides full CRUD operations for managing vehicles with API integration.

## Directory Structure

```bash
src/features/vehicles/
├── components/
│   ├── VehicleDataTable.tsx      # Main vehicle list display with filtering, search, pagination
│   ├── AddVehicleForm.tsx        # Modal form for creating new vehicles
│   └── EditVehicleForm.tsx       # Modal form for editing vehicles with delete capability
├── services/
│   └── vehicle.service.ts        # API service layer for vehicle operations
├── types/                        # Future: Type definitions and interfaces
├── index.ts                      # Barrel export for cleaner imports
└── README.md                     # This file
```

## Features

### Vehicle Data Table

- **Grid Layout**: Responsive 1-4 column grid (1 on mobile, 2 on tablet, 3 on desktop, 4 on ultra-wide)
- **Search**: Search across plate, brand, model, type, and STNK
- **Filtering**: Filter by status (Semua, Aktif, Tidak Aktif)
- **Pagination**: 12 items per page with page navigation
- **Brand Logo**: Visual brand indicators with emoji icons
- **Status Badge**: Color-coded status display (green=Aktif, red=Tidak Aktif)
- **Edit/Delete**: Click edit button to open modal for editing or deleting vehicle
- **Dark Mode**: Full dark mode support

### Add Vehicle Form

- **Modal-Based**: Opens in max-w-5xl modal
- **3-Column Grid**: Form fields organized in 3 columns for better space utilization
- **20+ Fields**: Supports all vehicle data including:
  - Basic info: Plate, Brand, Model, Type (required)
  - Details: Year, Color, STNK, Fuel Type, Status
  - Extended: Owner ID, Group ID, Vehicle Type, Valid Date, Fuel Tank, Engine, Tire, Capacity, Speed Limit, Last Service, Last Mileage, GPS ID
- **Validation**:
  - Required field checking
  - Duplicate plate detection
  - Error messages displayed above form
- **Success Feedback**: Success message shown before closing modal
- **Loading State**: Submit button shows loading spinner while processing

### Edit Vehicle Form

- **Pre-filled Data**: All fields pre-populated with current vehicle data
- **Same Fields**: Identical to Add form for consistency
- **Delete Button**: Red delete button on the left side
- **Delete Confirmation**: Confirmation dialog prevents accidental deletion
- **Dual Loading States**: Separate loading indicators for save and delete operations
- **Success Feedback**: Success messages for both save and delete operations

### API Integration

- **Base URL**: `http://149.28.151.39:3000/fleet/vehicle`
- **Authentication**: JWT Bearer token from sessionStorage/localStorage
- **Methods**:
  - GET `/fleet/vehicle` - Fetch all vehicles
  - POST `/fleet/vehicle` - Create new vehicle
  - PUT `/fleet/vehicle/{id}` - Update vehicle
  - DELETE `/fleet/vehicle/{id}` - Delete vehicle
- **Error Handling**: Comprehensive error messages and logging

## Usage

### Import Components

```typescript
// Individual imports
import VehicleDataTable from "@/features/vehicles/components/VehicleDataTable";
import AddVehicleForm from "@/features/vehicles/components/AddVehicleForm";
import EditVehicleForm from "@/features/vehicles/components/EditVehicleForm";

// Or using barrel export
import { VehicleDataTable, AddVehicleForm, EditVehicleForm } from "@/features/vehicles";
```

### Import Services

```typescript
import { VehicleService, type Vehicle, type CreateVehiclePayload } from "@/features/vehicles/services/vehicle.service";

// Or using barrel export
import { VehicleService, type Vehicle, type CreateVehiclePayload } from "@/features/vehicles";
```

### Using the Vehicle Data Table

```typescript
import { VehicleDataTable } from "@/features/vehicles";

export default function KendaraanPage() {
    return (
        <div>
            <h1>Vehicle Management</h1>
            <VehicleDataTable />
        </div>
    );
}
```

## API Service Methods

### getVehicles()

Fetches all vehicles from the API.

```typescript
const response = await VehicleService.getVehicles();
if (response.success) {
    const vehicles: Vehicle[] = response.data;
}
```

### createVehicle(payload)

Creates a new vehicle.

```typescript
const payload: CreateVehiclePayload = {
    plate: "B 1234 ABC",
    brand: "Toyota",
    model: "Avanza",
    type: "MPV",
    year: 2023,
    color: "Black",
    stnk: "123456",
    fueltype: "Gasoline"
};
const response = await VehicleService.createVehicle(payload);
```

### updateVehicle(id, payload)

Updates an existing vehicle.

```typescript
const response = await VehicleService.updateVehicle(vehicleId, updatedPayload);
```

### deleteVehicle(id)

Deletes a vehicle.

```typescript
const response = await VehicleService.deleteVehicle(vehicleId);
```

## Data Types

### Vehicle Interface

```typescript
interface Vehicle {
    id: number;
    plate: string;
    owner: number;
    status: number;
    groups: number;
    brand: string;
    model: string;
    type: string;
    vehicle_type: number;
    year: number;
    color: string;
    stnk: string;
    valid: string;
    fueltype: string;
    fueltank: number;
    engine: number;
    tire: number;
    capacity: number;
    gsmvalid: string | null;
    speed_limit: number;
    kirvalid: string | null;
    last_service: string;
    last_mileage: number;
    registered: string;
    gpsid: string;
}
```

### CreateVehiclePayload Interface

```typescript
interface CreateVehiclePayload {
    plate: string;
    brand: string;
    model: string;
    type: string;
    year: number;
    color: string;
    stnk: string;
    fueltype: string;
    status?: number;
    owner?: number;
    groups?: number;
    vehicle_type?: number;
    fueltank?: number;
    engine?: number;
    tire?: number;
    capacity?: number;
    speed_limit?: number;
}
```

## Styling & Theme

All components use:

- **Tailwind CSS 4.x** for styling
- **Dark Mode**: Fully supported with `dark:` prefixes
- **Colors**: Brand color system (`bg-brand-600`, `text-brand-600`, etc.)
- **Responsive**: Mobile-first responsive design
- **Animations**: Smooth transitions and hover effects

## Dependencies

- **react-select**: For dropdown selects with search capability
- **Tailwind CSS**: For styling
- **Next.js**: Framework
- **React**: UI library
- **TypeScript**: Type safety

## Recent Changes (Migration from Flat Structure)

Previously, this feature was organized in a flat structure:

```bash
src/components/tables/VehicleDataTable.tsx
src/components/tables/AddVehicleForm.tsx
src/components/tables/EditVehicleForm.tsx
src/services/vehicle.service.ts
```

It has been reorganized to a feature-based structure for better maintainability:

```bash
src/features/vehicles/
├── components/
├── services/
├── types/
└── index.ts
```

## Best Practices

1. **Centralized API Calls**: All API interactions go through VehicleService
2. **Component Composition**: Forms are composable and reusable
3. **Error Handling**: Comprehensive error handling with user-friendly messages
4. **Type Safety**: Full TypeScript support with proper interfaces
5. **Responsive Design**: Mobile-first approach with Tailwind CSS
6. **Dark Mode**: Built-in dark mode support
7. **Barrel Exports**: Cleaner imports using index.ts

## Future Improvements

- Add validation schemas (e.g., Zod, Yup)
- Add unit and integration tests
- Create custom hooks for form management
- Add pagination to API service
- Implement infinite scroll option
- Add vehicle image upload capability
- Create vehicle detail view page
- Add bulk operations (select multiple vehicles)
- Export to CSV/Excel functionality
