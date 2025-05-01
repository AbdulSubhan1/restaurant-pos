import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users - Restaurant POS",
  description: "Manage restaurant staff accounts",
};

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
