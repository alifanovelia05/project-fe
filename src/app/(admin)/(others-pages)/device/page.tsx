import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import DeviceDataTable from "@/features/devices/components/DeviceDataTable";

export default function DevicePage() {
    return (
        <>
            <PageBreadCrumb pageTitle="GPS / Device" />
            <div className="grid grid-cols-1 gap-6">
                <ComponentCard title="Daftar GPS">
                    <DeviceDataTable />
                </ComponentCard>
            </div>
        </>
    );
}
