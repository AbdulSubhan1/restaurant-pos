"use client";

import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

interface MenuQRCodeProps {
  restaurantName?: string;
  baseUrl?: string;
}

export function MenuQRCode({
  restaurantName = "Our Restaurant",
  baseUrl,
}: MenuQRCodeProps) {
  const [url, setUrl] = useState<string>("");

  // Get the current URL when component mounts
  useEffect(() => {
    if (baseUrl) {
      setUrl(`${baseUrl}/menu`);
    } else if (typeof window !== "undefined") {
      // Use current domain if baseUrl not provided
      const protocol = window.location.protocol;
      const host = window.location.host;
      setUrl(`${protocol}//${host}/menu`);
    }
  }, [baseUrl]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a canvas from the QR code SVG
    const svg = document.getElementById("menu-qr-code");
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions
    canvas.width = 1000;
    canvas.height = 1000;

    if (ctx) {
      // Create a new image from the SVG
      const img = new Image();
      const svgBlob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = function () {
        // Fill background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw image in center
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to blob and download
        canvas.toBlob(function (blob) {
          if (!blob) return;

          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = `${restaurantName
            .replace(/\s+/g, "-")
            .toLowerCase()}-menu-qr.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          // Clean up
          URL.revokeObjectURL(downloadUrl);
        });

        // Clean up
        URL.revokeObjectURL(url);
      };

      img.src = url;
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">{restaurantName}</CardTitle>
        <CardDescription className="text-center">
          Scan to view our menu
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-6">
        {url && (
          <div className="bg-white p-4 rounded-lg mb-4">
            <QRCode
              id="menu-qr-code"
              value={url}
              size={200}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              viewBox={`0 0 256 256`}
            />
          </div>
        )}

        <p className="text-center mb-4 text-sm text-muted-foreground">
          Point your phone's camera at the QR code to view our digital menu
        </p>

        <div className="flex gap-2">
          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button
            onClick={handleDownload}
            variant="default"
            size="sm"
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" /> Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
