import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const requested = params.next && params.next.startsWith("/") && !params.next.startsWith("//")
    ? params.next
    : "/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <LoginForm nextPath={requested} />
    </main>
  );
}
