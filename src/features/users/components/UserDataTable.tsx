"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { UserService, type User, type CreateUserPayload, type UpdateUserPayload } from "@/features/users/services/user.service";

const getStatusLabel = (status: number) => (status === 1 ? "Aktif" : "Nonaktif");
const getStatusColor = (status: number) => (status === 1 ? "success" : "light");

const getTypeLabel = (type: number) => {
    const types: Record<number, string> = {
        1: "Super Admin",
        2: "Admin",
        3: "Manager",
        4: "Pengguna",
    };

    return types[type] || "Pengguna";
};

const formatDateTime = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
};

// WORKAROUND for backend cache issue
const NEWLY_CREATED_USERS_KEY = "newly_created_users";
const EXPIRY_HOURS = 24; // Keep for 24 hours

const getNewlyCreatedUsers = (): User[] => {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem(NEWLY_CREATED_USERS_KEY);
        if (!stored) return [];

        const data = JSON.parse(stored);
        const now = Date.now();

        // Filter expired entries (older than 24 hours)
        const validUsers = data.filter((item: any) => {
            const age = now - item.timestamp;
            return age < EXPIRY_HOURS * 60 * 60 * 1000;
        });

        // Save back filtered list
        if (validUsers.length !== data.length) {
            localStorage.setItem(NEWLY_CREATED_USERS_KEY, JSON.stringify(validUsers));
        }

        return validUsers.map((item: any) => item.user);
    } catch (e) {
        console.error("Error reading newly created users:", e);
        return [];
    }
};

const addNewlyCreatedUser = (user: User) => {
    if (typeof window === "undefined") return;
    try {
        const existing = getNewlyCreatedUsers();
        const existingData = localStorage.getItem(NEWLY_CREATED_USERS_KEY);
        const parsed = existingData ? JSON.parse(existingData) : [];

        // Add new user with timestamp
        parsed.push({
            user,
            timestamp: Date.now()
        });

        localStorage.setItem(NEWLY_CREATED_USERS_KEY, JSON.stringify(parsed));
        console.log("[UserDataTable] Added user to localStorage cache");
    } catch (e) {
        console.error("Error saving newly created user:", e);
    }
};

const removeNewlyCreatedUser = (username: string) => {
    if (typeof window === "undefined") return;
    try {
        const stored = localStorage.getItem(NEWLY_CREATED_USERS_KEY);
        if (!stored) return;

        const data = JSON.parse(stored);
        const filtered = data.filter((item: any) =>
            item.user.username.toLowerCase() !== username.toLowerCase()
        );

        localStorage.setItem(NEWLY_CREATED_USERS_KEY, JSON.stringify(filtered));
        console.log("[UserDataTable] Removed user from localStorage cache");
    } catch (e) {
        console.error("Error removing newly created user:", e);
    }
};

type UserFormState = {
    username: string;
    email: string;
    name: string;
    password: string;
    confirmPassword: string;
    status: number;
    type: number;
    usergroup: number;
    parent: number;
    group: string;
    menu: string;
};

