import { requireUser } from "@/lib/auth/guards";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await requireUser();
  redirect(user.role === "OPERATOR" ? "/bookings" : "/dashboard");
}