# QuantPulse Pro — Micro SaaS Cuantitativo de Mercados Financieros

Plataforma Web (Micro SaaS) orientada al análisis técnico cuantitativo de activos financieros (**Acciones, ETFs y Criptomonedas**), generación de señales de trading algorítmicas, diagnóstico de riesgo/fuerza de tendencia y motor de backtesting histórico con **fricción real de mercado (comisiones y deslizamiento)**.

---

## 🚀 Características Principales

### 1. Panel Principal & Watchlist Avanzada
- **Lista de Seguimiento Interactiva**: Permite monitorear y gestionar activos favoritos (ej. `BTC/USDT`, `ETH/USDT`, `SOL/USDT`, `VOO`, `QQQ`, `SCHD`, `VTI`, `NVDA`, `AAPL`, `SPY`).
- **5 Pilares Cuantitativos por Activo**:
  1. **Tendencia Actual**: Identificación objetiva del sesgo (*Alcista*, *Bajista* o *Lateral*) mediante EMAs y estructura de precios.
  2. **Tiempo en Tendencia**: Contador continuo de velas/días que el activo lleva dentro de la tendencia.
  3. **Riesgo de Cambio de Tendencia**: Nivel (*Bajo*, *Medio*, *Alto*) y probabilidad porcentual basada en divergencias de RSI y pendiente de medias móviles.
  4. **Indicador de Fuerza / Volatilidad**: Medición de impulso con **ADX** (Wilder) y volatilidad con **ATR**.
  5. **Señal Actual**: Estado instantáneo (*Oportunidad de Entrada*, *Esperar / Mantener*, *Oportunidad de Salida*).

### 2. Buscador de Oportunidades (Screener Inteligente)
- Clasificación automatizada de activos en 4 perfiles estratégicos:
  - **Más Estables / Conservadores**: Bajo ATR y volatilidad contenida (ideal para swing trading de bajo riesgo y ETFs indexados).
  - **Mejores para Rango / Laterales**: Activos con ADX < 20, ideales para operar rebotes de RSI en soportes y resistencias.
  - **Mejores para Tendencia Fuerte**: ADX > 25 y EMAs alineadas (compras en pullbacks).
  - **Alta Volatilidad / Alto Riesgo**: Movimientos expansivos recientes para momentum y trading dinámico.
- **Opportunity Score (0 a 100)**: Algoritmo compuesto que pondera confirmaciones múltiples en tiempo real.

### 3. Gráficos Interactivos & Lógica de Señales
- Gráficos de velas con **TradingView `lightweight-charts`** con soporte para modo oscuro profesional.
- Superposición de **EMA 20** (Cyan) y **EMA 50** (Ámbar).
- Marcadores visuales de **COMPRA** y **VENTA**.
- **Gestión de Riesgo Asimétrica**: Niveles explícitos de **Stop Loss Dinámico** y **Take Profit** sugeridos en USD y % (Relación Riesgo/Beneficio mínima 1:2.2).
- Subgráficos sincronizados de **RSI (14 periodos)** y **ADX (+DI / -DI)**.

### 4. Módulo de Backtesting con Fricción Real
- Simulación histórica sobre historial real con capital base ($1,000 USD).
- **Realismo Financiero**:
  - **0.1% de comisión** por cada transacción.
  - **0.05% de factor de deslizamiento (slippage)** por ejecución.
- **Métricas Clave**:
  - Tasa de Acierto Global (Win Rate %).
  - Retorno Neto Total ($ y %) vs. Rendimiento pasivo **Buy & Hold**.
  - Máxima Caída Histórica (Max Drawdown %).
  - Profit Factor y Ganancia promedio por operación.
- **Curva de Crecimiento de Capital (Equity Curve)** y Gráfico de Drawdown interactivo con Recharts.
- **Sliders Interactivos en Tiempo Real**: Modifica periodos de RSI, sobrecompra/sobreventa, EMAs y Stop Loss con recálculo instantáneo.
- Registro detallado de operaciones con motivo de cierre (Take Profit, Stop Loss, Señal Técnica) y exportación a **CSV**.

---

## 🛠️ Stack Tecnológico

- **Frontend / Backend**: Next.js 16+ (App Router, Server & Client Components)
- **Estilos**: Tailwind CSS con tema Dark Quant Terminal y Glassmorphism
- **Gráficos Técnicos**: `@tradingview/lightweight-charts` v5
- **Gráficos de Rendimiento**: `recharts`
- **Iconos & Efectos**: `lucide-react`, `canvas-confetti`
- **APIs de Mercado**: Binance REST API pública (Criptomonedas) y Yahoo Finance / Modelo Cuantitativo Determinista (Acciones y ETFs).

---

## 📦 Instalación y Ejecución Local

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Compilar para producción
npm run build
npm run start
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🌐 Despliegue en Vercel & GitHub

1. Inicializa y sube los cambios a tu repositorio de GitHub:
   ```bash
   git add .
   git commit -m "feat: QuantPulse Pro Micro SaaS platform"
   git branch -M main
   git remote add origin <URL_DE_TU_REPOSITORIO>
   git push -u origin main
   ```
2. Conecta tu repositorio en [Vercel](https://vercel.com):
   - Framework Preset: `Next.js`
   - Build Command: `next build`
   - Output Directory: `.next`
3. ¡Despliegue automático y continuo activado!
