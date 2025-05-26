import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Restaurant Menu | Delicious Food & Drinks",
  description:
    "Browse our delicious menu items, prepared with the freshest ingredients. View all our dishes organized by category.",
};

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="menu-layout">{children}</div>;
}