const UserDataTable: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [formKey, setFormKey] = useState(0);
    const [showAddPassword, setShowAddPassword] = useState(false);
    const [showAddConfirmPassword, setShowAddConfirmPassword] = useState(false);
    const [formState, setFormState] = useState<UserFormState>({
        username: "",
        email: "",
        name: "",
        password: "",
        confirmPassword: "",
        status: 1,
        type: 4,
        usergroup: 4,
        parent: 1,
        group: "0", // Default 0, bukan empty string!
        menu: "",
    });
    const itemsPerPage = 20;

    const fetchUsers = async () => {
        setIsLoading(true);
        console.log("[UserDataTable] Fetching users...");
        try {
            // Cache-Control headers di Axios interceptor akan bypass cache
            const response = await UserService.getUsers();
            console.log("[UserDataTable] Response:", response);

            if (response.success && response.data) {
                console.log("[UserDataTable] Users found:", response.data.length);

                // WORKAROUND: Merge dengan newly created users dari localStorage
                // (karena backend GET /users ada cache issue)
                const newlyCreatedUsers = getNewlyCreatedUsers();
                console.log("[UserDataTable] Newly created users from localStorage:", newlyCreatedUsers.length);

                // Remove duplicates: Prioritas data dari server
                const serverUsernames = new Set(response.data.map(u => u.username.toLowerCase()));
                const uniqueNewUsers = newlyCreatedUsers.filter(u =>
                    !serverUsernames.has(u.username.toLowerCase())
                );

                console.log("[UserDataTable] Unique new users to merge:", uniqueNewUsers.length);

                // Merge: newly created users di atas, server data di bawah
                const mergedUsers = [...uniqueNewUsers, ...response.data];

                setUsers(mergedUsers);
                setError(null);
            } else if (!response.success) {
                console.error("[UserDataTable] Failed:", response.message, response.error);
                setError(response.message || "Gagal mengambil data pengguna");
            } else {
                console.warn("[UserDataTable] No data returned");
                setUsers([]);
                setError(null);
            }
        } catch (err) {
            console.error("[UserDataTable] Error:", err);
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => {
            const aTime = a.registered ? Date.parse(a.registered) : 0;
            const bTime = b.registered ? Date.parse(b.registered) : 0;
            if (aTime !== bTime) return bTime - aTime;
            return a.username.localeCompare(b.username);
        });
    }, [users]);

    const filteredUsers = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
            console.log("[UserDataTable] No search filter, showing all:", sortedUsers.length);
            return sortedUsers;
        }

        const filtered = sortedUsers.filter((user) =>
            [
                user.username,
                user.email,
                user.name,
                String(user.id),
            ]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(query))
        );

        console.log(`[UserDataTable] Search "${query}" - Found ${filtered.length} of ${sortedUsers.length} users`);
        return filtered;
    }, [searchQuery, sortedUsers]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const resetForm = (user?: User | null) => {
        if (user) {
            setFormState({
                username: user.username || "",
                email: user.email || "",
                name: user.name || "",
                password: "",
                confirmPassword: "",
                status: Number(user.status ?? 1),
                type: Number(user.type ?? 4),
                usergroup: Number(user.usergroup ?? 4),
                parent: Number(user.parent ?? 1),
                group: user.group ? String(user.group) : "0", // Default "0" bukan ""
                menu: user.menu ?? "",
            });
        } else {
            setFormState({
                username: "",
                email: "",
                name: "",
                password: "",
                confirmPassword: "",
                status: 1,
                type: 4,
                usergroup: 4,
                parent: 1,
                group: "0", // Default "0" bukan ""
                menu: "",
            });
        }
        setFormKey((prev) => prev + 1);
    };

    const handleCreateUser = async () => {
        if (!formState.email) {
            alert("Email wajib diisi");
            return;
        }

        if (!formState.password) {
            alert("Password wajib diisi");
            return;
        }

        if (formState.confirmPassword && formState.confirmPassword !== formState.password) {
            alert("Konfirmasi password tidak cocok");
            return;
        }

        setIsSubmitting(true);
        try {
            // Convert dan validate payload sebelum kirim
            const groupValue = formState.group ? Number(formState.group) : 0;
            const menuValue = formState.menu.trim() || "";

            const payload: CreateUserPayload = {
                username: formState.username.trim(),
                email: formState.email.trim(),
                name: formState.name.trim(),
                password: formState.password,
                status: formState.status,
                type: formState.type,
                usergroup: formState.usergroup,
                parent: formState.parent,
                group: groupValue, // Convert to number!
                menu: menuValue,
            };

            console.log("[UserDataTable] Creating user with payload:");
            console.table(payload);

            const response = await UserService.createUser(payload);
            console.log("[UserDataTable] Create response:", response);
            console.log("[UserDataTable] Response success:", response.success);
            console.log("[UserDataTable] Response data:", response.data);

            if (response.success) {
                // VERIFY: Cek apakah data benar-benar tersimpan di database
                console.log("[UserDataTable] Verifying user saved in database:", formState.username);

                // Tunggu sebentar untuk backend commit data
                await new Promise(resolve => setTimeout(resolve, 300));

                const verifyResponse = await UserService.getUserByUsername(formState.username);
                console.log("[UserDataTable] Verify response:", verifyResponse);

                if (verifyResponse.success && verifyResponse.data) {
                    // Data BENAR-BENAR tersimpan di database
                    console.log("[UserDataTable] ✅ Data verified in database via ?username query");
                    console.log("[UserDataTable] Adding verified user to state:", verifyResponse.data);

                    setUsers(prev => [verifyResponse.data!, ...prev]);

                    alert("✅ Pengguna berhasil ditambahkan dan tersimpan di database!");

                    setIsAddModalOpen(false);
                    resetForm();
                } else {
                    // POST berhasil tapi data TIDAK ada di database (red flag!)
                    alert("⚠️ Response berhasil tapi data tidak ditemukan di database. Silakan refresh dan cek kembali.");
                    console.error("[UserDataTable] Data not found in database after create!");
                    // Tetap close modal tapi jangan update state
                    setIsAddModalOpen(false);
                    resetForm();
                }
            } else {
                alert(`❌ Gagal menambah pengguna: ${response.message || "Terjadi kesalahan"}`);
            }
        } catch (err) {
            console.error("[UserDataTable] Create user error:", err);
            alert(`❌ ${err instanceof Error ? err.message : "Terjadi kesalahan"}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateUser = async () => {
        if (!selectedUser) return;
        setIsSubmitting(true);
        try {
            // Convert dan validate payload sebelum kirim
            const groupValue = formState.group ? Number(formState.group) : selectedUser.group;

            const payload: UpdateUserPayload = {
                username: formState.username.trim(),
                email: formState.email.trim(),
                name: formState.name.trim(),
                status: formState.status,
                type: formState.type,
                usergroup: formState.usergroup,
                parent: formState.parent,
                group: groupValue, // Convert to number!
                menu: formState.menu.trim(),
            };

            const response = await UserService.updateUser(selectedUser.id, {
                ...payload,
            });
            console.log("[UserDataTable] Update response:", response);

            if (response.success) {
                alert("✅ Pengguna berhasil diperbarui!");

                // Backend cache issue: Update state langsung dari form data
                const updatedUser: User = {
                    ...selectedUser,
                    username: formState.username,
                    email: formState.email,
                    name: formState.name,
                    status: formState.status,
                    type: formState.type,
                    parent: formState.parent,
                    group: Number(formState.group) || selectedUser.group,
                    usergroup: formState.usergroup,
                    menu: formState.menu,
                    // Password tidak disimpan di state (security)
                };

                console.log("[UserDataTable] Updating user in state:", updatedUser);
                setUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));

                setIsEditModalOpen(false);
                setSelectedUser(null);
                resetForm();
            } else {
                alert(`❌ Gagal memperbarui pengguna: ${response.message || "Terjadi kesalahan"}`);
            }
        } catch (err) {
            console.error("[UserDataTable] Update user error:", err);
            alert(`❌ ${err instanceof Error ? err.message : "Terjadi kesalahan"}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (user: User) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus pengguna ${user.username}?`)) {
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await UserService.deleteUser(user.id);
            console.log("[UserDataTable] Delete response:", response);

            if (response.success) {
                alert("✅ Pengguna berhasil dihapus!");
                // Remove dari state langsung (soft delete: status jadi 0)
                console.log("[UserDataTable] Removing user from state:", user.id);
                setUsers(prev => prev.filter(u => u.id !== user.id));
            } else {
                alert(`❌ Gagal menghapus pengguna: ${response.message || "Terjadi kesalahan"}`);
            }
        } catch (err) {
            console.error("[UserDataTable] Delete user error:", err);
            alert(`❌ ${err instanceof Error ? err.message : "Terjadi kesalahan"}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            {error && (
                <p className="text-sm text-error-600 dark:text-error-500">{error}</p>
            )}
            {isLoading && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Memuat data...</p>
            )}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Daftar Pengguna</h2>
                    {!isLoading && users.length > 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Menampilkan {filteredUsers.length} dari {users.length} pengguna
                            {searchQuery && ` (filter: "${searchQuery}")`}
                        </p>
                    )}
                </div>
                <Button
                    onClick={() => {
                        resetForm();
                        setShowAddPassword(false);
                        setShowAddConfirmPassword(false);
                        setIsAddModalOpen(true);
                    }}
                    className="bg-brand-600 hover:bg-brand-700 text-white"
                >
                    + Tambah Pengguna
                </Button>
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    placeholder="Cari username, email, nama..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        ✕
                    </button>
                )}
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="max-w-full overflow-x-auto">
                    <div className="min-w-full text-sm">
                        <Table className="min-w-full text-sm">
                            <TableHeader className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                <TableRow>
                                    <TableCell
                                        isHeader
                                        className="px-4 py-3 text-left font-medium"
                                    >
                                        Nomor
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="px-4 py-3 text-left font-medium"
                                    >
                                        Username
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="px-4 py-3 text-left font-medium"
                                    >
                                        Email
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="px-4 py-3 text-left font-medium"
                                    >
                                        Nama
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="px-4 py-3 text-left font-medium"
                                    >
                                        Status
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="px-4 py-3 text-left font-medium"
                                    >
                                        Tipe
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="px-4 py-3 text-left font-medium"
                                    >
                                        Last Login
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="px-4 py-3 text-left font-medium"
                                    >
                                        Registered
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="px-4 py-3 text-left font-medium"
                                    >
                                        Aksi
                                    </TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                                {filteredUsers.length === 0 && !isLoading ? (
                                    <TableRow>
                                        <TableCell className="px-4 py-6 text-center text-gray-500 dark:text-gray-400" colSpan={9}>
                                            Tidak ada data pengguna.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedUsers.map((user, index) => (
                                        <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <TableCell className="px-4 py-3 text-gray-900 dark:text-gray-100">
                                                {startIndex + index + 1}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                {user.username}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                {user.email}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                {user.name}
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <Badge variant="light" color={getStatusColor(user.status)} size="sm">
                                                    {getStatusLabel(user.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                {getTypeLabel(user.type)}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                {formatDateTime(user.lastlogin)}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                {formatDateTime(user.registered)}
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        resetForm(user);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    className="px-3 py-1 text-xs font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-200"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user)}
                                                    disabled={isSubmitting}
                                                    className="ml-2 px-3 py-1 text-xs font-medium rounded bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/40 dark:text-red-200"
                                                >
                                                    Hapus
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
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

            <Modal
                isOpen={isAddModalOpen}
                title="Tambah Pengguna"
                onClose={() => {
                    setIsAddModalOpen(false);
                    setShowAddPassword(false);
                    setShowAddConfirmPassword(false);
                }}
            >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <Label htmlFor="add-username">Username</Label>
                        <Input
                            key={`add-username-${formKey}`}
                            id="add-username"
                            name="username"
                            placeholder="Masukkan username"
                            defaultValue={formState.username}
                            onChange={(event) =>
                                setFormState((prev) => ({ ...prev, username: event.target.value }))
                            }
                        />
                    </div>
                    <div>
                        <Label htmlFor="add-email">Email</Label>
                        <Input
                            key={`add-email-${formKey}`}
                            id="add-email"
                            name="email"
                            type="email"
                            placeholder="Masukkan email"
                            defaultValue={formState.email}
                            onChange={(event) =>
                                setFormState((prev) => ({ ...prev, email: event.target.value }))
                            }
                        />
                    </div>
                    <div>
                        <Label htmlFor="add-name">Nama</Label>
                        <Input
                            key={`add-name-${formKey}`}
                            id="add-name"
                            name="name"
                            placeholder="Masukkan nama"
                            defaultValue={formState.name}
                            onChange={(event) =>
                                setFormState((prev) => ({ ...prev, name: event.target.value }))
                            }
                        />
                    </div>
                    <div>
                        <Label htmlFor="add-status">Status</Label>
                        <select
                            id="add-status"
                            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                            value={formState.status}
                            onChange={(event) =>
                                setFormState((prev) => ({ ...prev, status: Number(event.target.value) }))
                            }
                        >
                            <option value={1}>Aktif</option>
                            <option value={2}>Nonaktif</option>
                        </select>
                    </div>
                    <div>
                        <Label htmlFor="add-password">Password</Label>
                        <div className="relative">
                            <Input
                                key={`add-password-${formKey}`}
                                id="add-password"
                                name="password"
                                type={showAddPassword ? "text" : "password"}
                                placeholder="Masukkan password"
                                defaultValue={formState.password}
                                onChange={(event) =>
                                    setFormState((prev) => ({ ...prev, password: event.target.value }))
                                }
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowAddPassword((prev) => !prev)}
                                aria-label={showAddPassword ? "Sembunyikan password" : "Lihat password"}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showAddPassword ? (
                                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 3l18 18" />
                                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                                        <path d="M9.9 5.1A10.9 10.9 0 0 1 12 5c5 0 8.7 3.6 10 7-0.4 1-1.1 2.3-2.2 3.5" />
                                        <path d="M6.2 6.2C4.2 7.5 2.8 9.5 2 12c1.3 3.4 5 7 10 7 1.3 0 2.4-0.2 3.5-0.6" />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="add-confirm-password">Konfirmasi Password</Label>
                        <div className="relative">
                            <Input
                                key={`add-confirm-password-${formKey}`}
                                id="add-confirm-password"
                                name="confirmPassword"
                                type={showAddConfirmPassword ? "text" : "password"}
                                placeholder="Ulangi password"
                                defaultValue={formState.confirmPassword}
                                onChange={(event) =>
                                    setFormState((prev) => ({ ...prev, confirmPassword: event.target.value }))
                                }
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowAddConfirmPassword((prev) => !prev)}
                                aria-label={showAddConfirmPassword ? "Sembunyikan konfirmasi password" : "Lihat konfirmasi password"}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showAddConfirmPassword ? (
                                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 3l18 18" />
                                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                                        <path d="M9.9 5.1A10.9 10.9 0 0 1 12 5c5 0 8.7 3.6 10 7-0.4 1-1.1 2.3-2.2 3.5" />
                                        <path d="M6.2 6.2C4.2 7.5 2.8 9.5 2 12c1.3 3.4 5 7 10 7 1.3 0 2.4-0.2 3.5-0.6" />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="add-type">Tipe</Label>
                        <select
                            id="add-type"
                            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                            value={formState.type}
                            onChange={(event) =>
                                setFormState((prev) => ({ ...prev, type: Number(event.target.value) }))
                            }
                        >
                            <option value={1}>Super Admin</option>
                            <option value={2}>Admin</option>
                            <option value={3}>Manager</option>
                            <option value={4}>Pengguna</option>
                        </select>
                    </div>
                    <div>
                        <Label htmlFor="add-usergroup">Usergroup</Label>
                        <Input
                            key={`add-usergroup-${formKey}`}
                            id="add-usergroup"
                            name="usergroup"
                            type="number"
                            placeholder="Masukkan usergroup"
                            defaultValue={formState.usergroup}
                            onChange={(event) =>
                                setFormState((prev) => ({ ...prev, usergroup: Number(event.target.value) }))
                            }
                        />
                    </div>
                    <div>
                        <Label htmlFor="add-parent">Parent</Label>
                        <Input
                            key={`add-parent-${formKey}`}
                            id="add-parent"
                            name="parent"
                            type="number"
                            placeholder="Masukkan parent"
                            defaultValue={formState.parent}
                            onChange={(event) =>
                                setFormState((prev) => ({ ...prev, parent: Number(event.target.value) }))
                            }
                        />
                    </div>
                    <div>
                        <Label htmlFor="add-group">Group</Label>
                        <Input
                            key={`add-group-${formKey}`}
                            id="add-group"
                            name="group"
                            placeholder="Masukkan group"
                            defaultValue={formState.group}
                            onChange={(event) =>
                                setFormState((prev) => ({ ...prev, group: event.target.value }))
                            }
                        />
                    </div>
                    <div>
                        <Label htmlFor="add-menu">Menu</Label>
                        <Input
                            key={`add-menu-${formKey}`}
                            id="add-menu"
                            name="menu"
                            placeholder="Masukkan menu"
                            defaultValue={formState.menu}
                            onChange={(event) =>
                                setFormState((prev) => ({ ...prev, menu: event.target.value }))
                            }
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                        Batal
                    </Button>
                    <Button onClick={handleCreateUser} disabled={isSubmitting}>
                        Simpan
                    </Button>
                </div>
            </Modal>

            <Modal
                isOpen={isEditModalOpen}
                title="Ubah Pengguna"
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                }}
            >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <Label htmlFor="edit-username">Username</Label>
                        <Input
                            key={`edit-username-${formKey}`}
                            id="edit-username"
                            name="username"
                            placeholder="Masukkan username"
                            defaultValue={formState.username}
                            onChange={(event) =>
                                setFormState((prev) => ({ ...prev, username: event.target.value }))
                            }
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-email">Email</Label>
                        <Input
                            key={`edit-email-${formKey}`}
                            id="edit-email"
                            name="email"
                            type="email"
                            placeholder="Masukkan email"
                            defaultValue={formState.email}
                            onChange={(event) =>
                                setFormState((prev) => ({ ...prev, email: event.target.value }))
                            }
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-name">Nama</Label>
                        <Input
                            key={`edit-name-${formKey}`}
                            id="edit-name"
                            name="name"
                            placeholder="Masukkan nama"
                            defaultValue={formState.name}
                            onChange={(event) =>
                                setFormState((prev) => ({ ...prev, name: event.target.value }))
                            }
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-status">Status</Label>
                        <select
                            id="edit-status"
                            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                            value={formState.status}
                            onChange={(event) =>
                                setFormState((prev) => ({ ...prev, status: Number(event.target.value) }))
                            }
                        >
                            <option value={1}>Aktif</option>
                            <option value={2}>Nonaktif</option>
                        </select>
                    </div>
                    <div>
                        <Label htmlFor="edit-type">Tipe</Label>
                        <select
                            id="edit-type"
                            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                            value={formState.type}
                            onChange={(event) =>
                                setFormState((prev) => ({ ...prev, type: Number(event.target.value) }))
                            }
                        >
                            <option value={1}>Super Admin</option>
                            <option value={2}>Admin</option>
                            <option value={3}>Manager</option>
                            <option value={4}>Pengguna</option>
                        </select>
                    </div>
                    <div>
                        <Label htmlFor="edit-usergroup">Usergroup</Label>
                        <Input
                            key={`edit-usergroup-${formKey}`}
                            id="edit-usergroup"
                            name="usergroup"
                            type="number"
                            placeholder="Masukkan usergroup"
                            defaultValue={formState.usergroup}
                            onChange={(event) =>
                                setFormState((prev) => ({ ...prev, usergroup: Number(event.target.value) }))
                            }
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-parent">Parent</Label>
                        <Input
                            key={`edit-parent-${formKey}`}
                            id="edit-parent"
                            name="parent"
                            type="number"
                            placeholder="Masukkan parent"
                            defaultValue={formState.parent}
                            onChange={(event) =>
                                setFormState((prev) => ({ ...prev, parent: Number(event.target.value) }))
                            }
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-group">Group</Label>
                        <Input
                            key={`edit-group-${formKey}`}
                            id="edit-group"
                            name="group"
                            placeholder="Masukkan group"
                            defaultValue={formState.group}
                            onChange={(event) =>
                                setFormState((prev) => ({ ...prev, group: event.target.value }))
                            }
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-menu">Menu</Label>
                        <Input
                            key={`edit-menu-${formKey}`}
                            id="edit-menu"
                            name="menu"
                            placeholder="Masukkan menu"
                            defaultValue={formState.menu}
                            onChange={(event) =>
                                setFormState((prev) => ({ ...prev, menu: event.target.value }))
                            }
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                        Batal
                    </Button>
                    <Button onClick={handleUpdateUser} disabled={isSubmitting}>
                        Simpan Perubahan
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default UserDataTable;
