import React, { useState, useRef } from 'react';
import {
  TemplateType,
  TEMPLATES,
  downloadTemplateCSV,
  parseCSV,
  normalizeKey,
  parseMoneyOrNumber,
  parseInteger,
} from '../../utils/spreadsheetTemplates';
import { api } from '../../services/api';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';

interface ImportSpreadsheetModalProps {
  type: TemplateType;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  addToast: (toast: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message?: string }) => void;
}

export const ImportSpreadsheetModal: React.FC<ImportSpreadsheetModalProps> = ({
  type,
  isOpen,
  onClose,
  onSuccess,
  addToast,
}) => {
  const template = TEMPLATES[type];
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  const processFile = (selectedFile: File) => {
    setError(null);
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        let text = '';
        try {
          const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
          text = utf8Decoder.decode(buffer);
        } catch {
          // Decodificación alternativa para archivos guardados en formato ANSI / Windows-1252 por Excel
          const winDecoder = new TextDecoder('windows-1252');
          text = winDecoder.decode(buffer);
        }

        // Corrección de caracteres con símbolo de reemplazo común en exportaciones de Excel
        text = text
          .replace(/UAS/gi, 'UÑAS')
          .replace(/PESTAAS/gi, 'PESTAÑAS')
          .replace(/DISEO/gi, 'DISEÑO')
          .replace(/AO/gi, 'AÑO');

        const { headers, rows } = parseCSV(text);

        if (rows.length === 0) {
          setError('El archivo parece estar vacío o no contiene filas con datos válidos.');
          return;
        }

        setRawHeaders(headers);
        setParsedRows(rows);
      } catch (err: any) {
        setError(`Error al leer el archivo: ${err.message}`);
      }
    };
    reader.onerror = () => {
      setError('No se pudo leer el archivo seleccionado.');
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setRawHeaders([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;

    try {
      setLoading(true);

      // Mapear filas leídas a los campos exactos según el tipo
      const mappedItems = parsedRows.map((row) => {
        const normalizedRow: Record<string, any> = {};
        for (const [k, v] of Object.entries(row)) {
          normalizedRow[normalizeKey(k)] = v;
        }

        if (type === 'clientes') {
          return {
            first_name: normalizedRow['nombre'] || normalizedRow['firstname'] || '',
            last_name: normalizedRow['apellido'] || normalizedRow['lastname'] || '',
            phone: normalizedRow['telefono'] || normalizedRow['phone'] || normalizedRow['whatsapp'] || '',
            email: normalizedRow['email'] || normalizedRow['correo'] || null,
            dni: normalizedRow['dni'] || normalizedRow['documento'] || null,
            birth_date: normalizedRow['fechanacimiento'] || normalizedRow['cumpleanos'] || null,
            notes: normalizedRow['notas'] || normalizedRow['observaciones'] || null,
          };
        }

        if (type === 'productos') {
          const esVentaVal = String(normalizedRow['esventa'] || normalizedRow['venta'] || '').toUpperCase();
          const esCabinaVal = String(normalizedRow['esusocabina'] || normalizedRow['cabina'] || normalizedRow['usocabina'] || '').toUpperCase();
          return {
            name: normalizedRow['nombre'] || normalizedRow['producto'] || normalizedRow['item'] || '',
            category: normalizedRow['categoria'] || normalizedRow['rubro'] || 'General',
            brand: normalizedRow['marca'] || null,
            cost_price: parseMoneyOrNumber(normalizedRow['preciocosto'] || normalizedRow['costo'] || normalizedRow['costprice']),
            sale_price: parseMoneyOrNumber(normalizedRow['precioventa'] || normalizedRow['precio'] || normalizedRow['saleprice'] || normalizedRow['valor'] || normalizedRow['monto']),
            stock_quantity: parseMoneyOrNumber(normalizedRow['stock'] || normalizedRow['cantidad'] || normalizedRow['stockquantity']),
            min_stock_alert: parseMoneyOrNumber(normalizedRow['stockminimo'] || normalizedRow['minimo'] || normalizedRow['minstock']) || 5,
            is_for_sale: esVentaVal !== 'NO' && esVentaVal !== '0',
            is_internal_supply: esCabinaVal === 'SI' || esCabinaVal === '1',
            notes: normalizedRow['notas'] || normalizedRow['descripcion'] || null,
          };
        }

        if (type === 'profesionales') {
          return {
            first_name: normalizedRow['nombre'] || normalizedRow['firstname'] || '',
            last_name: normalizedRow['apellido'] || normalizedRow['lastname'] || '',
            phone: normalizedRow['telefono'] || normalizedRow['celular'] || normalizedRow['phone'] || '',
            email: normalizedRow['email'] || normalizedRow['correo'] || null,
            role: normalizedRow['rol'] || normalizedRow['puesto'] || 'esteticista',
            default_commission_rate: parseMoneyOrNumber(normalizedRow['porcentajecomision'] || normalizedRow['comision'] || normalizedRow['commission']) || 30,
            pin_code: String(normalizedRow['pinacceso'] || normalizedRow['pin'] || '1234'),
          };
        }

        if (type === 'tratamientos') {
          return {
            category_name: (normalizedRow['categoria'] || normalizedRow['category'] || normalizedRow['rubro'] || normalizedRow['tipo'] || 'General').trim(),
            sub_name: (normalizedRow['nombreservicio'] || normalizedRow['servicio'] || normalizedRow['subtratamiento'] || normalizedRow['nombre'] || normalizedRow['tratamiento'] || normalizedRow['item'] || normalizedRow['descripcion'] || 'Servicio General').trim(),
            duration_minutes: parseInteger(normalizedRow['duracionminutos'] || normalizedRow['duracion'] || normalizedRow['tiempo'] || normalizedRow['minutos'], 45),
            base_price: parseMoneyOrNumber(normalizedRow['preciobase'] || normalizedRow['precio'] || normalizedRow['baseprice'] || normalizedRow['price'] || normalizedRow['valor'] || normalizedRow['monto'] || normalizedRow['tarifa'] || normalizedRow['arancel'] || normalizedRow['costo']),
            description: normalizedRow['descripcion'] || normalizedRow['detalle'] || normalizedRow['notas'] || normalizedRow['observaciones'] || normalizedRow['zona'] || null,
          };
        }

        return row;
      });

      let res: { success: boolean; count: number; message: string };
      if (type === 'clientes') {
        res = await api.batchImportClients(mappedItems);
      } else if (type === 'productos') {
        res = await api.batchImportProducts(mappedItems);
      } else if (type === 'profesionales') {
        res = await api.batchImportStaff(mappedItems);
      } else {
        res = await api.batchImportTreatments(mappedItems);
      }

      if (res.success) {
        addToast({
          type: 'success',
          title: '✦ Importación Exitosa',
          message: res.message,
        });
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(`Error al guardar en la base de datos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-soft-lg border border-rose-gold-200 p-6 space-y-5 animate-in fade-in zoom-in duration-200 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-rose-gold-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-gold-100 text-rose-gold-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-graphite-900">
                Importar {template.title}
              </h2>
              <p className="text-xs text-graphite-500">
                Carga masiva de datos desde planillas Excel o CSV de otro sistema
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-silk-100 text-graphite-400 hover:text-graphite-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tarjeta de descarga de planilla de ejemplo */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-blush-50 to-silk-100 border border-rose-gold-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-semibold text-graphite-900 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-rose-gold-600" />
              ¿No tienes el formato exacto?
            </span>
            <p className="text-graphite-600 text-[11px]">
              Descarga la planilla modelo con columnas y filas de ejemplo listas para rellenar.
            </p>
          </div>

          <button
            onClick={() => downloadTemplateCSV(type)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-rose-gold-200 text-rose-gold-800 font-semibold hover:bg-rose-gold-50 shadow-sm transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Planilla Ejemplo</span>
          </button>
        </div>

        {/* Zona de Carga de Archivo */}
        {!file ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-rose-gold-300 hover:border-rose-gold-500 rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 bg-silk-50/50 hover:bg-rose-gold-50/30 flex flex-col items-center justify-center gap-3"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-rose-gold-100 text-rose-gold-600 flex items-center justify-center shadow-soft">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-graphite-900">
                Haz clic para seleccionar tu planilla o arrástrala aquí
              </p>
              <p className="text-[11px] text-graphite-500 mt-1">
                Archivos compatibles: <span className="font-mono font-semibold">.CSV</span> (delimitado por coma, punto y coma o tabulación)
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Archivo Seleccionado */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-silk-100 border border-rose-gold-200">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-rose-gold-600" />
                <div>
                  <div className="text-xs font-bold text-graphite-900">{file.name}</div>
                  <div className="text-[11px] text-graphite-500">
                    {parsedRows.length} registros listos para importar
                  </div>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="text-xs text-rose-gold-700 hover:text-rose-gold-900 font-semibold underline"
              >
                Cambiar archivo
              </button>
            </div>

            {/* Vista Previa de Filas */}
            {parsedRows.length > 0 && (
              <div className="border border-rose-gold-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto overflow-x-auto shadow-inner bg-white">
                <table className="w-full text-left border-collapse text-[11px] min-w-full">
                  <thead className="sticky top-0 bg-silk-200/90 backdrop-blur-sm text-graphite-700 font-bold border-b border-rose-gold-200 z-10">
                    <tr>
                      {rawHeaders.map((h, i) => (
                        <th key={i} className="py-2 px-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-gold-100 bg-white">
                    {parsedRows.slice(0, 8).map((r, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-silk-50/70 transition-colors">
                        {rawHeaders.map((h, colIdx) => (
                          <td key={colIdx} className="py-1.5 px-3 truncate max-w-[200px] text-graphite-800">
                            {String(r[h] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Mensaje de Error si existiera */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-rose-gold-100">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-rose-gold-200 text-xs font-semibold text-graphite-700 hover:bg-silk-100 transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={!file || parsedRows.length === 0 || loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 hover:from-rose-gold-600 hover:to-rose-gold-700 text-white text-xs font-semibold shadow-soft disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Importando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirmar e Importar {parsedRows.length > 0 ? `(${parsedRows.length})` : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
