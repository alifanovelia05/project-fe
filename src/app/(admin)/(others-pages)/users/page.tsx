import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import UserDataTable from "@/features/profile/components/UserDataTable";

export default function UsersPage() {
    return (
        <>
            <PageBreadCrumb pageTitle="Pengguna" />
            <div className="grid grid-cols-1 gap-6">
                <ComponentCard
                    title="Daftar Pengguna"
                    desc="Data pengguna yang terdaftar dalam sistem."
                >
                    <UserDataTable />
                </ComponentCard>
            </div>
        </>
    );
}
