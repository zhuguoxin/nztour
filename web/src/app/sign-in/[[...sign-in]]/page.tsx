import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1117]">
      <SignIn appearance={{ variables: { colorPrimary: "#22d3ee" } }} />
    </div>
  );
}
