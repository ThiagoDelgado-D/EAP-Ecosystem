export interface HealthStatus {
  status: "ok" | "error";
  timestamp: Date;
}

export function healthCheck(): HealthStatus {
  return {
    status: "ok",
    timestamp: new Date(),
  };
}
