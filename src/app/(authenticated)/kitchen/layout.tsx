import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kitchen Display - Restaurant POS",
  description: "Kitchen display system",
};

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
