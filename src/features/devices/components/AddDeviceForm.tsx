"use client";

import React, { useState } from "react";
import { DeviceService, type CreateDevicePayload, type Device } from "../services/device.service";
import Label from "@/components/form/Label";

interface AddDeviceFormProps {
    onSuccess: () => void;
    onClose: () => void;
    existingDevices: Device[];
}

const AddDeviceForm: React.FC<AddDeviceFormProps> = ({ onSuccess, onClose, existingDevices }) => {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        id: "",
        owner: "",
        gsm: "",
        plate: "",
        timezone: "0.00",
        registered: new Date().toISOString(),
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

        const idExists = existingDevices.some((d) => d.id === formData.id);
        if (idExists) {
            setError(`GPS ID "${formData.id}" sudah terdaftar.`);
            return;
        }

        setIsPending(true);
        try {
            const payload: CreateDevicePayload = {
                id: formData.id,
                owner: formData.owner || undefined,
                gsm: formData.gsm || undefined,
                plate: formData.plate || undefined,
                timezone: formData.timezone,
                registered: formData.registered,
            };

            const response = await DeviceService.createDevice(payload);
            if (response.success) {
                setSuccess("GPS berhasil ditambahkan!");
                setFormData({
                    id: "",
                    owner: "",
                    gsm: "",
                    plate: "",
                    registered: new Date().toISOString(),
                    timezone: "0.00",
                });
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 1200);
            } else {
                setError(response.message || "Gagal menambahkan GPS");
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

            <div className="grid grid-cols-2 gap-4">
                <input id="registered" name="registered" type="hidden" value={formData.registered} />
                <input id="timezone" name="timezone" type="hidden" value={formData.timezone} />
                <div>
                    <Label htmlFor="id">
                        GPS ID (IMEI) <span className="text-red-500">*</span>
                    </Label>
                    <input
                        id="id"
                        name="id"
                        type="text"
                        required
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

export default AddDeviceForm;
