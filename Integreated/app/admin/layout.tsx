"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: "📊",
    },
    {
      name: "Fraud Alerts",
      href: "/admin/fraud-alerts",
      icon: "🚨",
    },
    {
      name: "DoS Alerts",
      href: "/admin/dos-alerts",
      icon: "🛡️",
    },
    {
      name: "Network Monitor",
      href: "/admin/network-monitor",
      icon: "🌐",
    },
    {
      name: "Transaction summary",
      href: "/admin/trasactionFrauds",
      icon: "💸",
    },
    {
      name: "Settings", 
      href: "/admin/settings",
      icon: "⚙️",
    },
    {
      name: "Back to Store",
      href: "/",
      icon: "🏪",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md p-5">
        <div className="flex items-center mb-8">
          <span className="text-2xl font-bold">Admin Panel</span>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                pathname === item.href
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <Card className="p-6">{children}</Card>
      </div>
    </div>
  );
}
