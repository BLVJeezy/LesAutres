import type { OrderStatus } from "@/lib/shop";

export const STATUS_BADGE: Record<OrderStatus, [tone: string, label: string]> = {
  open: ["attention", "Niet verzonden"],
  shipped: ["success", "Verzonden"],
  refunded: ["", "Terugbetaald"],
};
