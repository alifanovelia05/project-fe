"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Pagination from "@/components/tables/Pagination";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { MenuItem, MenuService } from "../services/menu.service";

const normalizeUrl = (value?: string) => {
    if (!value) return "";
    return value.trim().replace(/\s+/g, "");
};

const MenuDataTable: React.FC = () => {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const fetchMenu = async () => {
        setIsLoading(true);
        try {
            const response = await MenuService.getMenu("menu", 1);
            if (response.success && response.data) {
                setItems(response.data);
                setError(null);
            } else {
                setItems([]);
                setError(response.message || "Gagal mengambil data menu");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMenu();
    }, []);

    const filteredItems = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return items;
        return items.filter((item) =>
            [item.id, item.name, item.url]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(query))
        );
    }, [items, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-12">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-brand-200 border-t-brand-500"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Memuat data menu...</p>
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
                        onClick={fetchMenu}
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
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-200">
                        {items.length} Menu
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Cari ID, nama, atau URL"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            className="w-56 bg-transparent text-sm text-gray-700 outline-none dark:text-gray-200"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-full overflow-x-auto">
                <div className="min-w-200">
                    <Table>
                        <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                            <TableRow>
                                {["ID", "Nama Menu", "URL"].map((header) => (
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
                            {filteredItems.length === 0 ? (
                                <TableRow>
                                    <TableCell className="px-5 py-6 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={3}>
                                        Data menu tidak ditemukan.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedItems.map((item) => {
                                    const rawUrl = item.url || "";
                                    const cleanedUrl = normalizeUrl(rawUrl);

                                    return (
                                        <TableRow
                                            key={item.id}
                                            className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/40"
                                        >
                                            <TableCell className="px-5 py-3 text-sm font-semibold text-gray-800 dark:text-white/90">
                                                {item.id}
                                            </TableCell>
                                            <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {item.name?.trim() || "-"}
                                            </TableCell>
                                            <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {cleanedUrl ? (
                                                    <Link
                                                        href={cleanedUrl}
                                                        className="text-brand-600 hover:underline dark:text-brand-300"
                                                    >
                                                        {cleanedUrl}
                                                    </Link>
                                                ) : (
                                                    <span>-</span>
                                                )}
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
                <div className="flex justify-end">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

        </div>
    );
};

export default MenuDataTable;
