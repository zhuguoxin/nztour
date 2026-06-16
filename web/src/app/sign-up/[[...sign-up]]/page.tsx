import { SignUp } from "@clerk/nextjs";

/**
 * Clerk sign-up. The `?as=customer|user` from /join is forwarded into the
 * post-signup redirect so /onboarding knows which form to render. The role
 * itself grants no privileges — it only selects the form.
 */
export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string }>;
}) {
  const { as } = await searchParams;
  const role = as === "customer" ? "customer" : as === "user" ? "user" : null;
  const redirectUrl = role ? `/onboarding?as=${role}` : "/onboarding";
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <SignUp
        appearance={{ variables: { colorPrimary: "#059669" } }}
        forceRedirectUrl={redirectUrl}
        signInUrl="/sign-in"
      />
    </div>
  );
}
