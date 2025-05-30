import { LoginForm } from "@/features/auth/components/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Restaurant POS",
  description: "Login to the Restaurant Point of Sale system",
};

export default function LoginPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600">Restaurant POS</h1>
          <p className="text-gray-600">Point of Sale System</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
