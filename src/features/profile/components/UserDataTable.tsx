"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { UserService, type User } from "../services/user.service";

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

type UserFormState = {
    username: string;
    email: string;
    name: string;
    status: number;
    type: number;
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
    const [formState, setFormState] = useState<UserFormState>({
        username: "",
        email: "",
        name: "",
        status: 1,
        type: 4,
    });
    const itemsPerPage = 20;

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await UserService.getUsers();
            if (response.success && response.data && response.data.length > 0) {
                setUsers(response.data);
                setError(null);
            } else if (!response.success) {
                setError(response.message || "Gagal mengambil data pengguna");
            }
        } catch (err) {
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
        if (!query) return sortedUsers;

        return sortedUsers.filter((user) =>
            [
                user.username,
                user.email,
                user.name,
                String(user.id),
            ]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(query))
        );
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
                status: Number(user.status ?? 1),
                type: Number(user.type ?? 4),
            });
        } else {
            setFormState({
                username: "",
                email: "",
                name: "",
                status: 1,
                type: 4,
            });
        }
        setFormKey((prev) => prev + 1);
    };

    const handleCreateUser = async () => {
        setIsSubmitting(true);
        try {
            const response = await UserService.createUser({
                ...formState,
                parent: 0,
                group: 0,
                menu: "",
            });

            if (response.success) {
                setIsAddModalOpen(false);
                resetForm();
                await fetchUsers();
            } else {
                alert(response.message || "Gagal menambah pengguna");
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateUser = async () => {
        if (!selectedUser) return;
        setIsSubmitting(true);
        try {
            const response = await UserService.updateUser(selectedUser.id, {
                ...formState,
                parent: selectedUser.parent ?? 0,
                group: selectedUser.group ?? 0,
                menu: selectedUser.menu ?? "",
            });

            if (response.success) {
                setIsEditModalOpen(false);
                setSelectedUser(null);
                resetForm();
                await fetchUsers();
            } else {
                alert(response.message || "Gagal memperbarui pengguna");
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : "Terjadi kesalahan");
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
            if (response.success) {
                await fetchUsers();
            } else {
                alert(response.message || "Gagal menghapus pengguna");
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : "Terjadi kesalahan");
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Daftar Pengguna</h2>
                <Button
                    onClick={() => {
                        resetForm();
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
                onClose={() => setIsAddModalOpen(false)}
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
                            <option value={0}>Nonaktif</option>
                        </select>
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
                            <option value={0}>Nonaktif</option>
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
