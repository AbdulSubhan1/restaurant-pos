import { Suspense } from "react";
import { MenuQRCode } from "@/components/menu/MenuQRCode";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Card, CardDescription } from "@/components/ui/card";

export default function MenuQRCodePage() {
  return (
    <div className="container py-6 space-y-6">
      <div>
        <Heading
          title="Menu QR Code"
          description="Generate QR codes to place on tables for customers to scan and view the menu"
        />
        <Separator className="my-4" />
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="p-6">
          <CardDescription className="mb-6">
            Print these QR codes and place them on tables to allow customers to
            easily view your digital menu on their phones.
          </CardDescription>

          <div className="space-y-4">
            <p className="text-sm">
              <strong>Tips:</strong>
            </p>
            <ul className="list-disc pl-5 text-sm space-y-2 text-muted-foreground">
              <li>
                Print on high-quality paper and consider laminating for
                durability
              </li>
              <li>Place in a visible location on each table</li>
              <li>
                Test the QR code with different phone cameras to ensure
                compatibility
              </li>
              <li>
                Consider adding your restaurant's logo to the printed cards
              </li>
            </ul>
          </div>
        </Card>

        <Suspense fallback={<div>Loading QR code...</div>}>
          <MenuQRCode />
        </Suspense>
      </div>
    </div>
  );
}
