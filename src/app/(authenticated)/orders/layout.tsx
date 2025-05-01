import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orders - Restaurant POS",
  description: "Manage restaurant orders",
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
