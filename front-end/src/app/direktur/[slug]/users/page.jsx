import { Suspense } from "react";
import Users from "../../../../components/Users"

export default function UsersPage() {
    return (
        <Suspense fallback={<div className="text-center">Loading...</div>}>
            <Users />
        </Suspense>
    );
}
