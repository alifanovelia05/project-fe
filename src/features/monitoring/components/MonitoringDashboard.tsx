"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/tables/Pagination";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { MonitoringItem, MonitoringService } from "../services/monitoring.service";

const MonitoringMap = dynamic(() => import("./MonitoringMap"), { ssr: false });

const statusPalette: Record<string, { label: string; color: string; dot: string }> = {
    Parkir: { label: "Parkir", color: "bg-gray-500", dot: "text-gray-500" },
    Jalan: { label: "Jalan", color: "bg-blue-500", dot: "text-blue-500" },
    Diam: { label: "Diam", color: "bg-amber-500", dot: "text-amber-500" },
    Bahaya: { label: "Bahaya", color: "bg-red-500", dot: "text-red-500" },
    Kejadian: { label: "Kejadian", color: "bg-orange-500", dot: "text-orange-500" },
    SOS: { label: "Panggilan SOS", color: "bg-rose-600", dot: "text-rose-600" },
    Hilang: { label: "Hilang", color: "bg-purple-600", dot: "text-purple-600" },
};

const formatNumber = (value?: number, suffix = "") => {
    if (!Number.isFinite(value)) return "-";
    return `${new Intl.NumberFormat("id-ID").format(value || 0)}${suffix}`;
};

const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
};

const getEngineState = (item: MonitoringItem) => {
    if (typeof item.additional?.accel === "number") {
        return item.additional.accel > 0 ? "ON" : "OFF";
    }
    if (item.input && item.input.length > 0) {
        return item.input[0] === "1" ? "ON" : "OFF";
    }
    if ((item.speed || 0) > 0) return "ON";
    return "OFF";
};

const getStatus = (item: MonitoringItem) => {
    if (item.alert === 3) return "SOS";
    if (item.alert === 4) return "Hilang";
    if (item.alert === 2) return "Kejadian";
    if (item.alert === 1) return "Bahaya";
    if ((item.speed || 0) > 0) return "Jalan";
    if (getEngineState(item) === "ON") return "Diam";
    return "Parkir";
};

