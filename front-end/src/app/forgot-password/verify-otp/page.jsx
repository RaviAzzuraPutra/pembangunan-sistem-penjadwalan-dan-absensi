
import { Suspense } from "react";
import VerifyOtp from "../../../components/VerifyOtp";

export default function VerifyOtpPage() {
    return (
        <>
            <Suspense fallback={<div className="text-center">Memuat Form ...</div>}>
                <VerifyOtp />
            </Suspense>
        </>
    )
}