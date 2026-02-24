"use client";

import { Toaster as Sonner } from "sonner";
import "sonner/dist/styles.css";

export function Toaster() {
  return (
    <Sonner
      closeButton
      position="top-right"
      richColors
      theme="dark"
    />
  );
}
