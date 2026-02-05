"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DeviceService, type Device } from "../services/device.service";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import AddDeviceForm from "./AddDeviceForm";
import EditDeviceForm from "./EditDeviceForm";

const DeviceDataTable: React.FC = () => {
    const RECENT_DEVICE_IDS_KEY = "recent_device_ids";
    const [devices, setDevices] = useState<Device[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isSearching, setIsSearching] = useState(false);
    const [searchHint, setSearchHint] = useState<string | null>(null);
    const itemsPerPage = 15;

    const storeRecentDeviceId = (id: string) => {
        if (typeof window === "undefined") return;
        try {
            const raw = localStorage.getItem(RECENT_DEVICE_IDS_KEY);
            const list = raw ? (JSON.parse(raw) as string[]) : [];
            const next = [id, ...list.filter((item) => item !== id)].slice(0, 10);
            localStorage.setItem(RECENT_DEVICE_IDS_KEY, JSON.stringify(next));
        } catch {
            // ignore storage errors
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

        return responses.flatMap((response) =>
            response.success && response.data ? response.data : []
        );
    };

    const fetchDevices = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await DeviceService.getDevices();
            if (response.success && response.data) {
                const baseDevices = response.data;
                const extraDevices = await fetchMissingRecentDevices(baseDevices);
                setDevices(mergeDeviceLists(baseDevices, extraDevices));
            } else {
                setError(response.message || "Gagal mengambil data device");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDevices();
    }, []);

    useEffect(() => {
        const query = searchQuery.trim();
        if (!query) {
            setSearchHint(null);
            return;
        }

        const isNumeric = /^[0-9]+$/.test(query);
        if (isNumeric && query.length < 15) {
            setSearchHint("Masukkan 15 digit GPS ID untuk pencarian server.");
            return;
        }

        setSearchHint(null);

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const response = await DeviceService.getDeviceById(query);
                if (response.success && response.data && response.data.length > 0) {
                    response.data.forEach((device) => {
                        if (device?.id) storeRecentDeviceId(device.id);
                    });
                    setDevices((prev) => {
                        const map = new Map(prev.map((d) => [d.id, d]));
                        response.data?.forEach((device) => {
                            if (device?.id) {
                                map.set(device.id, device);
                            }
                        });
                        return Array.from(map.values());
                    });
                }
            } finally {
                setIsSearching(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const sortedDevices = useMemo(() => {
        return [...devices].sort((a, b) => {
            const aTime = a.registered ? Date.parse(a.registered) : 0;
            const bTime = b.registered ? Date.parse(b.registered) : 0;

            if (aTime !== bTime) return bTime - aTime;

            return (b.id || "").localeCompare(a.id || "");
        });
    }, [devices]);

    const filteredDevices = useMemo(() => {
        if (!searchQuery) return sortedDevices;
        const q = searchQuery.toLowerCase();
        return sortedDevices.filter((d) =>
            (d.id || "").toLowerCase().includes(q) ||
            (d.plate || "").toLowerCase().includes(q) ||
            (d.gsm || "").toLowerCase().includes(q) ||
            (d.owner || "").toLowerCase().includes(q)
        );
    }, [sortedDevices, searchQuery]);

    const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDevices = filteredDevices.slice(startIndex, endIndex);

    const getPageNumbers = () => {
        const pages: Array<number | string> = [];
        const maxPages = 5;

        if (totalPages <= maxPages) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);

            if (currentPage > 3) pages.push("...");

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }

            if (currentPage < totalPages - 2) pages.push("...");

            pages.push(totalPages);
        }

        return pages;
    };

    const handleDelete = async (device: Device) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus GPS ${device.id}?`)) {
            return;
        }

        setDeletingId(device.id);
        try {
            const response = await DeviceService.deleteDevice(device.id);
            if (response.success) {
                await fetchDevices();
            } else {
                alert(response.message || "Gagal menghapus GPS");
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setDeletingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 text-center text-gray-600 dark:text-gray-400">Memuat data GPS...</div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-6">
                <div className="text-center">
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">❌ Gagal mengambil data GPS</p>
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
                    <button
                        onClick={fetchDevices}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium transition-colors"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Daftar GPS</h2>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-brand-600 hover:bg-brand-700 text-white"
                >
                    + Tambah GPS
                </Button>
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    placeholder="Cari ID, Plate, GSM, atau Owner..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                {isSearching && (
                    <span className="text-xs text-gray-400">Mencari...</span>
                )}
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        ✕
                    </button>
                )}
            </div>
            {searchHint && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{searchHint}</p>
            )}

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium">GPS ID (IMEI)</th>
                            <th className="px-4 py-3 text-left font-medium">Plate</th>
                            <th className="px-4 py-3 text-left font-medium">GSM</th>
                            <th className="px-4 py-3 text-left font-medium">Owner</th>
                            <th className="px-4 py-3 text-left font-medium">Registered</th>
                            <th className="px-4 py-3 text-left font-medium">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                        {filteredDevices.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                                    Tidak ada data GPS.
                                </td>
                            </tr>
                        ) : (
                            paginatedDevices.map((device) => (
                                <tr key={device.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-4 py-3 font-mono text-gray-900 dark:text-gray-100">{device.id}</td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{device.plate || "-"}</td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{device.gsm || "-"}</td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{device.owner || "-"}</td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                        {device.registered ? new Date(device.registered).toLocaleString("id-ID") : "-"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => {
                                                setSelectedDevice(device);
                                                setIsEditModalOpen(true);
                                            }}
                                            className="px-3 py-1 text-xs font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-200"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(device)}
                                            disabled={deletingId === device.id}
                                            className="ml-2 px-3 py-1 text-xs font-medium rounded bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/40 dark:text-red-200"
                                        >
                                            {deletingId === device.id ? "Menghapus..." : "Hapus"}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {filteredDevices.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg border transition-all ${currentPage === 1
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border-gray-200 dark:border-gray-700"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                    >
                        ←
                    </button>

                    {getPageNumbers().map((page, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                if (typeof page === "number") setCurrentPage(page);
                            }}
                            disabled={page === "..."}
                            className={`w-10 h-10 rounded-lg transition-all font-medium ${page === currentPage
                                ? "bg-blue-600 text-white shadow-lg"
                                : page === "..."
                                    ? "text-gray-500 dark:text-gray-400 cursor-default"
                                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                }`}
                        >
                            {page}
                        </button>
                    ))}

                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-lg border transition-all ${currentPage === totalPages
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border-gray-200 dark:border-gray-700"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                    >
                        →
                    </button>
                </div>
            )}

            <Modal
                isOpen={isAddModalOpen}
                title="Tambah GPS"
                onClose={() => setIsAddModalOpen(false)}
            >
                <AddDeviceForm
                    existingDevices={devices}
                    onSuccess={async (created) => {
                        if (created) {
                            setDevices((prev) => mergeDeviceLists(prev, [created]));
                            setCurrentPage(1);
                            return;
                        }
                        await fetchDevices();
                        setCurrentPage(1);
                    }}
                    onClose={() => setIsAddModalOpen(false)}
                />
            </Modal>

            <Modal
                isOpen={isEditModalOpen}
                title={`Ubah GPS - ${selectedDevice?.id}`}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedDevice(null);
                }}
            >
                {selectedDevice && (
                    <EditDeviceForm
                        device={selectedDevice}
                        onSuccess={async () => {
                            await fetchDevices();
                        }}
                        onClose={() => {
                            setIsEditModalOpen(false);
                            setSelectedDevice(null);
                        }}
                    />
                )}
            </Modal>
        </div>
    );
};

export default DeviceDataTable;
