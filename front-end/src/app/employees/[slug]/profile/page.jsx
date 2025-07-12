import { Suspense } from "react";
import Profile from "../../../../components/Profile";

export default function ProfilePage() {
    return (
        <Suspense fallback={<div className="text-center">Memuat Form ...</div>}>
            <Profile />
        </Suspense>
    )
}