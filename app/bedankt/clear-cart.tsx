"use client";
import { useEffect } from "react";

export function ClearCart() {
  useEffect(() => {
    try {
      localStorage.removeItem("la-cart");
    } catch {}
  }, []);
  return null;
}
