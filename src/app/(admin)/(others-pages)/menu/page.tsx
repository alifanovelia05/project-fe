import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import MenuDataTable from "@/features/menu/components/MenuDataTable";

export default function MenuPage() {
    return (
        <>
            <PageBreadCrumb pageTitle="Menu" />
            <div className="grid grid-cols-1 gap-6">
                <ComponentCard
                    title="Daftar Menu"
                    desc="Data menu dari endpoint klasifikasi kategori menu."
                >
                    <MenuDataTable />
                </ComponentCard>
            </div>
        </>
    );
}
