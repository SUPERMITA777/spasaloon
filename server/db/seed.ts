import { db, initDatabase } from './database.js';
import { v4 as uuidv4 } from 'uuid';

export function seedDatabase() {
  initDatabase();

  const count = db.prepare('SELECT COUNT(*) as count FROM boxes').get() as { count: number };
  if (count.count > 0) {
    console.log('🌱 La base de datos ya contiene datos. Saltando seeder.');
    return;
  }

  console.log('🌱 Poblando base de datos con datos iniciales profesionales...');
  const now = new Date().toISOString();
  const todayStr = new Date().toISOString().split('T')[0];

  // Helper de fechas
  const getAppointmentDate = (hour: number, minute: number, dayOffset = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };

  const insert = db.transaction(() => {
    // 1. Boxes
    const box1Id = uuidv4();
    const box2Id = uuidv4();
    const box3Id = uuidv4();
    const box4Id = uuidv4();

    const insertBox = db.prepare(`
      INSERT INTO boxes (id, name, number, description, color_code, order_index, is_active, equipment_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `);

    insertBox.run(box1Id, 'Box 1 — Facial Glow', 1, 'Equipado para cosmiatría y rejuvenecimiento', '#C59B7E', 1, JSON.stringify(['Dermapen', 'Espátula Ultrasónica', 'Alta Frecuencia']), now, now);
    insertBox.run(box2Id, 'Box 2 — Corporal Escultor', 2, 'Equipado para remodelación y maderoterapia', '#7E9F85', 2, JSON.stringify(['Criolipólisis', 'Presoterapia', 'Maderoterapia']), now, now);
    insertBox.run(box3Id, 'Box 3 — Láser Diodo & Spa', 3, 'Cabina aislada para depilación láser y masajes relajantes', '#A8829F', 3, JSON.stringify(['Láser Diodo Trionda', 'Camilla Térmica']), now, now);
    insertBox.run(box4Id, 'Box 4 — Cosmiatría & Peelings', 4, 'Cabina dermatológica avanzada', '#D4A373', 4, JSON.stringify(['Punta de Diamante', 'Lámpara de Wood', 'Radiofrecuencia']), now, now);

    // 2. Personal / Staff
    const staff1Id = uuidv4();
    const staff2Id = uuidv4();
    const staff3Id = uuidv4();

    const insertStaff = db.prepare(`
      INSERT INTO staff (id, first_name, last_name, phone, email, role, commission_type, default_commission_rate, pin_code, qr_token, color_code, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    insertStaff.run(staff1Id, 'Valentina', 'Rossi', '+54 9 11 3344 5566', 'valentina.rossi@esteticapro.local', 'dermatocosmiatra', 'fixed_percent', 35, '1234', 'valen-rossi-qr-01', '#C59B7E', now, now);
    insertStaff.run(staff2Id, 'Camila', 'Fernández', '+54 9 11 6677 8899', 'camila.f@esteticapro.local', 'esteticista', 'fixed_percent', 30, '5678', 'camila-fernandez-qr-02', '#7E9F85', now, now);
    insertStaff.run(staff3Id, 'Sofía', 'Navarro', '+54 9 11 2233 4455', 'sofia.n@esteticapro.local', 'masajista', 'fixed_percent', 30, '9012', 'sofia-navarro-qr-03', '#A8829F', now, now);

    // Horarios del staff (Lunes a Sábado 09:00 - 19:00)
    const insertSchedule = db.prepare(`
      INSERT INTO staff_availability (id, staff_id, day_of_week, start_time, end_time, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `);

    [staff1Id, staff2Id, staff3Id].forEach(sId => {
      for (let day = 1; day <= 6; day++) {
        insertSchedule.run(uuidv4(), sId, day, '09:00', '19:00', now, now);
      }
    });

    // 3. Clientes
    const client1Id = uuidv4();
    const client2Id = uuidv4();
    const client3Id = uuidv4();
    const client4Id = uuidv4();
    const client5Id = uuidv4();

    const insertClient = db.prepare(`
      INSERT INTO clients (id, first_name, last_name, phone, email, birth_date, dni, notes, profile_photo_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertClient.run(client1Id, 'Martina', 'Gómez', '+5491155443322', 'martina.gomez@gmail.com', '1994-06-15', '38.120.450', 'Piel sensible reactiva a fragancias sintéticas. Prefiere turnos por la tarde.', null, now, now);
    insertClient.run(client2Id, 'Lucía', 'Benítez', '+5491144332211', 'lucia.b@outlook.com', '1989-11-23', '35.890.120', 'Plan de reducción corporal en curso (Sesión 3 de 6).', null, now, now);
    insertClient.run(client3Id, 'Florencia', 'Morales', '+5491177889900', 'flor.morales@gmail.com', '1997-03-08', '40.234.567', 'Paciente de depilación láser diodo rostro y axilas.', null, now, now);
    insertClient.run(client4Id, 'Julieta', 'Herrera', '+5491166554433', 'juli.herrera@yahoo.com', '1992-09-30', '37.456.789', 'Consulta por manchas de hiperpigmentación post-verano.', null, now, now);
    insertClient.run(client5Id, 'Carolina', 'Vázquez', '+5491188990011', 'caro.vazquez@gmail.com', '1985-12-04', '32.114.908', 'Tratamiento anti-age y tensor flash.', null, now, now);

    // 4. Tratamientos y Sub-tratamientos
    const tFacialId = uuidv4();
    const tCorporalId = uuidv4();
    const tLaserId = uuidv4();
    const tSpaId = uuidv4();

    const insertTreatment = db.prepare(`
      INSERT INTO treatments (id, name, category, description, color_code, icon_name, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    insertTreatment.run(tFacialId, 'Facial & Cosmiatría', 'facial', 'Tratamientos de higiene, nutrición y bio-estimulación facial', '#C59B7E', 'Sparkles', now, now);
    insertTreatment.run(tCorporalId, 'Corporal & Reductores', 'corporal', 'Modelado corporal, celulitis y reafirmación tisular', '#7E9F85', 'Activity', now, now);
    insertTreatment.run(tLaserId, 'Depilación Láser Diodo', 'depilacion', 'Depilación definitiva indolora con tecnología trionda', '#A8829F', 'Zap', now, now);
    insertTreatment.run(tSpaId, 'Spa & Masajes', 'spa', 'Relajación integral, drenaje linfático y descontracturante', '#D4A373', 'Heart', now, now);

    const insertSubTreatment = db.prepare(`
      INSERT INTO sub_treatments (id, treatment_id, name, duration_minutes, base_price, allowed_days_json, allowed_start_time, allowed_end_time, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    const subFacial1 = uuidv4(); // Limpieza Profunda
    const subFacial2 = uuidv4(); // Peeling
    const subFacial3 = uuidv4(); // Dermapen
    const subCorp1 = uuidv4();   // Maderoterapia
    const subCorp2 = uuidv4();   // Criolipólisis
    const subLaser1 = uuidv4();  // Axilas
    const subLaser2 = uuidv4();  // Piernas Completas

    insertSubTreatment.run(subFacial1, tFacialId, 'Limpieza Facial Profunda + Hidroxiácidos', 60, 28000, '[1,2,3,4,5,6]', '09:00', '19:00', now, now);
    insertSubTreatment.run(subFacial2, tFacialId, 'Peeling Químico & Renovación Celular', 45, 32000, '[1,2,3,4,5,6]', '09:00', '19:00', now, now);
    insertSubTreatment.run(subFacial3, tFacialId, 'Dermapen con Ácido Hialurónico Puro', 60, 45000, '[1,2,3,4,5,6]', '09:00', '19:00', now, now);
    
    insertSubTreatment.run(subCorp1, tCorporalId, 'Masaje Reductor + Maderoterapia (50 min)', 50, 26000, '[1,2,3,4,5,6]', '09:00', '19:00', now, now);
    insertSubTreatment.run(subCorp2, tCorporalId, 'Criolipólisis Plana de Contorno (4 Zonas)', 60, 55000, '[1,2,3,4,5,6]', '09:00', '19:00', now, now);

    insertSubTreatment.run(subLaser1, tLaserId, 'Láser Diodo Trionda: Axilas', 20, 15000, '[1,2,3,4,5,6]', '09:00', '19:00', now, now);
    insertSubTreatment.run(subLaser2, tLaserId, 'Láser Diodo Trionda: Piernas Completas', 45, 38000, '[1,2,3,4,5,6]', '09:00', '19:00', now, now);

    // 5. Productos
    const prod1Id = uuidv4();
    const prod2Id = uuidv4();
    const prod3Id = uuidv4();
    const prod4Id = uuidv4();
    const prod5Id = uuidv4();

    const insertProduct = db.prepare(`
      INSERT INTO products (id, name, barcode, sku, category, brand, cost_price, sale_price, stock_quantity, min_stock_alert, unit, is_internal_supply, is_for_sale, supplier, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertProduct.run(prod1Id, 'Sérum Ácido Hialurónico 2% Ultra-Hydra', '7791234567890', 'SER-HYAL-50', 'Facial', 'Dermik Pro', 9500, 22000, 14, 4, 'unidad', 1, 1, 'Laboratorios DermoSkin', 'Apto todo tipo de piel', now, now);
    insertProduct.run(prod2Id, 'Protector Solar Toque Seco FPS 50+ con Niacinamida', '7792345678901', 'SOL-FPS50-50', 'Protección Solar', 'Solaris Derm', 11000, 24500, 8, 3, 'unidad', 0, 1, 'Laboratorios DermoSkin', 'Recomendado post-peeling', now, now);
    insertProduct.run(prod3Id, 'Gel Conductor Neutro con Centella Asiática (1000ml)', '7793456789012', 'GEL-CENT-1L', 'Insumos Cabina', 'Electromed', 6000, 0, 6, 2, 'unidad', 1, 0, 'Distribuidora Estética Baires', 'Uso interno para radiofrecuencia y aparatología', now, now);
    insertProduct.run(prod4Id, 'Aceite Esencial de Romero & Almendras (500ml)', '7794567890123', 'OIL-ALM-500', 'Insumos Cabina', 'Botanical Spa', 7200, 0, 5, 2, 'unidad', 1, 0, 'Botanical Spa Aromas', 'Uso para maderoterapia', now, now);
    insertProduct.run(prod5Id, 'Espuma Limpiadora con Ácido Glicólico 5%', '7795678901234', 'ESP-GLIC-150', 'Limpieza', 'Dermik Pro', 8000, 19500, 11, 4, 'unidad', 1, 1, 'Laboratorios DermoSkin', 'Regula sebo y textura', now, now);

    // 6. Turnos para HOY (distribuidos en Boxes 1, 2, 3 y 4)
    const appt1Id = uuidv4();
    const appt2Id = uuidv4();
    const appt3Id = uuidv4();
    const appt4Id = uuidv4();
    const appt5Id = uuidv4();

    const insertAppointment = db.prepare(`
      INSERT INTO appointments (id, client_id, staff_id, sub_treatment_id, box_id, start_time, end_time, status, deposit_amount, deposit_payment_method, service_price, notes, whatsapp_reminder_status, whatsapp_reminder_sent_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Turno 1: Box 1 (10:00 - 11:00) - Limpieza Profunda - Valentina Rossi - Martina Gómez
    insertAppointment.run(
      appt1Id, client1Id, staff1Id, subFacial1, box1Id,
      getAppointmentDate(10, 0), getAppointmentDate(11, 0),
      'confirmed', 10000, 'transfer', 28000,
      'Cliente puntual. Recordar aplicar máscara descongestiva.',
      'sent', now, now, now
    );

    // Turno 2: Box 2 (11:00 - 12:00) - Maderoterapia - Camila Fernández - Lucía Benítez
    insertAppointment.run(
      appt2Id, client2Id, staff2Id, subCorp1, box2Id,
      getAppointmentDate(11, 0), getAppointmentDate(11, 50),
      'in_progress', 8000, 'cash', 26000,
      'Sesión 3 de paquete corporal. Medición de contornos programada.',
      'sent', now, now, now
    );

    // Turno 3: Box 3 (14:30 - 15:15) - Láser Piernas - Sofía Navarro - Florencia Morales
    insertAppointment.run(
      appt3Id, client3Id, staff3Id, subLaser2, box3Id,
      getAppointmentDate(14, 30), getAppointmentDate(15, 15),
      'scheduled', 15000, 'qr_mercadopago', 38000,
      'Depilación Láser sesión 4.',
      'pending', null, now, now
    );

    // Turno 4: Box 1 (15:30 - 16:30) - Dermapen - Valentina Rossi - Julieta Herrera
    insertAppointment.run(
      appt4Id, client4Id, staff1Id, subFacial3, box1Id,
      getAppointmentDate(15, 30), getAppointmentDate(16, 30),
      'scheduled', 15000, 'transfer', 45000,
      'Desea probar sérum de ácido hialurónico post-tratamiento.',
      'pending', null, now, now
    );

    // Turno 5: Box 4 (17:00 - 17:45) - Peeling - Valentina Rossi - Carolina Vázquez
    insertAppointment.run(
      appt5Id, client5Id, staff1Id, subFacial2, box4Id,
      getAppointmentDate(17, 0), getAppointmentDate(17, 45),
      'scheduled', 10000, 'cash', 32000,
      'Evaluación de manchas solares.',
      'pending', null, now, now
    );

    // Carrito de compras precargado para el Turno 1
    const insertCartItem = db.prepare(`
      INSERT INTO appointment_cart_items (id, appointment_id, item_type, item_id, name, quantity, unit_price, subtotal, added_by_staff_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertCartItem.run(
      uuidv4(), appt1Id, 'product', prod1Id,
      'Sérum Ácido Hialurónico 2% Ultra-Hydra', 1, 22000, 22000, staff1Id, now, now
    );

    // 7. Ficha Corporal de Ejemplo para Lucía Benítez
    const insertBodyChart = db.prepare(`
      INSERT INTO body_charts (id, client_id, session_id, date, points_json, measurements_json, clinical_contraindications_json, notes, created_at, updated_at)
      VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertBodyChart.run(
      uuidv4(), client2Id, todayStr,
      JSON.stringify([
        { id: 'bp-1', x: 50, y: 48, view: 'front', zone_name: 'Abdomen bajo', condition: 'adiposidad', notes: 'Grasa localizada blanda' },
        { id: 'bp-2', x: 38, y: 55, view: 'front', zone_name: 'Flanco derecho', condition: 'flacidez', notes: 'Poco tono muscular' },
        { id: 'bp-3', x: 62, y: 55, view: 'front', zone_name: 'Flanco izquierdo', condition: 'flacidez', notes: 'Poco tono muscular' },
        { id: 'bp-4', x: 42, y: 68, view: 'back', zone_name: 'Glúteo / Sub-glúteo', condition: 'celulitis', notes: 'Grado II compacta' }
      ]),
      JSON.stringify({
        weight_kg: 64.5,
        height_cm: 165,
        body_fat_pct: 26.2,
        fluid_retention: 'moderada',
        waist_cm: 74,
        abdomen_high_cm: 80,
        abdomen_low_cm: 88,
        hips_cm: 101,
        thigh_right_cm: 58,
        thigh_left_cm: 57.5,
        arm_right_cm: 28,
        arm_left_cm: 28,
        notes: 'Reducción de 2 cm en abdomen bajo respecto al inicio de mes.'
      }),
      JSON.stringify(['Sin cirugías recientes', 'No marcapasos', 'No alergia al aceite de romero']),
      'Excelente respuesta al masaje reductor y termoterapia.',
      now, now
    );

    // 8. Ficha Cosmetológica de Ejemplo para Martina Gómez
    const insertFacialChart = db.prepare(`
      INSERT INTO facial_charts (id, client_id, session_id, date, skin_type, phototype, hydration_level, sensitivity_level, allergies, active_lesions, current_skincare_routine, zones_json, recommended_homecare, created_at, updated_at)
      VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertFacialChart.run(
      uuidv4(), client1Id, todayStr,
      'mixta', 'III', 'deshidratada', 'reactiva',
      'Alergia leve a parabenos y perfumes intensos',
      'Comedones abiertos en zona T, eritema leve en mejillas',
      'Agua micelar por la noche y crema humectante neutra',
      JSON.stringify([
        { id: 'fz-1', zone: 'frente', condition: 'grasa', severity: 'moderada', notes: 'Poros dilatados' },
        { id: 'fz-2', zone: 'nariz', condition: 'grasa', severity: 'moderada', notes: 'Puntos negros' },
        { id: 'fz-3', zone: 'mejilla_der', condition: 'sensible', severity: 'intensa', notes: 'Tendencia a cuperosis' },
        { id: 'fz-4', zone: 'mejilla_izq', condition: 'sensible', severity: 'intensa', notes: 'Tendencia a cuperosis' }
      ]),
      'Espuma suave sin sulfatos, Sérum Hialurónico 2% y Protector FPS 50 Toque Seco diario.',
      now, now
    );

    // 9. Recursos de Marketing de Ejemplo
    const insertMarketingMedia = db.prepare(`
      INSERT INTO marketing_media (id, treatment_id, sub_treatment_id, title, media_type, file_url, thumbnail_url, caption_template, hashtags_json, suggested_stories_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertMarketingMedia.run(
      uuidv4(), tFacialId, subFacial1,
      'Glow Skin Instantáneo: Limpieza Ultrasónica', 'image',
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&auto=format&fit=crop&q=80',
      '¿Sabías que una piel limpia absorbe hasta 3 veces mejor tus sérums? ✨ Reserva tu sesión de Limpieza Profunda con espátula ultrasónica y devolvele la luminosidad natural a tu rostro.',
      JSON.stringify(['#EsteticaFacial', '#PielRadiante', '#LimpiezaFacial', '#GlowSkin', '#CuidadoDeLaPiel', '#Cosmetologia']),
      JSON.stringify(['Paso a paso de la espátula ultrasónica', 'Antes y después de poros limpios', 'Promo 2x1 con amiga']),
      now, now
    );

    insertMarketingMedia.run(
      uuidv4(), tCorporalId, subCorp1,
      'Modelado & Maderoterapia Corporal', 'image',
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200&auto=format&fit=crop&q=80',
      'Esculpe tu figura y activa la microcirculación con nuestro protocolo exclusivo de Maderoterapia + Drenaje 🌿 Resultados visibles desde las primeras sesiones.',
      JSON.stringify(['#Maderoterapia', '#ModeladoCorporal', '#DrenajeLinfatico', '#ChauCelulitis', '#Bienestar']),
      JSON.stringify(['Preguntas frecuentes sobre maderoterapia', 'Testimonios de clientas', 'Beneficios contra la retención']),
      now, now
    );
  });

  insert();
  console.log('✅ Base de datos poblada exitosamente.');
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase();
}
