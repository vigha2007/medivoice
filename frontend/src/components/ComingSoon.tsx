/**
 * ComingSoon.tsx
 * ---------------
 * Generic placeholder shown for routes whose module hasn't been built
 * yet, so sidebar navigation doesn't feel broken while modules are
 * delivered incrementally.
 */

import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { Construction } from "lucide-react";

export default function ComingSoon({
  title,
  moduleLabel,
}: {
  title: string;
  moduleLabel: string;
}): ReactNode {
  return (
    <div className="flex h-screen bg-blue-50 dark:bg-slate-900">
      <Sidebar />
      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
          <Construction className="h-8 w-8 text-primary-600 dark:text-primary-300" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-800 dark:text-white">
          {title}
        </h1>
        <p className="mt-2 max-w-sm text-center text-sm text-slate-500 dark:text-slate-400">
          {moduleLabel} is coming up next and isn't built yet. Check back
          after this module is delivered.
        </p>
      </main>
    </div>
  );
}
