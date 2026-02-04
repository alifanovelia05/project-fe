"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { ActionResult } from "@/types";
import { registerAction } from "@/lib/actions/auth.actions";

export default function SignUpForm() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [state, setState] = useState<ActionResult | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsPending(true);
        setState(null);

        const formData = new FormData(e.currentTarget);
        const fname = formData.get("fname") as string;
        const lname = formData.get("lname") as string;
        const username = formData.get("username") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        // 1. Validasi Basic di Sisi Client
        if (
            !fname ||
            !lname ||
            !username ||
            !email ||
            !password ||
            !confirmPassword
        ) {
            setState({
                success: false,
                errorTitle: "Validasi Gagal",
                errorDesc: "Semua kolom harus diisi.",
            });
            setIsPending(false);
            return;
        }

        if (password !== confirmPassword) {
            setState({
                success: false,
                errorTitle: "Validasi Gagal",
                errorDesc: "Password dan konfirmasi password tidak cocok.",
            });
            setIsPending(false);
            return;
        }

        const result = await registerAction({
            username,
            email,
            password,
            password2: confirmPassword,
            realname: `${fname} ${lname}`,
        });

        setState(result);
        setIsPending(false);

        if (result.success) {
            setTimeout(() => {
                router.push("/signin");
            }, 2000);
        }
    }

    return (
        <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
            <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
                <div>
                    <div className="mb-5 sm:mb-8">
                        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                            Sign Up
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Lengkapi data berikut untuk membuat akun admin baru!
                        </p>
                    </div>
                    <div>
                        {/* Error Alert */}
                        {state && !state.success && state.errorTitle && (
                            <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20">
                                <h4 className="text-sm font-medium text-red-600 dark:text-red-400">
                                    {state.errorTitle}
                                </h4>
                                <p className="mt-1 text-sm text-red-500 dark:text-red-300">
                                    {state.errorDesc}
                                </p>
                            </div>
                        )}

                        {/* Success Alert */}
                        {state?.success && state.successTitle && (
                            <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 dark:bg-green-500/10 dark:border-green-500/20">
                                <h4 className="text-sm font-medium text-green-600 dark:text-green-400">
                                    {state.successTitle}
                                </h4>
                                <p className="mt-1 text-sm text-green-500 dark:text-green-300">
                                    {state.successDesc}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    {/* First Name */}
                                    <div className="sm:col-span-1">
                                        <Label htmlFor="fname">
                                            Nama Depan<span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            type="text"
                                            id="fname"
                                            name="fname"
                                            placeholder="Masukkan nama depan"
                                            required
                                            disabled={isPending}
                                        />
                                    </div>
                                    {/* Last Name */}
                                    <div className="sm:col-span-1">
                                        <Label htmlFor="lname">
                                            Nama Belakang<span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            type="text"
                                            id="lname"
                                            name="lname"
                                            placeholder="Masukkan nama belakang"
                                            required
                                            disabled={isPending}
                                        />
                                    </div>
                                </div>

                                {/* Username */}
                                <div>
                                    <Label htmlFor="username">
                                        Username<span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        id="username"
                                        name="username"
                                        placeholder="Masukkan username"
                                        required
                                        disabled={isPending}
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <Label htmlFor="email">
                                        Email<span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="email"
                                        id="email"
                                        name="email"
                                        placeholder="Masukkan email"
                                        required
                                        disabled={isPending}
                                    />
                                </div>

                                {/* Password */}
                                <div>
                                    <Label htmlFor="password">
                                        Password<span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            name="password"
                                            placeholder="Masukkan password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            disabled={isPending}
                                        />
                                        <span
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                                        >
                                            {showPassword ? (
                                                <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                                            ) : (
                                                <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <Label htmlFor="confirmPassword">
                                        Konfirmasi Password<span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            placeholder="Ulangi password"
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            disabled={isPending}
                                        />
                                        <span
                                            onClick={() =>
                                                setShowConfirmPassword(!showConfirmPassword)
                                            }
                                            className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                                            ) : (
                                                <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* Button */}
                                <div>
                                    <Button className="w-full" size="sm" disabled={isPending}>
                                        {isPending ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg
                                                    className="animate-spin h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    ></circle>
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    ></path>
                                                </svg>
                                                Memproses...
                                            </span>
                                        ) : (
                                            "Sign Up"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>

                        <div className="mt-5">
                            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                                Sudah punya akun?{" "}
                                <Link
                                    href="/signin"
                                    className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                                >
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
