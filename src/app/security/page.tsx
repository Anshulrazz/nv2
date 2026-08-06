import { redirect } from "next/navigation";

export default function SecurityRedirectPage() {
  redirect("/legal/security-policy");
}
