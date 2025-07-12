
import { Suspense } from "react"
import AttendanceService from "../../../../../../../components/AttendanceService";

export default function AttendanceServicePage() {
    return (
        <Suspense fallback={<div className="text-center">Memuat Form ....</div>}>
            <AttendanceService />
        </Suspense>
    )
}