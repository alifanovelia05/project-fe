"use client";

import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { VehicleService, CreateVehiclePayload, Vehicle } from "../services/vehicle.service";
import Label from "@/components/form/Label";
import { DeviceService, type Device } from "@/features/devices/services/device.service";

interface EditVehicleFormProps {
    vehicle: Vehicle;
    onSuccess: () => void;
    onClose: () => void;
    onDelete: () => void;
}

const EditVehicleForm: React.FC<EditVehicleFormProps> = ({ vehicle, onSuccess, onClose, onDelete }) => {
    const fuelOptions = [
        { value: "Gasoline", label: "Gasoline" },
        { value: "Diesel", label: "Diesel" },
        { value: "LPG", label: "LPG" },
        { value: "Hybrid", label: "Hybrid" },
        { value: "Electric", label: "Electric" },
    ];

    const statusOptions = [
        { value: 1, label: "Aktif" },
        { value: 0, label: "Tidak Aktif" },
    ];

    const [isPending, setIsPending] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [deviceError, setDeviceError] = useState<string | null>(null);
    const [isDeviceLoading, setIsDeviceLoading] = useState(false);
    const [devices, setDevices] = useState<Device[]>([]);

    const [formData, setFormData] = useState({
        plate: vehicle.plate || "",
        brand: vehicle.brand || "",
        model: vehicle.model || "",
        type: vehicle.type || "",
        gpsid: vehicle.gpsid || "",
        vehicle_type: vehicle.vehicle_type || 1,
        year: vehicle.year || new Date().getFullYear(),
        color: vehicle.color || "",
        stnk: vehicle.stnk || "",
        fueltype: vehicle.fueltype || "Gasoline",
        status: vehicle.status || 1,
        owner: vehicle.owner || 1,
        groups: vehicle.groups || 1,
        valid: vehicle.valid || "",
        fueltank: vehicle.fueltank || 0,
        engine: vehicle.engine || 0,
        tire: vehicle.tire || 0,
        capacity: vehicle.capacity || 0,
        speed_limit: vehicle.speed_limit || 0,
        last_service: vehicle.last_service || "",
        last_mileage: vehicle.last_mileage || 0,
    });

    useEffect(() => {
        const loadDevices = async () => {
            setIsDeviceLoading(true);
            setDeviceError(null);
            try {
                const response = await DeviceService.getDevices();
                if (response.success && response.data) {
                    setDevices(response.data);
                } else {
                    setDeviceError(response.message || "Gagal mengambil data GPS");
                }
            } catch (err) {
                setDeviceError(err instanceof Error ? err.message : "Terjadi kesalahan");
            } finally {
                setIsDeviceLoading(false);
            }
        };

        loadDevices();
    }, []);

    const deviceOptions = useMemo(() => {
        return devices.map((device) => ({
            value: device.id,
            label: device.plate ? `${device.plate} — ${device.id}` : device.id,
        }));
    }, [devices]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numericFields = ["year", "vehicle_type", "owner", "groups", "fueltank", "engine", "tire", "capacity", "speed_limit", "last_mileage"];
        setFormData((prev) => ({
            ...prev,
            [name]: numericFields.includes(name) ? parseInt(value) || 0 : value,
        }));
    };

    const handleSelectChange = (option: any, field: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: option?.value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsPending(true);

        try {
            // Buat payload yang sesuai dengan CreateVehiclePayload interface
            const payload: CreateVehiclePayload = {
                plate: formData.plate,
                brand: formData.brand,
                model: formData.model,
                type: formData.type,
                year: formData.year,
                color: formData.color,
                stnk: formData.stnk,
                fueltype: formData.fueltype,
                gpsid: formData.gpsid || undefined,
                status: formData.status,
                owner: formData.owner,
                groups: formData.groups,
                vehicle_type: formData.vehicle_type,
                fueltank: formData.fueltank,
                engine: formData.engine,
                tire: formData.tire,
                capacity: formData.capacity,
                speed_limit: formData.speed_limit,
            };

            console.log("Updating vehicle ID:", vehicle.id);
            console.log("Update payload:", payload);

            const response = await VehicleService.updateVehicle(vehicle.id, payload);
            console.log("Update response:", response);

            if (response.success) {
                setSuccess("Kendaraan berhasil diperbarui!");
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 1500);
            } else {
                setError(response.message || "Gagal memperbarui kendaraan");
                console.error("Failed to update vehicle:", response);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan yang tidak diketahui";
            setError(errorMessage);
            console.error("Exception during vehicle update:", err);
        } finally {
            setIsPending(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Apakah Anda yakin ingin menghapus kendaraan ${vehicle.plate}?`)) {
            return;
        }

        setError(null);
        setSuccess(null);
        setIsDeleting(true);

        try {
            const response = await VehicleService.deleteVehicle(vehicle.id);

            if (response.success) {
                setSuccess("Kendaraan berhasil dihapus!");
                setTimeout(() => {
                    onDelete();
                    onClose();
                }, 1500);
            } else {
                setError(response.message || "Gagal menghapus kendaraan");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Alert */}
            {error && (
                <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* Success Alert */}
            {success && (
                <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 dark:bg-green-500/10 dark:border-green-500/20">
                    <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
                </div>
            )}

            {/* Three Column Layout */}
            <div className="grid grid-cols-3 gap-4">
                {/* Plate */}
                <div>
                    <Label htmlFor="plate">
                        No. Plat <span className="text-red-500">*</span>
                    </Label>
                    <input
                        id="plate"
                        name="plate"
                        type="text"
                        placeholder="Contoh: B 1234 ABC"
                        required
                        value={formData.plate}
                        onChange={handleChange}
                        disabled={isPending || isDeleting}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>

                {/* Brand */}
                <div>
                    <Label htmlFor="brand">
                        Merek <span className="text-red-500">*</span>
                    </Label>
                    <input
                        id="brand"
                        name="brand"
                        type="text"
                        placeholder="Contoh: Toyota"
                        required
                        value={formData.brand}
                        onChange={handleChange}
                        disabled={isPending || isDeleting}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>

                {/* Model */}
                <div>
                    <Label htmlFor="model">
                        Model <span className="text-red-500">*</span>
                    </Label>
                    <input
                        id="model"
                        name="model"
                        type="text"
                        placeholder="Contoh: Avanza"
                        required
                        value={formData.model}
                        onChange={handleChange}
                        disabled={isPending || isDeleting}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>

                {/* GPS ID */}
                <div>
                    <Label htmlFor="gpsid">GPS ID</Label>
                    <Select
                        inputId="gpsid"
                        options={deviceOptions}
                        value={deviceOptions.find((opt) => opt.value === formData.gpsid) || null}
                        onChange={(option) => handleSelectChange(option, "gpsid")}
                        isDisabled={isPending || isDeleting || isDeviceLoading}
                        isClearable
                        placeholder={isDeviceLoading ? "Memuat GPS..." : "Pilih GPS"}
                        classNamePrefix="react-select"
                        styles={{
                            control: (base) => ({
                                ...base,
                                backgroundColor: document.documentElement.classList.contains("dark") ? "#1f2937" : "#ffffff",
                                borderColor: document.documentElement.classList.contains("dark") ? "#4b5563" : "#d1d5db",
                                color: document.documentElement.classList.contains("dark") ? "#ffffff" : "#111827",
                            }),
                            option: (base, state) => ({
                                ...base,
                                backgroundColor: state.isSelected
                                    ? "#3b82f6"
                                    : state.isFocused
                                        ? "#f3f4f6"
                                        : "#ffffff",
                                color: state.isSelected ? "#ffffff" : "#111827",
                            }),
                            menu: (base) => ({
                                ...base,
                                backgroundColor: document.documentElement.classList.contains("dark") ? "#1f2937" : "#ffffff",
                            }),
                        }}
                    />
                    {deviceError && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{deviceError}</p>
                    )}
                </div>

                {/* Type */}
                <div>
                    <Label htmlFor="type">
                        Tipe <span className="text-red-500">*</span>
                    </Label>
                    <input
                        id="type"
                        name="type"
                        type="text"
                        placeholder="Contoh: MPV"
                        required
                        value={formData.type}
                        onChange={handleChange}
                        disabled={isPending || isDeleting}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>

                {/* Year */}
                <div>
                    <Label htmlFor="year">
                        Tahun <span className="text-red-500">*</span>
                    </Label>
                    <input
                        id="year"
                        name="year"
                        type="number"
                        min="1900"
                        max={String(new Date().getFullYear())}
                        required
                        value={formData.year}
                        onChange={handleChange}
                        disabled={isPending || isDeleting}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>

                {/* Color */}
                <div>
                    <Label htmlFor="color">
                        Warna <span className="text-red-500">*</span>
                    </Label>
                    <input
                        id="color"
                        name="color"
                        type="text"
                        placeholder="Contoh: Black"
                        required
                        value={formData.color}
                        onChange={handleChange}
                        disabled={isPending || isDeleting}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>

                {/* STNK */}
                <div>
                    <Label htmlFor="stnk">
                        STNK <span className="text-red-500">*</span>
                    </Label>
                    <input
                        id="stnk"
                        name="stnk"
                        type="text"
                        placeholder="Nomor STNK"
                        required
                        value={formData.stnk}
                        onChange={handleChange}
                        disabled={isPending || isDeleting}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>

                {/* Fuel Type */}
                <div>
                    <Label htmlFor="fueltype">
                        Jenis Bahan Bakar <span className="text-red-500">*</span>
                    </Label>
                    <Select
                        inputId="fueltype"
                        options={fuelOptions}
                        value={fuelOptions.find((opt) => opt.value === formData.fueltype)}
                        onChange={(option) => handleSelectChange(option, "fueltype")}
                        isDisabled={isPending || isDeleting}
                        classNamePrefix="react-select"
                        styles={{
                            control: (base) => ({
                                ...base,
                                backgroundColor: document.documentElement.classList.contains("dark") ? "#1f2937" : "#ffffff",
                                borderColor: document.documentElement.classList.contains("dark") ? "#4b5563" : "#d1d5db",
                                color: document.documentElement.classList.contains("dark") ? "#ffffff" : "#111827",
                            }),
                            option: (base, state) => ({
                                ...base,
                                backgroundColor: state.isSelected
                                    ? "#3b82f6"
                                    : state.isFocused
                                        ? "#f3f4f6"
                                        : "#ffffff",
                                color: state.isSelected ? "#ffffff" : "#111827",
                            }),
                            menu: (base) => ({
                                ...base,
                                backgroundColor: document.documentElement.classList.contains("dark") ? "#1f2937" : "#ffffff",
                            }),
                        }}
                    />
                </div>

                {/* Status */}
                <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                        inputId="status"
                        options={statusOptions}
                        value={statusOptions.find((opt) => opt.value === formData.status)}
                        onChange={(option) => handleSelectChange(option, "status")}
                        isDisabled={isPending || isDeleting}
                        classNamePrefix="react-select"
                        styles={{
                            control: (base) => ({
                                ...base,
                                backgroundColor: document.documentElement.classList.contains("dark") ? "#1f2937" : "#ffffff",
                                borderColor: document.documentElement.classList.contains("dark") ? "#4b5563" : "#d1d5db",
                                color: document.documentElement.classList.contains("dark") ? "#ffffff" : "#111827",
                            }),
                            option: (base, state) => ({
                                ...base,
                                backgroundColor: state.isSelected
                                    ? "#3b82f6"
                                    : state.isFocused
                                        ? "#f3f4f6"
                                        : "#ffffff",
                                color: state.isSelected ? "#ffffff" : "#111827",
                            }),
                            menu: (base) => ({
                                ...base,
                                backgroundColor: document.documentElement.classList.contains("dark") ? "#1f2937" : "#ffffff",
                            }),
                        }}
                    />
                </div>

                {/* Owner */}
                <div>
                    <Label htmlFor="owner">ID Pemilik</Label>
                    <input
                        id="owner"
                        name="owner"
                        type="number"
                        value={formData.owner}
                        onChange={handleChange}
                        disabled={isPending || isDeleting}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>

                {/* Group */}
                <div>
                    <Label htmlFor="groups">ID Grup</Label>
                    <input
                        id="groups"
                        name="groups"
                        type="number"
                        value={formData.groups}
                        onChange={handleChange}
                        disabled={isPending || isDeleting}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>

                {/* Vehicle Type */}
                <div>
                    <Label htmlFor="vehicle_type">Tipe Kendaraan</Label>
                    <input
                        id="vehicle_type"
                        name="vehicle_type"
                        type="number"
                        value={formData.vehicle_type}
                        onChange={handleChange}
                        disabled={isPending || isDeleting}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>

                {/* Valid Date */}
                <div>
                    <Label htmlFor="valid">Tanggal STNK Berlaku</Label>
                    <input
                        id="valid"
                        name="valid"
                        type="date"
                        value={formData.valid}
                        onChange={handleChange}
                        disabled={isPending || isDeleting}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>

                {/* Fuel Tank */}
                <div>
                    <Label htmlFor="fueltank">Kapasitas Tangki Bahan Bakar (L)</Label>
                    <input
                        id="fueltank"
                        name="fueltank"
                        type="number"
                        value={formData.fueltank}
                        onChange={handleChange}
                        disabled={isPending || isDeleting}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>

                {/* Engine */}
                <div>
                    <Label htmlFor="engine">Mesin</Label>
                    <input
                        id="engine"
                        name="engine"
                        type="number"
                        value={formData.engine}
                        onChange={handleChange}
                        disabled={isPending || isDeleting}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>

                {/* Tire */}
                <div>
                    <Label htmlFor="tire">Ban</Label>
                    <input
                        id="tire"
                        name="tire"
                        type="number"
                        value={formData.tire}
                        onChange={handleChange}
                        disabled={isPending || isDeleting}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>

                {/* Capacity */}
                <div>
                    <Label htmlFor="capacity">Kapasitas Penumpang</Label>
                    <input
                        id="capacity"
                        name="capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={handleChange}
                        disabled={isPending || isDeleting}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>

                {/* Speed Limit */}
                <div>
                    <Label htmlFor="speed_limit">Batas Kecepatan (km/h)</Label>
                    <input
                        id="speed_limit"
                        name="speed_limit"
                        type="number"
                        value={formData.speed_limit}
                        onChange={handleChange}
                        disabled={isPending || isDeleting}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>

                {/* Last Service */}
                <div>
                    <Label htmlFor="last_service">Terakhir Service</Label>
                    <input
                        id="last_service"
                        name="last_service"
                        type="date"
                        value={formData.last_service}
                        onChange={handleChange}
                        disabled={isPending || isDeleting}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>

                {/* Last Mileage */}
                <div>
                    <Label htmlFor="last_mileage">Kilometer Terakhir</Label>
                    <input
                        id="last_mileage"
                        name="last_mileage"
                        type="number"
                        value={formData.last_mileage}
                        onChange={handleChange}
                        disabled={isPending || isDeleting}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending || isDeleting}
                    className="px-5 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isDeleting ? "Menghapus..." : "Hapus"}
                </button>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending || isDeleting}
                        className="px-5 py-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isPending || isDeleting}
                        className="px-5 py-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Menyimpan...
                            </>
                        ) : (
                            "Simpan"
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default EditVehicleForm;
