"use client";
import React from "react";
import { useModal } from "../../../hooks/useModal";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import { User } from "../services/user.service";

interface UserAddressCardProps {
    user: User | null;
}

export default function UserAddressCard({ user }: UserAddressCardProps) {
    const { isOpen, openModal, closeModal } = useModal();
    const handleSave = () => {
        // Handle save logic here
        console.log("Saving changes...");
        closeModal();
    };

    const getUserType = (type: number) => {
        const types: { [key: number]: string } = {
            1: "Super Admin",
            2: "Admin",
            3: "Manager",
            4: "User",
        };
        return types[type] || "User";
    };

    return (
        <>
            <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
                            Account Details
                        </h4>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                            <div>
                                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                    User Type
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    {user ? getUserType(user.type) : "-"}
                                </p>
                            </div>

                            <div>
                                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                    Parent ID
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    {user?.parent || "-"}
                                </p>
                            </div>

                            <div>
                                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                    Group ID
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    {user?.group || "-"}
                                </p>
                            </div>

                            <div>
                                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                    Status
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    {user?.status === 1 ? "Active" : "Inactive"}
                                </p>
                            </div>

                            <div className="lg:col-span-2">
                                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                    Menu Access
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90 break-all">
                                    {user?.menu || "-"}
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-175 m-4">
                <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            Edit Address
                        </h4>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                            Update your details to keep your profile up-to-date.
                        </p>
                    </div>
                    <form className="flex flex-col">
                        <div className="px-2 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                                <div>
                                    <Label>Country</Label>
                                    <Input type="text" defaultValue="United States" />
                                </div>

                                <div>
                                    <Label>City/State</Label>
                                    <Input type="text" defaultValue="Arizona, United States." />
                                </div>

                                <div>
                                    <Label>Postal Code</Label>
                                    <Input type="text" defaultValue="ERT 2489" />
                                </div>

                                <div>
                                    <Label>TAX ID</Label>
                                    <Input type="text" defaultValue="AS4568384" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <Button size="sm" variant="outline" onClick={closeModal}>
                                Close
                            </Button>
                            <Button size="sm" onClick={handleSave}>
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}
