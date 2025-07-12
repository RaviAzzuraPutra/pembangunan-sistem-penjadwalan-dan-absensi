
import { Suspense } from "react"
import FaceVerification from "../../../../components/FaceVerification";

export default function Face_Verification_Page() {
    return (
        <Suspense fallback={<div className="text-center">Memuat Form ....</div>}>
            <FaceVerification />
        </Suspense>
    )
}