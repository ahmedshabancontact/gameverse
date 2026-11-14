import type { Metadata } from "next";
import { SettingsPanel } from "@/components/AccountForms";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings",
  description: "Theme, sound, motion and account preferences for GameVerse.",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  return (
    <div className="mx-auto max-w-[1100px] px-5 py-10 md:px-10">
      <p className="micro micro-violet">// Cabinet configuration</p>
      <h1 className="display mt-2" style={{ fontSize: "clamp(34px,5vw,58px)" }}>
        Settings
      </h1>
      <p className="mt-3 max-w-[58ch] text-[15px]" style={{ color: "var(--muted)" }}>
        Tune the cabinet to your taste. Preferences are stored on this device
        {user ? " and synced to your account." : " — sign in to sync them across devices."}
      </p>
      <div className="mt-9">
        <SettingsPanel signedIn={Boolean(user)} />
      </div>
    </div>
  );
}
