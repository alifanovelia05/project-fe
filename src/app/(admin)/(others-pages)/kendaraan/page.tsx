import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import VehicleDataTable from "@/features/vehicles/components/VehicleDataTable";

export default function KendaraanPage() {
    return (
        <>
            <PageBreadCrumb pageTitle="Kendaraan" />
            <div className="grid grid-cols-1 gap-6">
                <ComponentCard title="Daftar Kendaraan">
                    <VehicleDataTable />
                </ComponentCard>
            </div>
        </>
    );
}
