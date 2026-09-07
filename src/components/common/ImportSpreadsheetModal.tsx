import React, { useState, useRef } from 'react';
import {
  TemplateType,
  TEMPLATES,
  downloadTemplateCSV,
  parseCSV,
  normalizeKey,
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
        const text = event.target?.result as string;
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
    reader.readAsText(selectedFile, 'UTF-8');
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
          const esVentaVal = String(normalizedRow['esventa'] || '').toUpperCase();
          const esCabinaVal = String(normalizedRow['esusocabina'] || '').toUpperCase();
          return {
            name: normalizedRow['nombre'] || normalizedRow['producto'] || '',
            category: normalizedRow['categoria'] || 'General',
            brand: normalizedRow['marca'] || null,
            cost_price: Number(normalizedRow['preciocosto'] || normalizedRow['costo']) || 0,
            sale_price: Number(normalizedRow['precioventa'] || normalizedRow['precio']) || 0,
            stock_quantity: Number(normalizedRow['stock'] || normalizedRow['cantidad']) || 0,
            min_stock_alert: Number(normalizedRow['stockminimo'] || normalizedRow['minimo']) || 5,
            is_for_sale: esVentaVal !== 'NO' && esVentaVal !== '0',
            is_internal_supply: esCabinaVal === 'SI' || esCabinaVal === '1',
            notes: normalizedRow['notas'] || null,
          };
        }

        if (type === 'profesionales') {
          return {
            first_name: normalizedRow['nombre'] || '',
            last_name: normalizedRow['apellido'] || '',
            phone: normalizedRow['telefono'] || normalizedRow['celular'] || '',
            email: normalizedRow['email'] || null,
            role: normalizedRow['rol'] || 'esteticista',
            default_commission_rate: Number(normalizedRow['porcentajecomision'] || normalizedRow['comision']) || 30,
            pin_code: String(normalizedRow['pinacceso'] || normalizedRow['pin'] || '1234'),
          };
        }

        if (type === 'tratamientos') {
          return {
            category_name: normalizedRow['categoria'] || 'General',
            sub_name: normalizedRow['nombreservicio'] || normalizedRow['servicio'] || normalizedRow['nombre'] || '',
            duration_minutes: Number(normalizedRow['duracionminutos'] || normalizedRow['duracion']) || 45,
            base_price: Number(normalizedRow['preciobase'] || normalizedRow['precio']) || 0,
            description: normalizedRow['descripcion'] || null,
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
              <div className="border border-rose-gold-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="sticky top-0 bg-silk-200/90 text-graphite-700 font-bold border-b border-rose-gold-200">
                    <tr>
                      {rawHeaders.slice(0, 5).map((h, i) => (
                        <th key={i} className="py-2 px-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-gold-100 bg-white">
                    {parsedRows.slice(0, 5).map((r, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-silk-50">
                        {rawHeaders.slice(0, 5).map((h, colIdx) => (
                          <td key={colIdx} className="py-1.5 px-3 truncate max-w-[150px]">
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
