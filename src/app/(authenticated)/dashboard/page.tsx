import { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard - Restaurant POS",
  description: "Dashboard for the Restaurant Point of Sale system",
};

export default function DashboardPage() {
  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCard
            title="Tables"
            description="Manage restaurant tables and seating"
            linkHref="/tables"
            linkText="View Tables"
            iconEmoji="🪑"
          />

          <DashboardCard
            title="Menu Management"
            description="Manage menu items and categories"
            linkHref="/menu-management"
            linkText="Manage Menu"
            iconEmoji="🍔"
          />

          <DashboardCard
            title="Orders"
            description="Create and manage customer orders"
            linkHref="/orders"
            linkText="View Orders"
            iconEmoji="🧾"
          />

          <DashboardCard
            title="Kitchen Display"
            description="View and update order statuses"
            linkHref="/kitchen"
            linkText="Kitchen Display"
            iconEmoji="👨‍🍳"
          />

          <DashboardCard
            title="Users"
            description="Manage staff accounts and roles"
            linkHref="/users"
            linkText="Manage Users"
            iconEmoji="👥"
          />

          <DashboardCard
            title="Reports"
            description="View sales and analytics reports"
            linkHref="/reports"
            linkText="View Reports"
            iconEmoji="📊"
          />
        </div>
      </div>
    </main>
  );
}

interface DashboardCardProps {
  title: string;
  description: string;
  linkHref: string;
  linkText: string;
  iconEmoji: string;
}

function DashboardCard({
  title,
  description,
  linkHref,
  linkText,
  iconEmoji,
}: DashboardCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="text-4xl mb-2">{iconEmoji}</div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Link
          href={linkHref}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          {linkText} →
        </Link>
      </CardFooter>
    </Card>
  );
}
