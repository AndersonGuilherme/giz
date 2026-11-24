// Latência SIMULADA (para fins didáticos): ida e volta ao banco e conversa com o servidor SMTP.
export const DB_ROUND_TRIP_MS = 120;
export const SMTP_SEND_MS = 800;
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
