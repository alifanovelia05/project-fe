"use client";

import React, { useEffect, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { VehicleService, Vehicle } from "../services/vehicle.service";
import Modal from "@/components/ui/modal/Modal";
import Pagination from "@/components/tables/Pagination";
import AddVehicleForm from "./AddVehicleForm";
import EditVehicleForm from "./EditVehicleForm";
import AssignGpsForm from "./AssignGpsForm";

const getBrandLogo = (brand: string | undefined): string => {
    const logoMap: { [key: string]: string } = {
        "Mitsubishi": "🔴",
        "Suzuki": "🏮",
        "Yamaha": "🔵",
        "Daihatsu": "🔴",
        "Nissan": "🔴",
        "Toyota": "⭕",
        "Honda": "H",
        "Ford": "🟦",
        "Chevrolet": "⬜",
        "KAISAR": "👑",
        "it.GPS": "📍",
    };
    return logoMap[brand || ""] || "🚗";
};

const VehicleDataTable: React.FC = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<"semua" | "aktif" | "nonaktif">("semua");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAssignGpsModalOpen, setIsAssignGpsModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [assignGpsVehicle, setAssignGpsVehicle] = useState<Vehicle | null>(null);
    const itemsPerPage = 12;

    const fetchVehicles = async () => {
        setIsLoading(true);
        try {
            const response = await VehicleService.getVehicles();
            if (response.success && response.data) {
                setVehicles(response.data);
                setError(null);
            } else {
                setError(response.message || "Gagal mengambil data kendaraan");
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Terjadi kesalahan yang tidak terduga"
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    const getStatusBadgeColor = (status: number) => {
        if (status === 1) return "success";
        if (status === 0) return "error";
        return "warning";
    };

    const getStatusLabel = (status: number) => {
        if (status === 1) return "Aktif";
        if (status === 0) return "Tidak Aktif";
        return "Unknown";
    };

    const filteredVehicles = vehicles.filter((v) => {
        // Filter by status
        if (filterStatus === "aktif" && v.status !== 1) return false;
        if (filterStatus === "nonaktif" && v.status !== 0) return false;

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            return (
                (v.plate?.toLowerCase().includes(query)) ||
                (v.brand?.toLowerCase().includes(query)) ||
                (v.model?.toLowerCase().includes(query)) ||
                (v.type?.toLowerCase().includes(query)) ||
                (v.stnk?.toLowerCase().includes(query))
            );
        }

        return true;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex);

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pages = [];
        const maxPages = 5; // Show max 5 page numbers

        if (totalPages <= maxPages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);

            if (currentPage > 3) {
                pages.push("...");
            }

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) {
                    pages.push(i);
                }
            }

            if (currentPage < totalPages - 2) {
                pages.push("...");
            }

            pages.push(totalPages);
        }

        return pages;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-12">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-brand-200 border-t-brand-500"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Memuat data kendaraan...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-8">
                <div className="text-center">
                    <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                        ❌ Kesalahan Mengambil Data
                    </p>
                    <p className="mt-2 text-red-600 dark:text-red-400 text-sm">
                        {error}
                    </p>
                    <p className="mt-4 text-xs text-gray-600 dark:text-gray-400">
                        Buka console browser (F12) untuk melihat detail error
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium transition-colors"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Daftar Kendaraan</h2>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-brand-600 hover:bg-brand-700 text-white"
                >
                    + Tambah Kendaraan
                </Button>
            </div>

            {/* Filter & Info Section */}
            <div className="space-y-4">
                {/* Search Bar */}
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Cari No. Plat, Merek, Model, atau Type..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setCurrentPage(1);
                            }}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Status Filter */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-linear-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-lg border border-blue-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">{vehicles.length}</span>
                        <span className="text-gray-600 dark:text-gray-400">Total Kendaraan</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {["semua", "aktif", "nonaktif"].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === status
                                    ? "bg-brand-600 text-white shadow-md"
                                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-brand-300"
                                    }`}
                            >
                                {status === "semua" && "Semua"}
                                {status === "aktif" && "✓ Aktif"}
                                {status === "nonaktif" && "✗ Tidak Aktif"}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid Cards Section */}
            {paginatedVehicles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedVehicles.map((vehicle) => (
                        <div
                            key={vehicle.id}
                            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                        >
                            {/* Card Header - Brand Logo */}
                            <div className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center text-2xl font-bold border border-gray-200 dark:border-gray-700 shadow-sm">
                                        {getBrandLogo(vehicle.brand)}
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Brand</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{vehicle.brand || "-"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-4 space-y-3">
                                {/* Plat */}
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {vehicle.plate}
                                    </p>
                                </div>

                                {/* Model */}
                                <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Model</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{vehicle.model || "-"}</p>
                                </div>

                                {/* Type & Year */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Tipe</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{vehicle.type || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Tahun</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{vehicle.year}</p>
                                    </div>
                                </div>

                                {/* GPS ID */}
                                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">GPS ID</p>
                                    <div className="flex items-center gap-2">
                                        <span className="flex-1 text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-900 dark:text-gray-100 truncate">
                                            {vehicle.gpsid || "-"}
                                        </span>
                                        <span className="text-lg text-blue-500">✓</span>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="pt-2 flex items-center justify-between">
                                    {vehicle.gsmvalid ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium">
                                            <span className="text-orange-500">◉</span> GPS
                                        </span>
                                    ) : null}
                                    <Badge color={getStatusBadgeColor(vehicle.status)}>
                                        {getStatusLabel(vehicle.status)}
                                    </Badge>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2">
                                    <button
                                        onClick={() => {
                                            setAssignGpsVehicle(vehicle);
                                            setIsAssignGpsModalOpen(true);
                                        }}
                                        className="w-full px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 font-medium text-sm transition-colors"
                                    >
                                        ➕ Tambah GPS
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedVehicle(vehicle);
                                            setIsEditModalOpen(true);
                                        }}
                                        className="flex-1 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 font-medium text-sm transition-colors"
                                    >
                                        ✏️ Edit
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        Tidak ada data kendaraan
                    </p>
                </div>
            )}

            {/* Pagination Section */}
            {filteredVehicles.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Add Vehicle Modal */}
            <Modal
                isOpen={isAddModalOpen}
                title="Tambah Kendaraan Baru"
                onClose={() => setIsAddModalOpen(false)}
            >
                <AddVehicleForm
                    existingVehicles={vehicles}
                    onSuccess={async () => {
                        await fetchVehicles();
                        setCurrentPage(1);
                    }}
                    onClose={() => setIsAddModalOpen(false)}
                />
            </Modal>

            {/* Edit Vehicle Modal */}
            <Modal
                isOpen={isEditModalOpen}
                title={`Ubah Kendaraan - ${selectedVehicle?.plate}`}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedVehicle(null);
                }}
            >
                {selectedVehicle && (
                    <EditVehicleForm
                        vehicle={selectedVehicle}
                        onSuccess={async () => {
                            await fetchVehicles();
                            setCurrentPage(1);
                        }}
                        onClose={() => {
                            setIsEditModalOpen(false);
                            setSelectedVehicle(null);
                        }}
                        onDelete={async () => {
                            await fetchVehicles();
                            setCurrentPage(1);
                        }}
                    />
                )}
            </Modal>

            {/* Assign GPS Modal */}
            <Modal
                isOpen={isAssignGpsModalOpen}
                title={`Tambah GPS - ${assignGpsVehicle?.plate}`}
                onClose={() => {
                    setIsAssignGpsModalOpen(false);
                    setAssignGpsVehicle(null);
                }}
            >
                {assignGpsVehicle && (
                    <AssignGpsForm
                        vehicle={assignGpsVehicle}
                        onSuccess={async () => {
                            await fetchVehicles();
                            setCurrentPage(1);
                        }}
                        onClose={() => {
                            setIsAssignGpsModalOpen(false);
                            setAssignGpsVehicle(null);
                        }}
                    />
                )}
            </Modal>
        </div>
    );
};

export default VehicleDataTable;
