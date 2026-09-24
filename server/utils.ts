/**
 * Utilidades compartidas para parseo de datos en el backend de Hikari Suite
 */

/**
 * Parsea importes monetarios o números desde strings con formatos diversos:
 * Ejemplos: "$ 3.000,00", "$18,000.00", "$31,000", "$100.000", "2 X $80.000", etc.
 */
export function parseMoneyOrNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (!str) return 0;

  // 1. Si contiene $, extraemos el número que sigue a $
  const dollarMatch = str.match(/\$\s*([0-9][0-9.,]*)/i);
  let cleaned = '';
  if (dollarMatch) {
    cleaned = dollarMatch[1].trim();
  } else {
    // 2. Si no hay $, buscar todos los bloques numéricos con separadores
    const allMatches = [...str.matchAll(/([0-9][0-9.,]*)/g)];
    if (allMatches.length === 0) return 0;
    // Si hay promo (ej. "2 x 50.000"), el precio es el último bloque
    cleaned = allMatches[allMatches.length - 1][1].trim();
  }

  if (!cleaned) return 0;

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      // Formato Europeo / Latino: 3.000,00 o 1.250.000,50
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato US / Anglo: 3,000.00 o 1,250,000.50
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Solo coma
    const parts = cleaned.split(',');
    if (parts.length > 2) {
      cleaned = cleaned.replace(/,/g, '');
    } else if (parts.length === 2) {
      const decimals = parts[1];
      if (decimals.length === 3) {
        // e.g. 31,000 o 5,000 -> separador de miles
        cleaned = cleaned.replace(',', '');
      } else {
        // e.g. 25,50 o 3000,00 -> decimal
        cleaned = parts[0] + '.' + parts[1];
      }
    }
  } else if (hasDot) {
    // Solo punto
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = cleaned.replace(/\./g, '');
    } else if (parts.length === 2) {
      const decimals = parts[1];
      if (decimals.length === 3) {
        // e.g. 100.000 o 3.000 -> separador de miles
        cleaned = cleaned.replace('.', '');
      } else {
        // e.g. 15.5 o 15.50 -> decimal
        cleaned = parts[0] + '.' + parts[1];
      }
    }
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Parsea un entero con valor por defecto seguro.
 */
export function parseInteger(val: any, fallback: number = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : Math.round(val);
  const cleanStr = String(val).replace(/[^0-9]/g, '');
  if (!cleanStr) return fallback;
  const num = parseInt(cleanStr, 10);
  return isNaN(num) || num <= 0 ? fallback : num;
}
