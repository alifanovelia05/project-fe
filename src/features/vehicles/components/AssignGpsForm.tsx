"use client";

import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import Label from "@/components/form/Label";
import { DeviceService, type Device } from "@/features/devices/services/device.service";
import type { Vehicle } from "../services/vehicle.service";

interface AssignGpsFormProps {
    vehicle: Vehicle;
    onSuccess: () => void;
    onClose: () => void;
}

const AssignGpsForm: React.FC<AssignGpsFormProps> = ({ vehicle, onSuccess, onClose }) => {
    const RECENT_DEVICE_IDS_KEY = "recent_device_ids";
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [deviceError, setDeviceError] = useState<string | null>(null);
    const [isDeviceLoading, setIsDeviceLoading] = useState(false);
    const [devices, setDevices] = useState<Device[]>([]);
    const [selectedGpsIds, setSelectedGpsIds] = useState<string[]>([]);

    const loadDevices = async () => {
        setIsDeviceLoading(true);
        setDeviceError(null);
        try {
            const response = await DeviceService.getDevices();
            if (response.success && response.data) {
                const baseDevices = response.data;
                const extraDevices = await fetchMissingRecentDevices(baseDevices);
                setDevices(mergeDeviceLists(baseDevices, extraDevices));
            } else {
                setDeviceError(response.message || "Gagal mengambil data GPS");
            }
        } catch (err) {
            setDeviceError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsDeviceLoading(false);
        }
    };

    const readRecentDeviceIds = (): string[] => {
        if (typeof window === "undefined") return [];
        try {
            const raw = localStorage.getItem(RECENT_DEVICE_IDS_KEY);
            const list = raw ? (JSON.parse(raw) as string[]) : [];
            return Array.isArray(list) ? list.filter(Boolean) : [];
        } catch {
            return [];
        }
    };

    const writeRecentDeviceIds = (ids: string[]) => {
        if (typeof window === "undefined") return;
        try {
            localStorage.setItem(RECENT_DEVICE_IDS_KEY, JSON.stringify(ids));
        } catch {
            // ignore storage errors
        }
    };

    const storeRecentDeviceId = (id: string) => {
        const list = readRecentDeviceIds();
        const next = [id, ...list.filter((item) => item !== id)].slice(0, 10);
        writeRecentDeviceIds(next);
    };

    const mergeDeviceLists = (base: Device[], extra: Device[]) => {
        const map = new Map(base.map((device) => [device.id, device]));
        extra.forEach((device) => {
            if (device?.id) {
                map.set(device.id, device);
            }
        });
        return Array.from(map.values());
    };

    const fetchMissingRecentDevices = async (base: Device[]) => {
        const recentIds = readRecentDeviceIds();
        if (recentIds.length === 0) return [] as Device[];

        const missingIds = recentIds.filter((id) => !base.some((d) => d.id === id));
        if (missingIds.length === 0) return [] as Device[];

        const responses = await Promise.all(
            missingIds.map((id) => DeviceService.getDeviceById(id))
        );

        const extraDevices = responses.flatMap((response) =>
            response.success && response.data ? response.data : []
        );

        const foundIds = new Set(extraDevices.map((device) => device.id));
        const baseIds = new Set(base.map((device) => device.id));
        const nextRecentIds = recentIds.filter((id) => foundIds.has(id) || baseIds.has(id));
        if (nextRecentIds.length !== recentIds.length) {
            writeRecentDeviceIds(nextRecentIds);
        }

        return extraDevices;
    };

    useEffect(() => {
        loadDevices();
    }, [vehicle.gpsid]);

    useEffect(() => {
        if (!vehicle.gpsid) return;
        setSelectedGpsIds((prev) => {
            if (prev.length > 0) return prev;
            return [vehicle.gpsid];
        });
    }, [vehicle.gpsid]);

    const deviceOptions = useMemo(() => {
        const options = devices.map((device) => ({
            value: device.id,
            label: device.plate ? `${device.plate} — ${device.id}` : device.id,
            plate: device.plate,
        }));

        if (vehicle.gpsid && !options.some((opt) => opt.value === vehicle.gpsid)) {
            options.unshift({
                value: vehicle.gpsid,
                label: `${vehicle.plate} — ${vehicle.gpsid}`,
                plate: vehicle.plate,
            });
        }

        return options;
    }, [devices, vehicle.gpsid, vehicle.plate]);

    const handleSelectChange = (option: any) => {
        const values = Array.isArray(option) ? option.map((item) => item.value) : [];
        setSelectedGpsIds(values);
    };


    const assignGpsToVehicle = async (plate: string, gpsIds: string[]) => {
        if (!plate || gpsIds.length === 0) return [] as string[];

        const results = await Promise.allSettled(
            gpsIds.map((gpsId) =>
                DeviceService.updateDevice(gpsId, {
                    id: gpsId,
                    owner: devices.find((device) => device.id === gpsId)?.owner,
                    gsm: devices.find((device) => device.id === gpsId)?.gsm,
                    plate,
                    timezone: devices.find((device) => device.id === gpsId)?.timezone,
                    registered: devices.find((device) => device.id === gpsId)?.registered,
                })
            )
        );

        const failedIds: string[] = [];
        results.forEach((result, index) => {
            if (result.status === "rejected") {
                failedIds.push(gpsIds[index]);
                return;
            }

            if (!result.value.success) {
                failedIds.push(gpsIds[index]);
            }
        });

        return failedIds;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (selectedGpsIds.length === 0) {
            setError("Pilih minimal 1 GPS untuk di-assign.");
            return;
        }

        setIsPending(true);

        try {
            const failedGpsIds = await assignGpsToVehicle(vehicle.plate, selectedGpsIds);
            if (failedGpsIds.length > 0) {
                setError(`Sebagian GPS gagal di-assign: ${failedGpsIds.join(", ")}`);
            } else {
                setSuccess("GPS berhasil di-assign ke kendaraan!");
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 1200);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {success && (
                <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 dark:bg-green-500/10 dark:border-green-500/20">
                    <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
                </div>
            )}

            <div>
                <Label htmlFor="gpsids">Pilih GPS (bisa lebih dari 1)</Label>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Sync terbaru jika GPS baru belum muncul</span>
                    <button
                        type="button"
                        onClick={loadDevices}
                        disabled={isDeviceLoading}
                        className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                    >
                        {isDeviceLoading ? "Syncing..." : "Sync GPS terbaru"}
                    </button>
                </div>
                <Select
                    inputId="gpsids"
                    options={deviceOptions}
                    value={deviceOptions.filter((opt) => selectedGpsIds.includes(opt.value))}
                    onChange={handleSelectChange}
                    isDisabled={isPending || isDeviceLoading}
                    isMulti
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

            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                    disabled={isPending}
                >
                    Batal
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 rounded bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
                    disabled={isPending}
                >
                    {isPending ? "Menyimpan..." : "Simpan"}
                </button>
            </div>
        </form>
    );
};

export default AssignGpsForm;
