import { Router } from 'express';
import { db } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';
import { io } from '../index.js';
import { parseMoneyOrNumber } from '../utils.js';

export const productsRouter = Router();

// Listar productos con filtros y alertas de stock
productsRouter.get('/', (req, res) => {
  try {
    const { category, is_for_sale, is_internal_supply, low_stock } = req.query;
    let query = `SELECT * FROM products WHERE deleted_at IS NULL`;
    const params: any[] = [];

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }
    if (is_for_sale !== undefined) {
      query += ` AND is_for_sale = ?`;
      params.push(is_for_sale === 'true' ? 1 : 0);
    }
    if (is_internal_supply !== undefined) {
      query += ` AND is_internal_supply = ?`;
      params.push(is_internal_supply === 'true' ? 1 : 0);
    }
    if (low_stock === 'true') {
      query += ` AND stock_quantity <= min_stock_alert`;
    }

    query += ` ORDER BY name ASC`;
    const products = db.prepare(query).all(...params);
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear producto
productsRouter.post('/', (req, res) => {
  try {
    const { name, barcode, sku, category, brand, cost_price, sale_price, stock_quantity, min_stock_alert, unit, is_internal_supply, is_for_sale, supplier, notes } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    const insert = db.transaction(() => {
      db.prepare(`
        INSERT INTO products (id, name, barcode, sku, category, brand, cost_price, sale_price, stock_quantity, min_stock_alert, unit, is_internal_supply, is_for_sale, supplier, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, name, barcode || null, sku || null, category || 'General', brand || null,
        cost_price || 0, sale_price || 0, stock_quantity || 0, min_stock_alert || 5,
        unit || 'unidad', is_internal_supply ? 1 : 0, is_for_sale !== false ? 1 : 0,
        supplier || null, notes || null, now, now
      );

      if (stock_quantity > 0) {
        db.prepare(`
          INSERT INTO stock_movements (id, product_id, movement_type, quantity, unit_cost, notes, created_by, created_at, updated_at)
          VALUES (?, ?, 'purchase', ?, ?, 'Stock inicial', 'Admin', ?, ?)
        `).run(uuidv4(), id, stock_quantity, cost_price || 0, now, now);
      }
    });

    insert();
    const created = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
    io.emit('product:created', created);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar movimiento de stock manual
productsRouter.post('/:id/movements', (req, res) => {
  try {
    const { movement_type, quantity, unit_cost, notes, created_by } = req.body;
    const product = db.prepare(`SELECT * FROM products WHERE id = ? AND deleted_at IS NULL`).get(req.params.id) as any;
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const now = new Date().toISOString();
    const newStock = product.stock_quantity + quantity;

    const execute = db.transaction(() => {
      db.prepare(`
        INSERT INTO stock_movements (id, product_id, movement_type, quantity, unit_cost, notes, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), req.params.id, movement_type, quantity, unit_cost || 0, notes || null, created_by || 'Admin', now, now);

      db.prepare(`UPDATE products SET stock_quantity = ?, updated_at = ? WHERE id = ?`).run(newStock, now, req.params.id);
    });

    execute();
    const updated = db.prepare(`SELECT * FROM products WHERE id = ?`).get(req.params.id);
    io.emit('product:updated', updated);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Editar producto
productsRouter.put('/:id', (req, res) => {
  try {
    const {
      name, barcode, sku, category, brand, cost_price, sale_price,
      stock_quantity, min_stock_alert, unit, is_internal_supply, is_for_sale,
      supplier, notes
    } = req.body;
    const now = new Date().toISOString();

    const result = db.prepare(`
      UPDATE products
      SET name = ?, barcode = ?, sku = ?, category = ?, brand = ?,
          cost_price = ?, sale_price = ?, stock_quantity = ?, min_stock_alert = ?,
          unit = ?, is_internal_supply = ?, is_for_sale = ?, supplier = ?, notes = ?, updated_at = ?
      WHERE id = ? AND deleted_at IS NULL
    `).run(
      name, barcode || null, sku || null, category || 'General', brand || null,
      cost_price || 0, sale_price || 0, stock_quantity || 0, min_stock_alert || 5,
      unit || 'unidad', is_internal_supply ? 1 : 0, is_for_sale ? 1 : 0,
      supplier || null, notes || null, now, req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const updated = db.prepare(`SELECT * FROM products WHERE id = ?`).get(req.params.id);
    io.emit('product:updated', updated);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar producto (soft delete)
productsRouter.delete('/:id', (req, res) => {
  try {
    const now = new Date().toISOString();
    const result = db.prepare(`
      UPDATE products SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL
    `).run(now, now, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    io.emit('product:deleted', { id: req.params.id });
    res.json({ success: true, message: 'Producto eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Importación masiva desde planilla
productsRouter.post('/batch', (req, res) => {
  try {
    const items = req.body.items || req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Se requiere una lista de productos válida.' });
    }

    const now = new Date().toISOString();
    let importedCount = 0;

    const insertBatch = db.transaction(() => {
      const getProduct = db.prepare(`
        SELECT id FROM products WHERE (LOWER(name) = LOWER(?) OR (sku IS NOT NULL AND sku = ?)) AND deleted_at IS NULL
      `);
      const updateProduct = db.prepare(`
        UPDATE products SET
          category = ?, brand = COALESCE(?, brand), cost_price = ?, sale_price = ?,
          stock_quantity = ?, min_stock_alert = ?, is_internal_supply = ?, is_for_sale = ?,
          notes = COALESCE(?, notes), updated_at = ?
        WHERE id = ?
      `);
      const insertProduct = db.prepare(`
        INSERT INTO products (
          id, name, barcode, sku, category, brand, cost_price, sale_price,
          stock_quantity, min_stock_alert, unit, is_internal_supply, is_for_sale,
          supplier, notes, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        if (!item.name || !item.name.trim()) continue;
        const trimmedName = item.name.trim();
        const costPrice = parseMoneyOrNumber(item.cost_price);
        const salePrice = parseMoneyOrNumber(item.sale_price);
        const stockQty = parseMoneyOrNumber(item.stock_quantity);
        const minStock = parseMoneyOrNumber(item.min_stock_alert) || 5;

        const existing = getProduct.get(trimmedName, item.sku || null) as { id: string } | undefined;
        if (existing) {
          updateProduct.run(
            item.category?.trim() || 'General',
            item.brand?.trim() || null,
            costPrice,
            salePrice,
            stockQty,
            minStock,
            item.is_internal_supply ? 1 : 0,
            item.is_for_sale !== false ? 1 : 0,
            item.notes || null,
            now,
            existing.id
          );
        } else {
          const id = uuidv4();
          insertProduct.run(
            id,
            trimmedName,
            item.barcode || null,
            item.sku || null,
            item.category?.trim() || 'General',
            item.brand?.trim() || null,
            costPrice,
            salePrice,
            stockQty,
            minStock,
            item.unit?.trim() || 'unidad',
            item.is_internal_supply ? 1 : 0,
            item.is_for_sale !== false ? 1 : 0,
            item.supplier || null,
            item.notes || null,
            now,
            now
          );
        }
        importedCount++;
      }
    });

    insertBatch();
    io.emit('product:updated');
    res.json({ success: true, count: importedCount, message: `Se importaron y actualizaron ${importedCount} productos con éxito.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