const MonitoringDashboard: React.FC = () => {
    const [items, setItems] = useState<MonitoringItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchMonitoring = async () => {
            setIsLoading(true);
            try {
                const response = await MonitoringService.getMonitoring();
                if (response.success && response.data) {
                    setItems(response.data);
                    setSelectedId(response.data[0]?.id ?? null);
                    setError(null);
                } else {
                    setError(response.message || "Gagal mengambil data monitoring");
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Terjadi kesalahan");
            } finally {
                setIsLoading(false);
            }
        };

        fetchMonitoring();
    }, []);

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items;
        const query = searchQuery.toLowerCase();
        return items.filter((item) => {
            return (
                item.plate?.toLowerCase().includes(query) ||
                item.lokasi?.toLowerCase().includes(query) ||
                item.id?.toLowerCase().includes(query)
            );
        });
    }, [items, searchQuery]);

    const statusFilteredItems = useMemo(() => {
        if (!selectedStatus) return filteredItems;
        return filteredItems.filter((item) => getStatus(item) === selectedStatus);
    }, [filteredItems, selectedStatus]);

    const totalPages = Math.max(1, Math.ceil(statusFilteredItems.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = statusFilteredItems.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedStatus]);

    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = {
            Parkir: 0,
            Jalan: 0,
            Diam: 0,
            Bahaya: 0,
            Kejadian: 0,
            SOS: 0,
            Hilang: 0,
        };

        items.forEach((item) => {
            const status = getStatus(item);
            counts[status] = (counts[status] || 0) + 1;
        });

        return counts;
    }, [items]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-12">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-brand-200 border-t-brand-500"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Memuat data monitoring...</p>
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
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
                <div className="border-b border-gray-100 dark:border-gray-800 px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Peta Monitoring</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Posisi kendaraan terakhir berdasarkan GPS
                            </p>
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            <span className="font-semibold">{items.length}</span>
                            <span>Kendaraan</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-4 p-4">
                    <div className="h-[60vh] md:h-[520px] lg:h-[620px] xl:h-[720px] w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                        <MonitoringMap
                            items={statusFilteredItems}
                            selectedId={selectedId}
                            onSelect={(item) => setSelectedId(item.id)}
                        />
                    </div>
                    <div className="w-full">
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900/40">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Status Kendaraan</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Klik untuk filter data</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedStatus(null)}
                                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${!selectedStatus
                                        ? "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200"
                                        : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"}`}
                                >
                                    <span>Semua</span>
                                    <span className="rounded-full bg-gray-900/5 px-2 py-0.5 text-gray-700 dark:bg-white/10 dark:text-gray-200">
                                        {items.length}
                                    </span>
                                </button>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                {Object.keys(statusPalette).map((statusKey) => {
                                    const palette = statusPalette[statusKey];
                                    const isActive = selectedStatus === statusKey;
                                    return (
                                        <button
                                            key={statusKey}
                                            type="button"
                                            onClick={() =>
                                                setSelectedStatus((prev) => (prev === statusKey ? null : statusKey))
                                            }
                                            className={`group flex items-center justify-between gap-2 rounded-xl border px-3 py-3 text-left transition-all ${isActive
                                                ? "border-brand-200 bg-brand-50 shadow-sm dark:border-brand-500/30 dark:bg-brand-500/10"
                                                : "border-gray-200 bg-gray-50/40 hover:bg-white hover:shadow-sm dark:border-gray-700 dark:bg-gray-900/30 dark:hover:bg-gray-900/60"}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`h-2.5 w-2.5 rounded-full ${palette.color}`}></span>
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                                                    {palette.label}
                                                </span>
                                            </div>
                                            <span className={`text-sm font-semibold ${isActive
                                                ? "text-brand-700 dark:text-brand-200"
                                                : "text-gray-800 dark:text-gray-100"}`}>
                                                {statusCounts[statusKey] ?? 0}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
                <div className="border-b border-gray-100 dark:border-gray-800 px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Daftar Monitoring</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Data GPS terbaru untuk setiap kendaraan
                            </p>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Cari plat, lokasi, atau ID"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                className="w-56 bg-transparent text-sm text-gray-700 outline-none dark:text-gray-200"
                            />
                        </div>
                    </div>
                </div>
                <div className="max-w-full overflow-x-auto">
                    <div className="min-w-[1200px]">
                        <Table>
                            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                                <TableRow>
                                    {[
                                        "Plat",
                                        "Waktu GPS",
                                        "Mesin",
                                        "Status",
                                        "Laju",
                                        "GPS",
                                        "GSM",
                                        "GPS BATT",
                                        "Mileage",
                                        "Lokasi",
                                    ].map((header) => (
                                        <TableCell
                                            key={header}
                                            isHeader
                                            className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                                        >
                                            {header}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {statusFilteredItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell className="px-5 py-6 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={10}>
                                            Data monitoring tidak ditemukan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedItems.map((item, index) => {
                                        const status = getStatus(item);
                                        const palette = statusPalette[status] ?? statusPalette.Parkir;
                                        const engineState = getEngineState(item);

                                        return (
                                            <TableRow
                                                key={`${item.id}-${item.waktu ?? ""}-${index}`}
                                                className={`transition-colors ${selectedId === item.id
                                                    ? "bg-brand-50/60 dark:bg-brand-500/10"
                                                    : "hover:bg-gray-50 dark:hover:bg-gray-900/40"}`}
                                                onClick={() => setSelectedId(item.id)}
                                            >
                                                <TableCell className="px-5 py-3 text-sm font-semibold text-gray-800 dark:text-white/90">
                                                    {item.plate || item.id}
                                                </TableCell>
                                                <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                    {formatDate(item.waktu)}
                                                </TableCell>
                                                <TableCell className="px-5 py-3 text-sm">
                                                    <Badge color={engineState === "ON" ? "success" : "error"}>
                                                        {engineState}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`h-2 w-2 rounded-full ${palette.color}`}></span>
                                                        <span>{palette.label}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                    {formatNumber(item.speed, " km/h")}
                                                </TableCell>
                                                <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                    {formatNumber(item.satelit)}
                                                </TableCell>
                                                <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                    {item.additional?.gsm?.name || formatNumber(item.additional?.signal)}
                                                </TableCell>
                                                <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                    {item.additional?.batt || "-"}
                                                </TableCell>
                                                <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                    {formatNumber(item.mileage, " km")}
                                                </TableCell>
                                                <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                    {item.lokasi || "-"}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                {totalPages > 1 && (
                    <div className="flex justify-end px-5 py-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MonitoringDashboard;
