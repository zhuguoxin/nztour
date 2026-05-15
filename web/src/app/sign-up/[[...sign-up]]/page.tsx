import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1117]">
      <SignUp appearance={{ variables: { colorPrimary: "#22d3ee" } }} />
    </div>
  );
}
