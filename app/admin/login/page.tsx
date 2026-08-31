import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin Login", robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-navy-50/50 dark:bg-navy-900/50 px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-gold-700 dark:text-gold-500">FindIt Ghana · Admin</p>
        <h1 className="mt-2 text-xl font-extrabold text-navy-900 dark:text-navy-100">Sign in to the dashboard</h1>
        <p className="mt-1 text-sm text-slate-soft dark:text-navy-300">Corrections queue, reports and content tools.</p>
        <LoginForm />
      </div>
    </div>
  );
}
