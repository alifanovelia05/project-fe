import React from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import MonitoringDashboard from "@/features/monitoring/components/MonitoringDashboard";

export default function MonitoringPage() {
    return (
        <>
            <PageBreadCrumb pageTitle="Monitoring" />
            <MonitoringDashboard />
        </>
    );
}
