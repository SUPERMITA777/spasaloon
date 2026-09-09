import { Router } from 'express';
import { db } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';
import { io } from '../index.js';

export const appointmentsRouter = Router();

// Helper de consulta de turnos con joins completos
function getAppointmentById(id: string) {
  const appt = db.prepare(`
    SELECT a.*, 
           c.first_name as client_first_name, c.last_name as client_last_name, c.phone as client_phone, c.email as client_email, c.dni as client_dni,
           s.first_name as staff_first_name, s.last_name as staff_last_name, s.color_code as staff_color,
           b.name as box_name, b.number as box_number, b.color_code as box_color,
           st.name as sub_treatment_name, st.duration_minutes as sub_treatment_duration, st.base_price as sub_treatment_base_price,
           t.id as treatment_id, t.name as treatment_name, t.color_code as treatment_color, t.category as treatment_category
    FROM appointments a
    JOIN clients c ON a.client_id = c.id
    JOIN staff s ON a.staff_id = s.id
    JOIN boxes b ON a.box_id = b.id
    JOIN sub_treatments st ON a.sub_treatment_id = st.id
    JOIN treatments t ON st.treatment_id = t.id
    WHERE a.id = ? AND a.deleted_at IS NULL
  `).get(id) as any;

  if (!appt) return null;

  const cartItems = db.prepare(`
    SELECT aci.*, s.first_name as added_by_staff_name
    FROM appointment_cart_items aci
    LEFT JOIN staff s ON aci.added_by_staff_id = s.id
    WHERE aci.appointment_id = ? AND aci.deleted_at IS NULL
    ORDER BY aci.created_at ASC
  `).all(id) as any[];

  const cartTotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  const total_amount = appt.service_price + cartTotal;
  const balance_due = Math.max(0, total_amount - appt.deposit_amount);

  return {
    ...appt,
    client: {
      id: appt.client_id,
      first_name: appt.client_first_name,
      last_name: appt.client_last_name,
      phone: appt.client_phone,
      email: appt.client_email,
      dni: appt.client_dni,
    },
    staff: {
      id: appt.staff_id,
      first_name: appt.staff_first_name,
      last_name: appt.staff_last_name,
      color_code: appt.staff_color,
    },
    box: {
      id: appt.box_id,
      name: appt.box_name,
      number: appt.box_number,
      color_code: appt.box_color,
    },
    sub_treatment: {
      id: appt.sub_treatment_id,
      name: appt.sub_treatment_name,
      duration_minutes: appt.sub_treatment_duration,
      base_price: appt.sub_treatment_base_price,
    },
    treatment: {
      id: appt.treatment_id,
      name: appt.treatment_name,
      color_code: appt.treatment_color,
      category: appt.treatment_category,
    },
    cart_items: cartItems,
    cart_total: cartTotal,
    total_amount,
    balance_due,
  };
}

