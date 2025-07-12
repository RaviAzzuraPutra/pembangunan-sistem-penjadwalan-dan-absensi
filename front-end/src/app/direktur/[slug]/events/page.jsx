import { Suspense } from "react";
import Events from "../../../../components/Events";

export default function EventsPage() {
    return (
        <Suspense fallback={<div className="text-center">Loading...</div>}>
            <Events />
        </Suspense>
    );
}