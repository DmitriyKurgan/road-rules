"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/tickets", label: "Tickets" },
  { href: "/admin/import", label: "Import" },
  { href: "/admin/images", label: "Images" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();
  const pathname = usePathname();

  if (user && user.role !== "ADMIN") {
    return (
      <div className="mt-20 text-center text-red-600 text-lg">
        Access denied — admin role required
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-[calc(100vh-120px)]">
        <aside className="w-56 border-r bg-gray-50 p-4">
          <h2 className="mb-4 text-lg font-bold text-gray-800">Admin</h2>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded px-3 py-2 text-sm ${
                    isActive
                      ? "bg-blue-100 font-medium text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
