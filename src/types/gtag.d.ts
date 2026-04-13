interface GtagEventParams {
  send_to?: string;
  event_category?: string;
  event_label?: string;
  value?: number;
  currency?: string;
  transaction_id?: string;
  [key: string]: string | number | boolean | undefined;
}

interface Window {
  dataLayer: Record<string, unknown>[];
  gtag: (
    command: "config" | "event" | "js" | "set",
    targetOrAction: string | Date,
    params?: GtagEventParams | Record<string, unknown>
  ) => void;
}
