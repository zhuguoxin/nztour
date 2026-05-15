import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

export default async function LearnHome() {
  const user = await currentUser();
  return (
    <div className="min-h-screen bg-[#0b1117] text-[#e6edf3] font-sans px-10 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <div className="text-[11px] tracking-widest text-[#5b6b7d] font-mono">/LEARN</div>
          <h1 className="text-3xl font-semibold mt-1">
            Welcome{user?.firstName ? `, ${user.firstName}` : ""}.
          </h1>
        </div>
        <UserButton appearance={{ variables: { colorPrimary: "#22d3ee" } }} />
      </div>

      <div className="rounded-xl border border-[#1f2a35] bg-[#11181f] p-6 max-w-2xl">
        <div className="text-[13px] text-[#9aa7b8]">
          This is a protected route — middleware authenticated you via Clerk.
        </div>
        <pre className="mt-4 text-[11px] text-[#67e8f9] font-mono overflow-x-auto">
{JSON.stringify(
  {
    id: user?.id,
    email: user?.emailAddresses?.[0]?.emailAddress,
    name: user?.fullName,
  },
  null,
  2,
)}
        </pre>
        <div className="mt-4 text-[12px] text-[#5b6b7d]">
          Day 3 will replace this with the course list pulled from D1 seeded with NZSki Coronet Peak.
        </div>
      </div>
    </div>
  );
}
