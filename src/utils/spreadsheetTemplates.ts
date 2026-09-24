export type TemplateType = 'clientes' | 'productos' | 'profesionales' | 'tratamientos';

export interface ColumnDefinition {
  key: string;
  label: string;
  required?: boolean;
  example: string | number;
  description: string;
}

export interface SpreadsheetTemplate {
  type: TemplateType;
  title: string;
  fileName: string;
  columns: ColumnDefinition[];
  sampleRows: Record<string, any>[];
}

export const TEMPLATES: Record<TemplateType, SpreadsheetTemplate> = {
  clientes: {
    type: 'clientes',
    title: 'Planilla de Clientes',
    fileName: 'Plantilla_Ejemplo_Clientes.csv',
    columns: [
      { key: 'Nombre', label: 'Nombre', required: true, example: 'Luciana', description: 'Nombre del cliente' },
      { key: 'Apellido', label: 'Apellido', required: false, example: 'Gómez', description: 'Apellido' },
      { key: 'Telefono', label: 'Telefono', required: true, example: '+5491145678901', description: 'Teléfono o WhatsApp con código de país' },
      { key: 'Email', label: 'Email', required: false, example: 'luciana.gomez@gmail.com', description: 'Correo electrónico' },
      { key: 'DNI', label: 'DNI', required: false, example: '35890123', description: 'DNI o documento' },
      { key: 'FechaNacimiento', label: 'FechaNacimiento', required: false, example: '1992-05-18', description: 'Formato YYYY-MM-DD o DD/MM/AAAA' },
      { key: 'Notas', label: 'Notas', required: false, example: 'Piel sensible, alérgica al látex', description: 'Observaciones generales o historial' },
    ],
    sampleRows: [
      {
        Nombre: 'Luciana',
        Apellido: 'Gómez',
        Telefono: '+5491145678901',
        Email: 'luciana.gomez@gmail.com',
        DNI: '35890123',
        FechaNacimiento: '1992-05-18',
        Notas: 'Piel mixta, prefiere turnos por la tarde',
      },
      {
        Nombre: 'Martín',
        Apellido: 'Pérez',
        Telefono: '+5491198765432',
        Email: 'martin.perez@hotmail.com',
        DNI: '31245678',
        FechaNacimiento: '1988-11-23',
        Notas: 'Tratamiento capilar y masajes descontracturantes',
      },
      {
        Nombre: 'Valeria',
        Apellido: 'Rossi',
        Telefono: '+5491123456789',
        Email: 'valeria.rossi@yahoo.com',
        DNI: '38901234',
        FechaNacimiento: '1995-03-08',
        Notas: 'Consulta por lifting de pestañas y cejas',
      },
    ],
  },

  productos: {
    type: 'productos',
    title: 'Planilla de Stock & Insumos',
    fileName: 'Plantilla_Ejemplo_Productos.csv',
    columns: [
      { key: 'Nombre', label: 'Nombre', required: true, example: 'Sérum Ácido Hialurónico 30ml', description: 'Nombre descriptivo del producto' },
      { key: 'Categoria', label: 'Categoria', required: false, example: 'Facial', description: 'Facial, Corporal, Capilar, etc.' },
      { key: 'Marca', label: 'Marca', required: false, example: 'Lidherma', description: 'Marca o laboratorio' },
      { key: 'PrecioCosto', label: 'PrecioCosto', required: false, example: 5500, description: 'Costo unitario de compra' },
      { key: 'PrecioVenta', label: 'PrecioVenta', required: false, example: 12500, description: 'Precio al público' },
      { key: 'Stock', label: 'Stock', required: false, example: 15, description: 'Cantidad actual disponible' },
      { key: 'StockMinimo', label: 'StockMinimo', required: false, example: 4, description: 'Alerta de stock bajo' },
      { key: 'EsVenta', label: 'EsVenta', required: false, example: 'SI', description: 'SI si está disponible para venta' },
      { key: 'EsUsoCabina', label: 'EsUsoCabina', required: false, example: 'NO', description: 'SI si es insumo interno de cabina' },
      { key: 'Notas', label: 'Notas', required: false, example: 'Uso diario hidratante', description: 'Detalles adicionales' },
    ],
    sampleRows: [
      {
        Nombre: 'Sérum Ácido Hialurónico 30ml',
        Categoria: 'Facial',
        Marca: 'Lidherma',
        PrecioCosto: 5500,
        PrecioVenta: 12500,
        Stock: 15,
        StockMinimo: 4,
        EsVenta: 'SI',
        EsUsoCabina: 'NO',
        Notas: 'Hidratación intensiva',
      },
      {
        Nombre: 'Crema Exfoliante con Microgránulos 250g',
        Categoria: 'Corporal',
        Marca: 'Exel',
        PrecioCosto: 7200,
        PrecioVenta: 16000,
        Stock: 8,
        StockMinimo: 2,
        EsVenta: 'SI',
        EsUsoCabina: 'SI',
        Notas: 'Apto para cabina y venta al público',
      },
      {
        Nombre: 'Guantes Descartables Nitrilo Rosa (Caja x100)',
        Categoria: 'Descartables',
        Marca: 'Top Glove',
        PrecioCosto: 6000,
        PrecioVenta: 0,
        Stock: 20,
        StockMinimo: 5,
        EsVenta: 'NO',
        EsUsoCabina: 'SI',
        Notas: 'Insumo de protección para profesionales',
      },
    ],
  },

  profesionales: {
    type: 'profesionales',
    title: 'Planilla de Personal & Profesionales',
    fileName: 'Plantilla_Ejemplo_Profesionales.csv',
    columns: [
      { key: 'Nombre', label: 'Nombre', required: true, example: 'Sofía', description: 'Nombre de pila' },
      { key: 'Apellido', label: 'Apellido', required: false, example: 'Alvarez', description: 'Apellido' },
      { key: 'Telefono', label: 'Telefono', required: true, example: '+5491167890123', description: 'Celular o WhatsApp' },
      { key: 'Email', label: 'Email', required: false, example: 'sofia.alvarez@aurasuite.com', description: 'Correo' },
      { key: 'Rol', label: 'Rol', required: false, example: 'Cosmetóloga', description: 'Cosmetóloga, Esteticista, Masajista, etc.' },
      { key: 'PorcentajeComision', label: 'PorcentajeComision', required: false, example: 35, description: 'Porcentaje de comisión sobre servicios (0 a 100)' },
      { key: 'PinAcceso', label: 'PinAcceso', required: false, example: '4521', description: 'PIN de 4 dígitos para ingresar al portal móvil' },
    ],
    sampleRows: [
      {
        Nombre: 'Sofía',
        Apellido: 'Alvarez',
        Telefono: '+5491167890123',
        Email: 'sofia.alvarez@aurasuite.com',
        Rol: 'Cosmetóloga',
        PorcentajeComision: 35,
        PinAcceso: '4521',
      },
      {
        Nombre: 'Camila',
        Apellido: 'Fernández',
        Telefono: '+5491178901234',
        Email: 'camila.fernandez@aurasuite.com',
        Rol: 'Dermatocosmiatra',
        PorcentajeComision: 40,
        PinAcceso: '1890',
      },
      {
        Nombre: 'Lucas',
        Apellido: 'Benítez',
        Telefono: '+5491189012345',
        Email: 'lucas.benitez@aurasuite.com',
        Rol: 'Masajista',
        PorcentajeComision: 30,
        PinAcceso: '6732',
      },
    ],
  },

  tratamientos: {
    type: 'tratamientos',
    title: 'Planilla de Tratamientos & Servicios',
    fileName: 'Plantilla_Ejemplo_Tratamientos.csv',
    columns: [
      { key: 'Categoria', label: 'Categoria', required: true, example: 'Facial', description: 'Categoría principal (Facial, Corporal, Masajes, etc.)' },
      { key: 'NombreServicio', label: 'NombreServicio', required: true, example: 'Limpieza Profunda con Punta de Diamante', description: 'Nombre del servicio específico' },
      { key: 'DuracionMinutos', label: 'DuracionMinutos', required: false, example: 60, description: 'Duración estimada en minutos' },
      { key: 'PrecioBase', label: 'PrecioBase', required: false, example: 28000, description: 'Precio base del servicio' },
      { key: 'Descripcion', label: 'Descripcion', required: false, example: 'Higiene facial con microdermoabrasión y máscara descongestiva', description: 'Descripción o protocolo' },
    ],
    sampleRows: [
      {
        Categoria: 'Facial',
        NombreServicio: 'Limpieza Profunda con Punta de Diamante',
        DuracionMinutos: 60,
        PrecioBase: 28000,
        Descripcion: 'Higiene facial con microdermoabrasión y máscara descongestiva',
      },
      {
        Categoria: 'Facial',
        NombreServicio: 'Peeling Químico Renovador',
        DuracionMinutos: 45,
        PrecioBase: 32000,
        Descripcion: 'Tratamiento despigmentante y anti-edad con ácidos suaves',
      },
      {
        Categoria: 'Corporal',
        NombreServicio: 'Masaje Descontracturante con Piedras Calientes',
        DuracionMinutos: 50,
        PrecioBase: 25000,
        Descripcion: 'Alivio de tensiones musculares y relajación integral',
      },
      {
        Categoria: 'Mirada & Cejas',
        NombreServicio: 'Lifting de Pestañas con Tinte y Keratina',
        DuracionMinutos: 60,
        PrecioBase: 19000,
        Descripcion: 'Curvatura natural y nutrición profunda para pestañas',
      },
    ],
  },
};

