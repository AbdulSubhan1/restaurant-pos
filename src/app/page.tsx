"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <div className="flex flex-col items-center justify-center flex-1 p-6 text-center bg-gradient-to-b from-blue-50 to-white">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
          Restaurant POS System
        </h1>
        <p className="max-w-2xl mb-8 text-xl text-gray-600">
          A complete point of sale solution for modern restaurants
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/login">
            <Button size="lg" className="gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/menu">
            <Button size="lg" variant="outline" className="gap-2">
              View Our Menu <BookOpen className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
