import { PriceAlert } from './src/lib/types/alerts';
import { triggerPriceAlertNotification } from './src/lib/utils/browser-notifications';

// In-memory mock storage simulation
const mockStorage: Record<string, string> = {};
const STORAGE_KEY = 'quantpulse_price_alerts_v1';

function saveAlerts(alerts: PriceAlert[]) {
  mockStorage[STORAGE_KEY] = JSON.stringify(alerts);
}

function loadAlerts(): PriceAlert[] {
  const data = mockStorage[STORAGE_KEY];
  return data ? JSON.parse(data) : [];
}

console.log('======================================================================');
console.log('  TEST DE SISTEMA DE ALERTAS DE PRECIO & NOTIFICACIONES (QuantPulse)');
console.log('======================================================================\n');

// 1. Test: Multiple alerts for the same symbol
let alerts: PriceAlert[] = [];

function addAlert(assetId: string, symbol: string, targetPrice: number, direction: 'ABOVE' | 'BELOW', note?: string): PriceAlert {
  const alert: PriceAlert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    assetId,
    symbol,
    targetPrice,
    direction,
    note,
    createdAt: new Date().toISOString(),
    active: true,
  };
  alerts = [alert, ...alerts];
  saveAlerts(alerts);
  return alert;
}

function checkAlerts(currentPrices: Record<string, number>): PriceAlert[] {
  const triggered: PriceAlert[] = [];
  alerts = alerts.map((a) => {
    if (!a.active || a.triggeredAt) return a;
    const price = currentPrices[a.assetId] ?? currentPrices[a.symbol];
    if (price === undefined) return a;

    const isTriggered = (a.direction === 'ABOVE' && price >= a.targetPrice) ||
                        (a.direction === 'BELOW' && price <= a.targetPrice);

    if (isTriggered) {
      const trig = { ...a, active: false, triggeredAt: new Date().toISOString() };
      triggered.push(trig);
      triggerPriceAlertNotification(trig, price);
      return trig;
    }
    return a;
  });

  if (triggered.length > 0) {
    saveAlerts(alerts);
  }
  return triggered;
}

console.log('▶ [Paso 1] Creando 3 alertas simultáneas para BTC/USDT en diferentes niveles...');
const a1 = addAlert('BTCUSDT', 'BTC/USDT', 70000, 'ABOVE', 'Resistencia clave - Tomar ganancias');
const a2 = addAlert('BTCUSDT', 'BTC/USDT', 62000, 'BELOW', 'Soporte EMA 50 - Buscar rebote');
const a3 = addAlert('BTCUSDT', 'BTC/USDT', 58000, 'BELOW', 'Stop Loss de emergencia');
const a4 = addAlert('ETHUSDT', 'ETH/USDT', 3800, 'ABOVE', 'Ruptura alcista');

console.log(`✅ Total de alertas creadas: ${alerts.length}`);
console.log(`  • Alerta 1 (${a1.symbol}): ${a1.direction} $${a1.targetPrice} ["${a1.note}"] (ID: ${a1.id})`);
console.log(`  • Alerta 2 (${a2.symbol}): ${a2.direction} $${a2.targetPrice} ["${a2.note}"] (ID: ${a2.id})`);
console.log(`  • Alerta 3 (${a3.symbol}): ${a3.direction} $${a3.targetPrice} ["${a3.note}"] (ID: ${a3.id})`);
console.log(`  • Alerta 4 (${a4.symbol}): ${a4.direction} $${a4.targetPrice} ["${a4.note}"] (ID: ${a4.id})`);

if (alerts.length !== 4) {
  throw new Error('Fallo: Las alertas para el mismo símbolo se sobreescribieron.');
}
console.log('✅ Coexistencia de múltiples alertas por símbolo: SUPERADA.\n');

// 2. Test: Simulación de persistencia en localStorage (Recarga de página)
console.log('▶ [Paso 2] Simulando recarga del navegador (Hydration desde localStorage)...');
const hydratedAlerts = loadAlerts();
console.log(`✅ Alertas recuperadas de mock localStorage: ${hydratedAlerts.length}/4`);
if (hydratedAlerts.length !== 4) {
  throw new Error('Fallo en persistencia de localStorage');
}
console.log('✅ Persistencia en localStorage tras recarga: SUPERADA.\n');

// 3. Test: Disparo de Alerta ABOVE cuando el precio sube
console.log('▶ [Paso 3] El precio de BTC/USDT sube a $70,500...');
const triggeredCycle1 = checkAlerts({ BTCUSDT: 70500, ETHUSDT: 3500 });
console.log(`✅ Alertas disparadas en ciclo 1: ${triggeredCycle1.length}`);
triggeredCycle1.forEach((t) => {
  console.log(`  🔔 DISPARADA: ${t.symbol} ${t.direction} $${t.targetPrice} (TriggeredAt: ${t.triggeredAt})`);
});
if (triggeredCycle1.length !== 1 || triggeredCycle1[0].id !== a1.id) {
  throw new Error('Fallo: La alerta ABOVE no se disparó correctamente');
}

// 4. Test: Verificación de no-repetición en el siguiente ciclo (Idempotencia)
console.log('\n▶ [Paso 4] Siguiente ciclo de precios (BTC a $71,000)...');
const triggeredCycle2 = checkAlerts({ BTCUSDT: 71000, ETHUSDT: 3500 });
console.log(`✅ Alertas disparadas en ciclo 2 (debe ser 0 para evitar spam): ${triggeredCycle2.length}`);
if (triggeredCycle2.length !== 0) {
  throw new Error('Fallo: Se repitió una alerta ya disparada');
}

// 5. Test: Disparo de Alerta BELOW cuando el precio cae
console.log('\n▶ [Paso 5] El precio de BTC cae a $61,000...');
const triggeredCycle3 = checkAlerts({ BTCUSDT: 61000, ETHUSDT: 3500 });
console.log(`✅ Alertas disparadas en ciclo 3: ${triggeredCycle3.length}`);
triggeredCycle3.forEach((t) => {
  console.log(`  🔔 DISPARADA: ${t.symbol} ${t.direction} $${t.targetPrice} (TriggeredAt: ${t.triggeredAt})`);
});
if (triggeredCycle3.length !== 1 || triggeredCycle3[0].id !== a2.id) {
  throw new Error('Fallo: La alerta BELOW de $62,000 no se disparó');
}

// 6. Test: Verificación de que la alerta de $58,000 sigue activa
const remainingActive = alerts.filter((a) => a.active);
console.log(`\n✅ Alertas activas restantes: ${remainingActive.length} (Alerta de $58,000 y ETH $3,800)`);
if (remainingActive.length !== 2) {
  throw new Error('Fallo en el estado de alertas restantes');
}

console.log('\n----------------------------------------------------------------------');
console.log('✨ TODAS LAS PRUEBAS DEL SISTEMA DE ALERTAS PASARON EXITOSAMENTE AL 100%.');
console.log('----------------------------------------------------------------------');
