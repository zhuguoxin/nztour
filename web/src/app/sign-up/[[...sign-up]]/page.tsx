import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <SignUp appearance={{ variables: { colorPrimary: "#059669" } }} />
    </div>
  );
}
