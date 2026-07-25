import { redirect } from "next/navigation";
import { getContext } from "@/lib/data/context";
import { OnboardingForm } from "@/components/onboarding-form";

export default async function OnboardingPage() {
  const ctx = await getContext();
  if (!ctx) redirect("/login");
  if (ctx.org) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-neutral-50">Set up your venue</h1>
          <p className="mt-2 text-sm text-neutral-400">
            You&apos;ll be the admin. We&apos;ll create a starter schema you can tailor in
            Settings — add your own sales categories, payment methods, shifts, and presets
            to match how your venue actually operates.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
