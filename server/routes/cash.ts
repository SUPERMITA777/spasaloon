import { Router } from 'express';
import { db } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';

export const cashRouter = Router();

// Obtener turno de caja actual abierto (o último)
cashRouter.get('/current-shift', (req, res) => {
  try {
    let shift = db.prepare(`SELECT * FROM cash_register_shifts WHERE status = 'open' AND deleted_at IS NULL ORDER BY opened_at DESC LIMIT 1`).get() as any;
    
    if (!shift) {
      shift = db.prepare(`SELECT * FROM cash_register_shifts WHERE deleted_at IS NULL ORDER BY opened_at DESC LIMIT 1`).get() as any;
    }

    if (!shift) {
      return res.json(null);
    }

    // Obtener transacciones del turno
    const transactions = db.prepare(`
      SELECT ct.*, c.first_name as client_first_name, c.last_name as client_last_name
      FROM cash_transactions ct
      LEFT JOIN clients c ON ct.client_id = c.id
      WHERE ct.shift_id = ? AND ct.deleted_at IS NULL
      ORDER BY ct.created_at DESC
    `).all(shift.id);

    const total_incomes = transactions.filter((t: any) => t.type === 'income').reduce((acc: number, t: any) => acc + t.amount, 0);
    const total_expenses = transactions.filter((t: any) => t.type === 'expense').reduce((acc: number, t: any) => acc + t.amount, 0);
    const expected_cash = shift.initial_cash + total_incomes - total_expenses;

    res.json({
      ...shift,
      total_incomes,
      total_expenses,
      expected_cash,
      transactions,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Abrir nuevo turno de caja
cashRouter.post('/open-shift', (req, res) => {
  try {
    const { initial_cash, opened_by, notes } = req.body;
    // Cerrar cualquier turno abierto previo si existiera
    const now = new Date().toISOString();
    db.prepare(`UPDATE cash_register_shifts SET status = 'closed', closed_at = ?, updated_at = ? WHERE status = 'open'`).run(now, now);

    const id = uuidv4();
    db.prepare(`
      INSERT INTO cash_register_shifts (id, opened_at, initial_cash, total_incomes, total_expenses, expected_cash, status, opened_by, notes, created_at, updated_at)
      VALUES (?, ?, ?, 0, 0, ?, 'open', ?, ?, ?, ?)
    `).run(id, now, initial_cash || 0, initial_cash || 0, opened_by || 'Admin', notes || null, now, now);

    const created = db.prepare(`SELECT * FROM cash_register_shifts WHERE id = ?`).get(id);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cerrar turno de caja
cashRouter.post('/close-shift/:id', (req, res) => {
  try {
    const { actual_cash, closed_by, notes } = req.body;
    const shift = db.prepare(`SELECT * FROM cash_register_shifts WHERE id = ?`).get(req.params.id) as any;
    if (!shift) {
      return res.status(404).json({ error: 'Turno de caja no encontrado' });
    }

    const transactions = db.prepare(`SELECT * FROM cash_transactions WHERE shift_id = ? AND deleted_at IS NULL`).all(req.params.id) as any[];
    const total_incomes = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const total_expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const expected_cash = shift.initial_cash + total_incomes - total_expenses;
    const difference = actual_cash !== undefined ? actual_cash - expected_cash : 0;

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE cash_register_shifts 
      SET closed_at = ?, total_incomes = ?, total_expenses = ?, expected_cash = ?, actual_cash = ?, difference = ?, status = 'closed', closed_by = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `).run(now, total_incomes, total_expenses, expected_cash, actual_cash || expected_cash, difference, closed_by || 'Admin', notes || shift.notes, now, req.params.id);

    const updated = db.prepare(`SELECT * FROM cash_register_shifts WHERE id = ?`).get(req.params.id);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar movimiento de ingreso o egreso
cashRouter.post('/transactions', (req, res) => {
  try {
    const { shift_id, appointment_id, client_id, type, category, amount, payment_method, notes } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    // Obtener shift actual si no viene provisto
    let activeShiftId = shift_id;
    if (!activeShiftId) {
      const activeShift = db.prepare(`SELECT id FROM cash_register_shifts WHERE status = 'open' LIMIT 1`).get() as any;
      if (activeShift) {
        activeShiftId = activeShift.id;
      } else {
        // Crear un turno de caja automáticamente
        activeShiftId = uuidv4();
        db.prepare(`
          INSERT INTO cash_register_shifts (id, opened_at, initial_cash, total_incomes, total_expenses, expected_cash, status, opened_by, created_at, updated_at)
          VALUES (?, ?, 0, 0, 0, 0, 'open', 'Sistema', ?, ?)
        `).run(activeShiftId, now, now, now);
      }
    }

    db.prepare(`
      INSERT INTO cash_transactions (id, shift_id, appointment_id, client_id, type, category, amount, payment_method, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, activeShiftId, appointment_id || null, client_id || null, type || 'income', category || 'General', amount || 0, payment_method || 'cash', notes || null, now, now);

    const created = db.prepare(`SELECT * FROM cash_transactions WHERE id = ?`).get(id);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Listar y generar comisiones de personal
cashRouter.get('/commissions', (req, res) => {
  try {
    const { staff_id, period } = req.query;
    let query = `
      SELECT sc.*, s.first_name as staff_first_name, s.last_name as staff_last_name, s.role as staff_role
      FROM staff_commissions sc
      JOIN staff s ON sc.staff_id = s.id
      WHERE sc.deleted_at IS NULL
    `;
    const params: any[] = [];

    if (staff_id) {
      query += ` AND sc.staff_id = ?`;
      params.push(staff_id);
    }
    if (period) {
      query += ` AND sc.period_date = ?`;
      params.push(period);
    }

    query += ` ORDER BY sc.created_at DESC`;
    const commissions = db.prepare(query).all(...params);
    res.json(commissions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
