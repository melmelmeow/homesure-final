import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getMe, homeFor } from "@/lib/auth";
import { SignupForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage() {
  const me = await getMe();
  if (me) redirect(homeFor(me.profile.role));

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center bg-bg px-4 py-10 text-text">
      <Link href="/" className="text-lg font-bold">Kasafide</Link>
      <h1 className="mt-6 text-2xl font-extrabold">Create your account</h1>
      <p className="mb-6 mt-1 text-sm text-text-muted">Verified listings, secure payments</p>
      <SignupForm />
    </main>
  );
}
