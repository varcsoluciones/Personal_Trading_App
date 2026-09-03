export interface PriceAlert {
  id: string;
  assetId: string;
  symbol: string;
  targetPrice: number;
  direction: 'ABOVE' | 'BELOW'; // se dispara cuando el precio sube por encima o baja por debajo del targetPrice
  note?: string; // opcional, texto libre del usuario, ej. "Nivel de soporte importante"
  createdAt: string;
  triggeredAt?: string; // se llena cuando se dispara, para no volver a notificar la misma alerta
  active: boolean;
}
