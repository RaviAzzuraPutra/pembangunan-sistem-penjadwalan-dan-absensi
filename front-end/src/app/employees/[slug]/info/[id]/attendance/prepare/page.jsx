import { Suspense } from "react"
import AttendancePrepare from "../../../../../../../components/AttendancePrepare"

export default function AttendancePreparePage() {
    return (
        <Suspense fallback={<div className="text-center">Memuat Form ....</div>}>
            <AttendancePrepare />
        </Suspense>
    )
}