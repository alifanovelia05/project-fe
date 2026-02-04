"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { ActionResult } from "@/types";
import { loginAction } from "@/lib/actions/auth.actions";

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [state, setState] = useState<ActionResult | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setState(null);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    // Call Server Action
    const result = await loginAction({ username, password });

    setState(result);
    setIsPending(false);

    if (result.success) {
      // Store token dan username di client-side untuk API requests
      if (result.token) {
        sessionStorage.setItem("auth_token", result.token);
        localStorage.setItem("auth_token", result.token);
        console.log("Token stored in sessionStorage and localStorage");
      }

      // Store username untuk profile lookup
      sessionStorage.setItem("username", username);
      localStorage.setItem("username", username);
      console.log("Username stored:", username);

      // Redirect after successful login
      setTimeout(() => {
        router.push(callbackUrl);
        router.refresh();
      }, 500);
    }
  }

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Kembali ke dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Masukkan username dan password untuk login!
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
              <div className="space-y-6">
                <div>
                  <Label htmlFor="username">
                    Username <span className="text-red-500">*</span>{" "}
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="Masukkan username"
                    type="text"
                    required
                    disabled={isPending}
                  />
                </div>
                <div>
                  <Label htmlFor="password">
                    Password <span className="text-red-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan password"
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Ingat saya
                    </span>
                  </div>
                </div>
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
                      "Sign In"
                    )}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Belum punya akun?{" "}
                <Link
                  href="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
