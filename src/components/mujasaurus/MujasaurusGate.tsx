"use client";

import { usePathname } from "next/navigation";
import Mujasaurus from "./Mujasaurus";

// Keeps the mascot off the admin dashboard (a work tool, not a visitor
// surface) while still showing up on every public page, including ones
// added after this file was written.
export default function MujasaurusGate() {
  const pathname = usePathname() || "/";
  if (pathname.startsWith("/admin")) return null;
  return <Mujasaurus />;
}