/**
 * Genera y descarga en el navegador un archivo CSV con codificación UTF-8 BOM
 * para que Microsoft Excel lo abra con todos los acentos y caracteres latinos perfectos.
 */
export function downloadTemplateCSV(type: TemplateType) {
  const template = TEMPLATES[type];
  if (!template) return;

  const headerRow = template.columns.map((col) => `"${col.key}"`).join(';');
  const dataRows = template.sampleRows.map((row) => {
    return template.columns
      .map((col) => {
        const val = row[col.key] !== undefined ? row[col.key] : '';
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      })
      .join(';');
  });

  // UTF-8 BOM: \uFEFF asegura que Excel en español/inglés interprete acentos correctamente
  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', template.fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parsea un archivo CSV reconociendo delimitador coma (,), punto y coma (;) o tabulador.
 */
export function parseCSV(csvText: string): { headers: string[]; rows: Record<string, any>[] } {
  // Limpiar BOM si existe
  const cleaned = csvText.replace(/^\uFEFF/, '');
  const lines = cleaned.split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Detectar separador común según conteo en la primera línea
  const firstLine = lines[0];
  const semiCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  let delimiter = ';';
  if (tabCount > semiCount && tabCount > commaCount) {
    delimiter = '\t';
  } else if (commaCount > semiCount) {
    delimiter = ',';
  } else {
    delimiter = ';';
  }

  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const headers = parseLine(lines[0]).map((h) => h.replace(/^["']+|["']+$/g, '').trim());

  const rows: Record<string, any>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const rawValues = parseLine(lines[i]);
    if (rawValues.every((v) => v === '')) continue; // Ignorar líneas vacías

    const rowObj: Record<string, any> = {};
    headers.forEach((h, colIdx) => {
      let val = rawValues[colIdx] ? rawValues[colIdx].replace(/^["']+|["']+$/g, '').trim() : '';
      rowObj[h] = val;
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

/**
 * Normaliza los nombres de columnas comunes para mapear datos desde diferentes sistemas.
 */
export function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Parsea importes monetarios o números desde strings con formatos diversos:
 * Ejemplos soportados:
 * - "$ 3.000,00" -> 3000
 * - "$18,000.00" -> 18000
 * - "$31,000"    -> 31000
 * - "$100.000"   -> 100000
 * - "2 X $80.000"-> 80000
 * - "$ 2.500,00" -> 2500
 * - 25000        -> 25000
 * - "15.50"      -> 15.5
 * - "15,50"      -> 15.5
 */
export function parseMoneyOrNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (!str) return 0;

  // 1. Si contiene símbolo de moneda $, extraer el número tras el $
  const dollarMatch = str.match(/\$\s*([0-9][0-9.,]*)/i);
  let cleaned = '';
  if (dollarMatch) {
    cleaned = dollarMatch[1].trim();
  } else {
    // 2. Si no hay $, buscar los bloques numéricos con separadores
    const allMatches = [...str.matchAll(/([0-9][0-9.,]*)/g)];
    if (allMatches.length === 0) return 0;
    // Si hay promo como "2 x 50.000", el precio es el último bloque
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
 * Parsea un entero (ej: minutos de duración o cantidad) con valor por defecto seguro.
 */
export function parseInteger(val: any, fallback: number = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : Math.round(val);
  const cleanStr = String(val).replace(/[^0-9]/g, '');
  if (!cleanStr) return fallback;
  const num = parseInt(cleanStr, 10);
  return isNaN(num) || num <= 0 ? fallback : num;
}

