"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="inline-flex items-center gap-2 rounded bg-gray-900 text-white px-3 py-2 text-sm"
    >
      Sign out
    </button>
  );
}
