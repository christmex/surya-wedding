import type { Metadata } from "next";
import GuestLinkManager from "./GuestLinkManager";
import PasswordGate from "./PasswordGate";

export const metadata: Metadata = {
  title: "Guest Link Generator",
  robots: { index: false, follow: false },
};

export default function GuestsPage() {
  return (
    <PasswordGate>
      <GuestLinkManager />
    </PasswordGate>
  );
}
