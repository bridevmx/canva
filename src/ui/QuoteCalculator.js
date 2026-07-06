// QuoteCalculator.js — Cálculo de cotización

import { PRODUCTS, DISCOUNT_TIERS, MIN_ORDER_TOTAL } from '../pb.config.js';

export class QuoteCalculator {
  constructor(materialTypeGetter, qtyGetter, pagesCountGetter) {
    this.getMaterial = materialTypeGetter;
    this.getQty      = qtyGetter;
    this.getPages    = pagesCountGetter;
  }

  compute() {
    const prod = PRODUCTS.find(p => p.code === this.getMaterial());
    if (!prod) return { total: 0, finalUnitPrice: 0, pct: 0, warning: null };

    let qty = (parseInt(this.getQty()) || 1) * (this.getPages() || 1);
    if (qty < 1) qty = 1;

    let pct = 0;
    for (const tier of DISCOUNT_TIERS) {
      if (qty >= tier.minQty) { pct = tier.pct; break; }
    }

    let finalUnitPrice = prod.precio * (1 - pct / 100);
    let total = finalUnitPrice * qty;
    let warning = null;

    if (total < MIN_ORDER_TOTAL) {
      total = MIN_ORDER_TOTAL;
      finalUnitPrice = total / qty;
      warning = `Un pedido pequeño activa automáticamente el cargo mínimo administrativo para producción en masa ($${MIN_ORDER_TOTAL}).`;
    }

    return { total, pct, finalUnitPrice, warning };
  }
}