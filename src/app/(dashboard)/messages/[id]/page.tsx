import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

interface OpenMessagePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: OpenMessagePageProps) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const user = await User.findById(id).select("name").lean();
    const name = (user?.name as string) || "Scholar";
    return {
      title: `Direct Message with ${name} | Notexia`,
      description: `Chat directly with ${name} on Notexia study workspace.`,
    };
  } catch {
    return { title: "Direct Messages | Notexia" };
  }
}

export default async function OpenMessagePage({ params }: OpenMessagePageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Redirect to main messages route with target user selected
  redirect(`/messages?userId=${id}`);
}
