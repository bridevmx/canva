// PrinterAPI.js — Comunicación con el servidor de impresión

import { PRINTER_API_URL } from '../pb.config.js';

/**
 * FIX #4 de seguridad:
 * Ya NO enviamos el token completo de PocketBase al servicio externo.
 * El servicio de impresión debe implementar su propio mecanismo de auth
 * (token efímero dedicado, API key compartida, o JWT firmado por ambos lados).
 *
 * Mientras tanto, dejamos el contrato de la API el día en que printSignedOrder
 * se implemente correctamente.
 */
export class PrinterAPI {
  constructor(endpoint = PRINTER_API_URL) {
    this.endpoint = endpoint;
  }

  /**
   * Solicita impresión de un pedido.
   *
   * @param {string} orderId - ID del pedido en PocketBase
   * @param {string} ephemeralToken - Token de corta duración emitido exclusivamente
   *        para este servicio (no el token de sesión PB).
   * @param {string} printer - ID/nombre de la impresora destino
   */
  async printOrder(orderId, ephemeralToken, printer = 'G1010-series') {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        printerToken: ephemeralToken,  // ← renombrado, evita fugar el PB token
        printer
      })
    });

    if (!response.ok) {
      let msg = 'Error desconocido';
      try { const j = await response.json(); msg = j.error || msg; } catch {}
      return { success: false, error: msg };
    }
    return response.json();
  }
}