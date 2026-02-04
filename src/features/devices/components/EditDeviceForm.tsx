"use client";

import React, { useState } from "react";
import { DeviceService, type CreateDevicePayload, type Device } from "../services/device.service";
import Label from "@/components/form/Label";

interface EditDeviceFormProps {
    device: Device;
    onSuccess: () => void;
    onClose: () => void;
}

const EditDeviceForm: React.FC<EditDeviceFormProps> = ({ device, onSuccess, onClose }) => {
    const originalId = device.id;
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        id: device.id || "",
        owner: device.owner || "",
        gsm: device.gsm || "",
        plate: device.plate || "",
        timezone: device.timezone || "0.00",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsPending(true);

        try {
            const payload: CreateDevicePayload = {
                id: formData.id,
                owner: formData.owner || undefined,
                gsm: formData.gsm || undefined,
                plate: formData.plate || undefined,
                timezone: formData.timezone || undefined,
            };

            const response = await DeviceService.updateDevice(originalId, payload);
            if (response.success) {
                setSuccess("GPS berhasil diperbarui!");
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 1200);
            } else {
                setError(response.message || "Gagal memperbarui GPS");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="space-y-4">
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

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="id">GPS ID</Label>
                        <input
                            id="id"
                            name="id"
                            type="text"
                            value={formData.id}
                            onChange={handleChange}
                            disabled={isPending}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <Label htmlFor="plate">Plate</Label>
                        <input
                            id="plate"
                            name="plate"
                            type="text"
                            value={formData.plate}
                            onChange={handleChange}
                            disabled={isPending}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <Label htmlFor="gsm">GSM</Label>
                        <input
                            id="gsm"
                            name="gsm"
                            type="text"
                            value={formData.gsm}
                            onChange={handleChange}
                            disabled={isPending}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <Label htmlFor="owner">Owner</Label>
                        <input
                            id="owner"
                            name="owner"
                            type="text"
                            value={formData.owner}
                            onChange={handleChange}
                            disabled={isPending}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <input
                            id="timezone"
                            name="timezone"
                            type="text"
                            value={formData.timezone}
                            onChange={handleChange}
                            disabled={isPending}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                    </div>
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
        </div>
    );
};

export default EditDeviceForm;
