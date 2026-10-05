import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import SignOutButton from "./SignOutButton";

export default async function NoProfilePage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mb-4 text-4xl">⚠️</div>
        <h1 className="mb-2 text-xl font-semibold">Account setup incomplete</h1>
        <p className="mb-6 text-sm text-muted">
          You are signed in as {user.email}, but your profile is missing. This
          usually means the account was not fully provisioned. Please contact the
          administrator, or sign out and try another account.
        </p>
        <SignOutButton />
      </div>
    </div>
  );
}
