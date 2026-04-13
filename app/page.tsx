import { Suspense } from "react";
import WeddingPage from "./components/WeddingPage";

export default function Page() {
  return (
    <Suspense>
      <WeddingPage />
    </Suspense>
  );
}
