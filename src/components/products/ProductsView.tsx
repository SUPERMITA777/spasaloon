import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { api } from '../../services/api';
import { downloadTemplateCSV } from '../../utils/spreadsheetTemplates';
import { ImportSpreadsheetModal } from '../common/ImportSpreadsheetModal';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Tag,
  Check,
  LayoutGrid,
  Table,
  Download,
  Upload,
  Edit2,
  Trash2,
  Boxes,
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const { products, refreshAllData, addToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'supply' | 'low_stock'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'spreadsheet'>(() => {
    return (localStorage.getItem('hikari_view_mode_products') as 'grid' | 'spreadsheet') || 'grid';
  });

  const handleSetViewMode = (mode: 'grid' | 'spreadsheet') => {
    setViewMode(mode);
    localStorage.setItem('hikari_view_mode_products', mode);
  };
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null);

  // Form Edit Product
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState<Product | null>(null);

  // Form New / Edit Product fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Facial');
  const [costPrice, setCostPrice] = useState(5000);
  const [salePrice, setSalePrice] = useState(12000);
  const [stockQuantity, setStockQuantity] = useState(10);
  const [minStockAlert, setMinStockAlert] = useState(3);
  const [isInternalSupply, setIsInternalSupply] = useState(false);
  const [isForSale, setIsForSale] = useState(true);
  const [brand, setBrand] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Form Stock Movement
  const [movementQty, setMovementQty] = useState(5);
  const [movementType, setMovementType] = useState<'purchase' | 'adjustment' | 'waste'>('purchase');
  const [movementNotes, setMovementNotes] = useState('');

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterType === 'sale') return p.is_for_sale;
    if (filterType === 'supply') return p.is_internal_supply;
    if (filterType === 'low_stock') return p.stock_quantity <= p.min_stock_alert;
    return true;
  });

  const handleOpenCreate = () => {
    setName('');
    setCategory('Facial');
    setBrand('');
    setCostPrice(5000);
    setSalePrice(12000);
    setStockQuantity(10);
    setMinStockAlert(3);
    setIsInternalSupply(false);
    setIsForSale(true);
    setNotes('');
    setIsNewProductOpen(true);
  };

  const handleOpenEditProduct = (prod: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProduct(prod);
    setName(prod.name);
    setCategory(prod.category);
    setBrand(prod.brand || '');
    setCostPrice(prod.cost_price);
    setSalePrice(prod.sale_price);
    setStockQuantity(prod.stock_quantity);
    setMinStockAlert(prod.min_stock_alert);
    setIsInternalSupply(prod.is_internal_supply);
    setIsForSale(prod.is_for_sale);
    setNotes(prod.notes || '');
    setIsEditModalOpen(true);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.createProduct({
        name,
        category,
        brand: brand || null,
        cost_price: Number(costPrice),
        sale_price: Number(salePrice),
        stock_quantity: Number(stockQuantity),
        min_stock_alert: Number(minStockAlert),
        is_internal_supply: isInternalSupply,
        is_for_sale: isForSale,
        notes: notes || null,
      });

      await refreshAllData();
      addToast({ type: 'success', title: 'Producto registrado exitosamente' });
      setIsNewProductOpen(false);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al registrar producto', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      setLoading(true);
      await api.updateProduct(editingProduct.id, {
        name,
        category,
        brand: brand || null,
        cost_price: Number(costPrice),
        sale_price: Number(salePrice),
        stock_quantity: Number(stockQuantity),
        min_stock_alert: Number(minStockAlert),
        is_internal_supply: isInternalSupply,
        is_for_sale: isForSale,
        notes: notes || null,
      });

      await refreshAllData();
      addToast({ type: 'success', title: 'Producto actualizado exitosamente' });
      setIsEditModalOpen(false);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al actualizar producto', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (prod: Product) => {
    try {
      setLoading(true);
      await api.deleteProduct(prod.id);
      await refreshAllData();
      addToast({ type: 'info', title: 'Producto eliminado', message: `${prod.name} fue eliminado del inventario.` });
      setConfirmDeleteProduct(null);
      setIsEditModalOpen(false);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al eliminar producto', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForStock) return;
    try {
      setLoading(true);
      const qty = movementType === 'waste' ? -Math.abs(movementQty) : Math.abs(movementQty);
      await api.registerStockMovement(selectedProductForStock.id, {
        movement_type: movementType,
        quantity: qty,
        unit_cost: selectedProductForStock.cost_price,
        notes: movementNotes || null,
        created_by: 'Admin',
      });

      await refreshAllData();
      addToast({ type: 'success', title: 'Movimiento de stock registrado' });
      setSelectedProductForStock(null);
      setMovementQty(5);
      setMovementNotes('');
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al registrar stock', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-silk-100/60">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-graphite-900 leading-tight">
            Stock & Insumos de Cabina
          </h1>
          <p className="text-xs text-graphite-500 mt-0.5">
            Control de productos para venta a clientes y consumos internos por tratamiento
          </p>
        </div>

        {/* Action Buttons: Import, Template, New */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Modo: Cuadrícula vs Planilla */}
          <div className="flex bg-white p-1 rounded-2xl border border-rose-gold-200 shadow-sm">
            <button
              onClick={() => handleSetViewMode('grid')}
              title="Vista de Tarjetas / Cuadrícula"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-rose-gold-50 text-rose-gold-800 shadow-xs font-bold border border-rose-gold-200'
                  : 'text-graphite-600 hover:text-graphite-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tarjetas</span>
            </button>
            <button
              onClick={() => handleSetViewMode('spreadsheet')}
              title="Vista en Modo Planilla (Tabla interactiva)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === 'spreadsheet'
                  ? 'bg-rose-gold-50 text-rose-gold-800 shadow-xs font-bold border border-rose-gold-200'
                  : 'text-graphite-600 hover:text-graphite-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Modo Planilla</span>
            </button>
          </div>

          <button
            onClick={() => downloadTemplateCSV('productos')}
            title="Descargar archivo modelo en formato CSV/Excel con datos de ejemplo"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-rose-gold-200 text-graphite-700 hover:bg-rose-gold-50 text-xs font-semibold shadow-soft transition-all"
          >
            <Download className="w-3.5 h-3.5 text-rose-gold-600" />
            <span className="hidden md:inline">Planilla Ejemplo</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            title="Importar productos masivamente desde otro sistema"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-rose-gold-200 text-rose-gold-800 hover:bg-rose-gold-50 text-xs font-semibold shadow-soft transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-rose-gold-600" />
            <span>Importar</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 hover:from-rose-gold-600 hover:to-rose-gold-700 text-white text-xs font-semibold shadow-soft hover:shadow-soft-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white rounded-3xl border border-rose-gold-200/80 shadow-soft flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-rose-gold-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, categoría o marca..."
            className="w-full text-xs text-graphite-800 placeholder:text-graphite-400 focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex bg-silk-100 p-1 rounded-2xl border border-rose-gold-200/60">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'sale', label: 'Venta al Público' },
            { id: 'supply', label: 'Uso en Cabina' },
            { id: 'low_stock', label: '⚠️ Stock Bajo' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all ${
                filterType === tab.id
                  ? 'bg-white text-rose-gold-800 shadow-sm font-bold'
                  : 'text-graphite-600 hover:text-graphite-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENIDO: MODO PLANILLA vs CUADRÍCULA */}
      {viewMode === 'spreadsheet' ? (
        <div className="bg-white rounded-3xl border border-rose-gold-200/80 shadow-soft overflow-hidden">
          <div className="p-4 border-b border-rose-gold-100 bg-silk-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-rose-gold-600" />
              <span className="text-xs font-bold text-graphite-900">
                Planilla de Productos ({filteredProducts.length})
              </span>
            </div>
            <span className="text-[11px] text-graphite-500 italic">
              💡 Haz clic en cualquier fila para ver, editar o eliminar el producto
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-rose-gold-100 bg-silk-100/60 text-graphite-600 font-bold text-[11px]">
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-3">Categoría</th>
                  <th className="py-3 px-3">Marca</th>
                  <th className="py-3 px-3 text-right">Precio Venta</th>
                  <th className="py-3 px-3 text-right">Costo</th>
                  <th className="py-3 px-3 text-center">Stock Actual</th>
                  <th className="py-3 px-3 text-center">Alerta Mín.</th>
                  <th className="py-3 px-3 text-center">Destino</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-gold-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-graphite-400">
                      No se encontraron productos coincidentes.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod) => {
                    const isLowStock = prod.stock_quantity <= prod.min_stock_alert;
                    return (
                      <tr
                        key={prod.id}
                        onClick={() => handleOpenEditProduct(prod)}
                        className={`hover:bg-rose-gold-50/50 cursor-pointer transition-colors ${
                          isLowStock ? 'bg-amber-50/30' : ''
                        }`}
                        title="Haz clic para ver o editar este producto"
                      >
                        <td className="py-3 px-4 font-semibold text-graphite-900 whitespace-nowrap">
                          {prod.name}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="text-[10px] font-semibold text-rose-gold-700 bg-rose-gold-50 px-2 py-0.5 rounded-lg border border-rose-gold-200">
                            {prod.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-graphite-600 whitespace-nowrap">
                          {prod.brand || '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-graphite-900 whitespace-nowrap">
                          ${prod.sale_price.toLocaleString('es-AR')}
                        </td>
                        <td className="py-3 px-3 text-right text-graphite-500 whitespace-nowrap">
                          ${prod.cost_price.toLocaleString('es-AR')}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-lg font-bold text-[11px] ${
                              isLowStock
                                ? 'bg-amber-100 text-amber-800 animate-pulse border border-amber-300'
                                : 'bg-silk-100 text-graphite-700'
                            }`}
                          >
                            {prod.stock_quantity} {prod.unit}s
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-graphite-500 whitespace-nowrap">
                          {prod.min_stock_alert}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1 text-[10px]">
                            {prod.is_for_sale && (
                              <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">
                                Venta
                              </span>
                            )}
                            {prod.is_internal_supply && (
                              <span className="bg-mauve-50 text-mauve-700 px-1.5 py-0.5 rounded border border-mauve-200 font-semibold">
                                Cabina
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedProductForStock(prod)}
                              title="Ajustar Stock"
                              className="px-2 py-1 bg-silk-100 hover:bg-rose-gold-100 text-rose-gold-800 rounded-lg font-semibold text-[11px] border border-rose-gold-200 transition-colors"
                            >
                              Stock
                            </button>
                            <button
                              onClick={(e) => handleOpenEditProduct(prod, e)}
                              title="Editar Producto"
                              className="p-1 rounded-lg hover:bg-rose-gold-100 text-graphite-600 hover:text-rose-gold-700 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteProduct(prod);
                              }}
                              title="Eliminar Producto"
                              className="p-1 rounded-lg hover:bg-rose-100 text-graphite-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISTA DE TARJETAS / CUADRÍCULA TRADICIONAL */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((prod) => {
            const isLowStock = prod.stock_quantity <= prod.min_stock_alert;

            return (
              <div
                key={prod.id}
                onClick={() => handleOpenEditProduct(prod)}
                className={`bg-white rounded-3xl p-5 border shadow-soft hover:shadow-soft-md transition-all space-y-4 cursor-pointer ${
                  isLowStock ? 'border-amber-300 ring-1 ring-amber-200' : 'border-rose-gold-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-gold-600 bg-rose-gold-50 px-2 py-0.5 rounded-lg border border-rose-gold-200">
                      {prod.category}
                    </span>
                    <h3 className="font-serif font-bold text-base text-graphite-900 mt-1.5 leading-tight">
                      {prod.name}
                    </h3>
                    {prod.brand && <p className="text-xs text-graphite-400">{prod.brand}</p>}
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                      isLowStock
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-silk-100 text-graphite-700'
                    }`}
                  >
                    {prod.stock_quantity} {prod.unit}s
                  </span>
                </div>

                {/* Price & Cost */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-silk-50 rounded-2xl border border-rose-gold-100 text-xs">
                  <div>
                    <span className="text-graphite-500 block text-[10px]">Precio Venta:</span>
                    <span className="font-bold text-graphite-900 text-sm">
                      ${prod.sale_price.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-graphite-500 block text-[10px]">Costo:</span>
                    <span className="font-semibold text-graphite-600">
                      ${prod.cost_price.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <div className="pt-2 border-t border-rose-gold-100 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1.5 text-[10px]">
                    {prod.is_for_sale && (
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
                        Venta
                      </span>
                    )}
                    {prod.is_internal_supply && (
                      <span className="bg-mauve-50 text-mauve-700 px-2 py-0.5 rounded-md font-semibold border border-mauve-200">
                        Cabina
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedProductForStock(prod)}
                      className="px-3 py-1.5 rounded-xl bg-silk-100 hover:bg-rose-gold-100 text-rose-gold-800 text-xs font-semibold border border-rose-gold-200 transition-colors"
                    >
                      Ajustar Stock
                    </button>
                    <button
                      onClick={(e) => handleOpenEditProduct(prod, e)}
                      title="Editar"
                      className="p-1.5 rounded-xl hover:bg-silk-100 text-graphite-500 hover:text-rose-gold-700 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Importar Planilla Masiva */}
      <ImportSpreadsheetModal
        type="productos"
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={refreshAllData}
        addToast={addToast}
      />

      {/* Modal Ajustar Stock */}
      {selectedProductForStock && (
        <div className="fixed inset-0 z-50 bg-graphite-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-soft-lg border border-rose-gold-200 p-6 space-y-4 animate-scale-up text-xs">
            <h3 className="font-serif font-bold text-base text-graphite-900">
              Registrar Movimiento de Stock
            </h3>
            <p className="text-graphite-500 font-semibold">{selectedProductForStock.name}</p>

            <form onSubmit={handleStockMovement} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1 text-graphite-700">Tipo de Movimiento</label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-silk-100 rounded-xl">
                  {[
                    { id: 'purchase', label: 'Compra / +' },
                    { id: 'adjustment', label: 'Ajuste' },
                    { id: 'waste', label: 'Merma / -' },
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setMovementType(m.id as any)}
                      className={`py-1 text-center font-bold rounded-lg ${
                        movementType === m.id ? 'bg-white shadow-sm text-rose-gold-700' : 'text-graphite-500'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-graphite-700">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={movementQty}
                  onChange={(e) => setMovementQty(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-graphite-700">Motivo / Notas</label>
                <input
                  type="text"
                  placeholder="Ej: Factura proveedor #1234 o derrame"
                  value={movementNotes}
                  onChange={(e) => setMovementNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-rose-gold-100">
                <button
                  type="button"
                  onClick={() => setSelectedProductForStock(null)}
                  className="px-4 py-2 rounded-xl border border-rose-gold-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-rose-gold-600 hover:bg-rose-gold-700 text-white rounded-xl font-bold shadow-soft"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Producto */}
      {isNewProductOpen && (
        <div className="fixed inset-0 z-50 bg-graphite-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-soft-lg border border-rose-gold-200 p-6 space-y-4 animate-scale-up text-xs max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif font-bold text-lg text-graphite-900">
              Registrar Nuevo Producto / Insumo
            </h3>

            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Emulsión de Limpieza 200ml"
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-rose-gold-200 bg-white"
                  >
                    <option value="Facial">Facial</option>
                    <option value="Corporal">Corporal</option>
                    <option value="Capilar">Capilar</option>
                    <option value="Descartables">Descartables</option>
                    <option value="Aparatología">Aparatología</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Marca / Laboratorio</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ej: Lidherma"
                    className="w-full p-2.5 rounded-xl border border-rose-gold-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Costo Unitario ($) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-rose-gold-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Precio Venta ($) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-rose-gold-200 font-bold text-rose-gold-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Stock Inicial *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-rose-gold-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Alerta Stock Mínimo *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-rose-gold-200 font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={isForSale}
                    onChange={(e) => setIsForSale(e.target.checked)}
                    className="rounded text-rose-gold-600"
                  />
                  Vendible a clientes
                </label>
                <label className="flex items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={isInternalSupply}
                    onChange={(e) => setIsInternalSupply(e.target.checked)}
                    className="rounded text-rose-gold-600"
                  />
                  Uso en cabina
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-rose-gold-100">
                <button type="button" onClick={() => setIsNewProductOpen(false)} className="px-4 py-2 rounded-xl border">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-rose-gold-600 text-white rounded-xl font-bold shadow-soft">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar / Eliminar Producto Existente */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-graphite-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-soft-lg border border-rose-gold-200 p-6 space-y-4 animate-scale-up text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-rose-gold-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-graphite-900">
                  Editar Producto
                </h3>
                <span className="text-[11px] text-graphite-500">ID: {editingProduct.id}</span>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-graphite-400 hover:text-graphite-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-rose-gold-200 bg-white"
                  >
                    <option value="Facial">Facial</option>
                    <option value="Corporal">Corporal</option>
                    <option value="Capilar">Capilar</option>
                    <option value="Descartables">Descartables</option>
                    <option value="Aparatología">Aparatología</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Marca / Laboratorio</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-rose-gold-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Costo Unitario ($) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-rose-gold-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Precio Venta ($) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-rose-gold-200 font-bold text-rose-gold-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Stock Actual *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-rose-gold-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Alerta Stock Mínimo *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-rose-gold-200 font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={isForSale}
                    onChange={(e) => setIsForSale(e.target.checked)}
                    className="rounded text-rose-gold-600"
                  />
                  Vendible a clientes
                </label>
                <label className="flex items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={isInternalSupply}
                    onChange={(e) => setIsInternalSupply(e.target.checked)}
                    className="rounded text-rose-gold-600"
                  />
                  Uso en cabina
                </label>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-rose-gold-100">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteProduct(editingProduct)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar Producto</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-rose-gold-200 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-rose-gold-600 hover:bg-rose-gold-700 text-white rounded-xl font-bold shadow-soft"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación de Producto */}
      {confirmDeleteProduct && (
        <div className="fixed inset-0 z-50 bg-graphite-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-soft-lg border border-rose-gold-200 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>

            <div>
              <h3 className="font-serif font-bold text-base text-graphite-900">
                ¿Eliminar {confirmDeleteProduct.name}?
              </h3>
              <p className="text-xs text-graphite-500 mt-1">
                Esta acción removerá el producto del inventario activo.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteProduct(null)}
                className="px-3.5 py-1.5 rounded-xl border border-rose-gold-200 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProduct(confirmDeleteProduct)}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
