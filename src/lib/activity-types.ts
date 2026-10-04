export type ActivityWindow = {
  from: string;
  to: string;
  days: 30;
};

export type ActivitySnapshot = {
  window: ActivityWindow;
  requests: { total: number; accepted: number; rejected: number };
  events: { total: number };
  eventCounts: Array<{ name: string; count: number }>;
  recentEvents: Array<{ id: string; name: string; receivedAt: string }>;
  recentRequests: Array<{
    id: string;
    receivedAt: string;
    outcome: string;
    httpStatus: number;
    errorCode: string | null;
  }>;
};