// Listar turnos por fecha o rango
appointmentsRouter.get('/', (req, res) => {
  try {
    const { date, start_date, end_date, staff_id, box_id } = req.query;
    let query = `
      SELECT a.id FROM appointments a
      WHERE a.deleted_at IS NULL
    `;
    const params: any[] = [];

    if (date) {
      // Fecha exacta (YYYY-MM-DD)
      query += ` AND date(a.start_time) = date(?)`;
      params.push(date);
    } else if (start_date && end_date) {
      query += ` AND date(a.start_time) >= date(?) AND date(a.start_time) <= date(?)`;
      params.push(start_date, end_date);
    }

    if (staff_id) {
      query += ` AND a.staff_id = ?`;
      params.push(staff_id);
    }

    if (box_id) {
      query += ` AND a.box_id = ?`;
      params.push(box_id);
    }

    query += ` ORDER BY a.start_time ASC`;

    const rows = db.prepare(query).all(...params) as any[];
    const detailed = rows.map(r => getAppointmentById(r.id)).filter(Boolean);
    res.json(detailed);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un turno específico
appointmentsRouter.get('/:id', (req, res) => {
  try {
    const appt = getAppointmentById(req.params.id);
    if (!appt) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }
    res.json(appt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Validación de colisiones de horarios
function checkCollision(box_id: string, staff_id: string, start_time: string, end_time: string, excludeApptId?: string) {
  let boxCollisionQuery = `
    SELECT id, start_time, end_time FROM appointments
    WHERE box_id = ? 
      AND deleted_at IS NULL 
      AND status NOT IN ('cancelled', 'no_show')
      AND (
        (start_time < ? AND end_time > ?)
      )
  `;
  const boxParams: any[] = [box_id, end_time, start_time];
  if (excludeApptId) {
    boxCollisionQuery += ` AND id != ?`;
    boxParams.push(excludeApptId);
  }
  const boxCollision = db.prepare(boxCollisionQuery).get(...boxParams);
  if (boxCollision) {
    return { conflict: true, message: 'El Box seleccionado ya tiene un turno reservado en ese horario.' };
  }

  let staffCollisionQuery = `
    SELECT id, start_time, end_time FROM appointments
    WHERE staff_id = ? 
      AND deleted_at IS NULL 
      AND status NOT IN ('cancelled', 'no_show')
      AND (
        (start_time < ? AND end_time > ?)
      )
  `;
  const staffParams: any[] = [staff_id, end_time, start_time];
  if (excludeApptId) {
    staffCollisionQuery += ` AND id != ?`;
    staffParams.push(excludeApptId);
  }
  const staffCollision = db.prepare(staffCollisionQuery).get(...staffParams);
  if (staffCollision) {
    return { conflict: true, message: 'El profesional seleccionado ya tiene un turno asignado en ese horario.' };
  }

  return { conflict: false };
}

// Validación de disponibilidad de Box (fechas y horario de funcionamiento)
function checkBoxAvailability(box_id: string, start_time: string, end_time: string) {
  const box = db.prepare(`SELECT * FROM boxes WHERE id = ? AND deleted_at IS NULL`).get(box_id) as any;
  if (!box) {
    return { valid: false, message: 'El Box seleccionado no existe o fue eliminado.' };
  }

  if (box.is_active === 0) {
    return { valid: false, message: `El ${box.name} se encuentra inactivo.` };
  }

  const apptDate = start_time.split('T')[0]; // "YYYY-MM-DD"
  
  // Validar si es temporal y cae fuera de rango
  if (box.is_temporary) {
    if (box.available_from && box.available_from.split('T')[0] > apptDate) {
      return {
        valid: false,
        message: `El ${box.name} no está disponible en la fecha seleccionada (disponible a partir del ${box.available_from.split('T')[0]}).`,
      };
    }
    if (box.available_to && box.available_to.split('T')[0] < apptDate) {
      return {
        valid: false,
        message: `El ${box.name} no está disponible en la fecha seleccionada (finalizó el ${box.available_to.split('T')[0]}).`,
      };
    }
  }

  // Validar horario de funcionamiento del Box
  if (box.start_time && box.end_time) {
    const apptStartDate = new Date(start_time);
    const apptEndDate = new Date(end_time);

    const apptStartHM = `${String(apptStartDate.getHours()).padStart(2, '0')}:${String(apptStartDate.getMinutes()).padStart(2, '0')}`;
    const apptEndHM = `${String(apptEndDate.getHours()).padStart(2, '0')}:${String(apptEndDate.getMinutes()).padStart(2, '0')}`;

    if (apptStartHM < box.start_time || apptEndHM > box.end_time) {
      return {
        valid: false,
        message: `El ${box.name} funciona únicamente en el horario de ${box.start_time} a ${box.end_time}.`,
      };
    }
  }

  return { valid: true };
}

// Función auxiliar para registrar movimiento de seña en caja
function recordDepositTransaction(appointmentId: string, clientId: string, depositAmount: number, paymentMethod: string, notes: string | null) {
  if (!depositAmount || depositAmount <= 0) return;

  const now = new Date().toISOString();
  // Obtener shift actual abierto o crear uno
  let activeShift = db.prepare(`SELECT id FROM cash_register_shifts WHERE status = 'open' LIMIT 1`).get() as any;
  let activeShiftId = activeShift ? activeShift.id : null;
  if (!activeShiftId) {
    activeShiftId = uuidv4();
    db.prepare(`
      INSERT INTO cash_register_shifts (id, opened_at, initial_cash, total_incomes, total_expenses, expected_cash, status, opened_by, created_at, updated_at)
      VALUES (?, ?, 0, 0, 0, 0, 'open', 'Sistema (Automático)', ?, ?)
    `).run(activeShiftId, now, now, now);
  }

  const txId = uuidv4();
  db.prepare(`
    INSERT INTO cash_transactions (id, shift_id, appointment_id, client_id, type, category, amount, payment_method, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'income', 'Seña de Turno', ?, ?, ?, ?, ?)
  `).run(
    txId,
    activeShiftId,
    appointmentId,
    clientId || null,
    depositAmount,
    paymentMethod || 'cash',
    notes || `Seña recibida para turno agendado`,
    now,
    now
  );
}

// Crear turno
appointmentsRouter.post('/', (req, res) => {
  try {
    const { client_id, staff_id, sub_treatment_id, box_id, start_time, end_time, deposit_amount, deposit_payment_method, notes } = req.body;
    
    // Obtener precio base del sub-tratamiento
    const subTreatment = db.prepare(`SELECT * FROM sub_treatments WHERE id = ?`).get(sub_treatment_id) as any;
    if (!subTreatment) {
      return res.status(400).json({ error: 'Sub-tratamiento no válido' });
    }

    // 1. Validar que el Box exista, esté activo en la fecha y dentro de su rango horario
    const boxValidation = checkBoxAvailability(box_id, start_time, end_time);
    if (!boxValidation.valid) {
      return res.status(400).json({ error: boxValidation.message });
    }

    // 2. Validar colisiones
    const collision = checkCollision(box_id, staff_id, start_time, end_time);
    if (collision.conflict) {
      return res.status(409).json({ error: collision.message });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO appointments (id, client_id, staff_id, sub_treatment_id, box_id, start_time, end_time, status, deposit_amount, deposit_payment_method, service_price, notes, whatsapp_reminder_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, ?, ?, 'pending', ?, ?)
    `).run(
      id, client_id, staff_id, sub_treatment_id, box_id,
      start_time, end_time,
      deposit_amount || 0,
      deposit_payment_method || null,
      subTreatment.base_price,
      notes || null,
      now, now
    );

    // 3. Si se registró una seña, computarla de inmediato en la caja
    const numDeposit = Number(deposit_amount) || 0;
    if (numDeposit > 0) {
      recordDepositTransaction(id, client_id, numDeposit, deposit_payment_method || 'cash', `Seña recibida para turno de ${subTreatment.name}`);
    }

    const created = getAppointmentById(id);
    if (io) io.emit('appointment:created', created);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Modificar turno (actualización general o drag & drop de box/horario)
appointmentsRouter.put('/:id', (req, res) => {
  try {
    const existing = db.prepare(`SELECT * FROM appointments WHERE id = ? AND deleted_at IS NULL`).get(req.params.id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    const {
      client_id = existing.client_id,
      staff_id = existing.staff_id,
      sub_treatment_id = existing.sub_treatment_id,
      box_id = existing.box_id,
      start_time = existing.start_time,
      end_time = existing.end_time,
      status = existing.status,
      deposit_amount = existing.deposit_amount,
      deposit_payment_method = existing.deposit_payment_method,
      service_price = existing.service_price,
      notes = existing.notes,
      whatsapp_reminder_status = existing.whatsapp_reminder_status,
      whatsapp_reminder_sent_at = existing.whatsapp_reminder_sent_at,
    } = req.body;

    // Si cambió horario o box, validar rango de box
    if (box_id !== existing.box_id || start_time !== existing.start_time || end_time !== existing.end_time) {
      const boxValidation = checkBoxAvailability(box_id, start_time, end_time);
      if (!boxValidation.valid) {
        return res.status(400).json({ error: boxValidation.message });
      }
    }

    // Si cambió horario o box/profesional, validar colisiones
    if (box_id !== existing.box_id || staff_id !== existing.staff_id || start_time !== existing.start_time || end_time !== existing.end_time) {
      if (status !== 'cancelled' && status !== 'no_show') {
        const collision = checkCollision(box_id, staff_id, start_time, end_time, req.params.id);
        if (collision.conflict) {
          return res.status(409).json({ error: collision.message });
        }
      }
    }

    // Si se aumentó la seña o se añadió una seña nueva, registrar el ingreso diferencial en caja
    const newDeposit = Number(deposit_amount) || 0;
    const oldDeposit = Number(existing.deposit_amount) || 0;
    if (newDeposit > oldDeposit) {
      const diff = newDeposit - oldDeposit;
      recordDepositTransaction(req.params.id, client_id, diff, deposit_payment_method || existing.deposit_payment_method || 'cash', `Seña adicional recibida para turno`);
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE appointments
      SET client_id = ?, staff_id = ?, sub_treatment_id = ?, box_id = ?, start_time = ?, end_time = ?, status = ?, deposit_amount = ?, deposit_payment_method = ?, service_price = ?, notes = ?, whatsapp_reminder_status = ?, whatsapp_reminder_sent_at = ?, updated_at = ?
      WHERE id = ?
    `).run(
      client_id, staff_id, sub_treatment_id, box_id, start_time, end_time, status, deposit_amount, deposit_payment_method, service_price, notes, whatsapp_reminder_status, whatsapp_reminder_sent_at, now, req.params.id
    );

    const updated = getAppointmentById(req.params.id);
    if (io) io.emit('appointment:updated', updated);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// CARRITO DE COMPRAS DEL TURNO
// ==========================================

// Agregar ítem al carrito (producto o sub-tratamiento extra)
appointmentsRouter.post('/:id/cart', (req, res) => {
  try {
    const { item_type, item_id, name, quantity = 1, unit_price, staff_id } = req.body;
    const appt = db.prepare(`SELECT * FROM appointments WHERE id = ? AND deleted_at IS NULL`).get(req.params.id);
    if (!appt) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const subtotal = (unit_price || 0) * quantity;

    db.prepare(`
      INSERT INTO appointment_cart_items (id, appointment_id, item_type, item_id, name, quantity, unit_price, subtotal, added_by_staff_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.params.id, item_type, item_id, name, quantity, unit_price, subtotal, staff_id || null, now, now);

    const updatedAppt = getAppointmentById(req.params.id);
    if (io) io.emit('appointment:updated', updatedAppt);
    res.status(201).json(updatedAppt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar ítem del carrito
appointmentsRouter.delete('/:id/cart/:cartItemId', (req, res) => {
  try {
    const now = new Date().toISOString();
    db.prepare(`UPDATE appointment_cart_items SET deleted_at = ?, updated_at = ? WHERE id = ? AND appointment_id = ?`).run(now, now, req.params.cartItemId, req.params.id);
    
    const updatedAppt = getAppointmentById(req.params.id);
    if (io) io.emit('appointment:updated', updatedAppt);
    res.json(updatedAppt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Generar enlace formateado de WhatsApp
appointmentsRouter.post('/:id/whatsapp-reminder', (req, res) => {
  try {
    const appt = getAppointmentById(req.params.id);
    if (!appt) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    const phoneRaw = appt.client.phone.replace(/[^0-9]/g, '');
    const appointmentDate = new Date(appt.start_time);
    const dateFormatted = appointmentDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    const timeFormatted = appointmentDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    const message = `¡Hola *${appt.client.first_name}*! ✨ Te recordamos tu turno en *Aura Suite*:\n\n` +
      `🗓 *Fecha:* ${dateFormatted}\n` +
      `⏰ *Hora:* ${timeFormatted} hs\n` +
      `💆‍♀️ *Tratamiento:* ${appt.sub_treatment.name}\n` +
      `👩‍⚕️ *Profesional:* ${appt.staff.first_name} ${appt.staff.last_name}\n` +
      `🚪 *Ubicación:* ${appt.box.name}\n\n` +
      `Por favor, confirmá tu asistencia respondiendo a este mensaje. ¡Te esperamos! 💖`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneRaw}?text=${encodedMessage}`;

    // Registrar envío
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE appointments 
      SET whatsapp_reminder_status = 'sent', whatsapp_reminder_sent_at = ?, updated_at = ?
      WHERE id = ?
    `).run(now, now, req.params.id);

    const updatedAppt = getAppointmentById(req.params.id);
    if (io) io.emit('appointment:updated', updatedAppt);

    res.json({
      success: true,
      whatsappUrl,
      message,
      appointment: updatedAppt,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
