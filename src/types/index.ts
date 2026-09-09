// ==========================================
// TIPOS Y MODELO DE DATOS CLOUD-READY (UUID)
// ==========================================

export type UUID = string;

export interface BaseEntity {
  id: UUID;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  synced_at: string | null;
}

// 1. Clientes
export interface Client extends BaseEntity {
  first_name: string;
  last_name: string;
  phone: string; // Formateado para WhatsApp (+54 9 11 ...)
  email: string | null;
  birth_date: string | null;
  dni: string | null;
  notes: string | null;
  profile_photo_url: string | null;
  total_sessions_count?: number;
  last_session_date?: string | null;
}

// 2. Personal / Profesionales
export type CommissionType = 'fixed_percent' | 'custom_per_service';
export type StaffRole = 'esteticista' | 'cosmetologa' | 'masajista' | 'dermatocosmiatra' | 'recepcion' | 'administrador';

export interface StaffSchedule {
  day_of_week: number; // 0 (Domingo) - 6 (Sábado)
  start_time: string; // "09:00"
  end_time: string; // "19:00"
  is_active: boolean;
}

export interface Staff extends BaseEntity {
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  role: StaffRole;
  commission_type: CommissionType;
  default_commission_rate: number; // e.g. 30 (%)
  pin_code: string; // PIN de 4 dígitos para acceso QR / portal
  qr_token: string; // Token único seguro
  qr_url?: string;
  qr_image?: string;
  color_code: string; // Color distintivo para la agenda
  active: boolean;
  schedule?: StaffSchedule[];
}

// 3. Boxes / Salas
export interface Box extends BaseEntity {
  name: string; // "Box 1 - Facial Deluxe", "Cabina 2", "Sillón 3"
  number: number;
  description: string | null;
  color_code: string;
  order_index: number;
  is_active: boolean;
  is_temporary?: boolean;
  available_from?: string | null;
  available_to?: string | null;
  start_time?: string | null; // ej "09:00"
  end_time?: string | null;   // ej "19:00"
  equipment?: string[];
}

// 4. Tratamientos y Sub-tratamientos
export type TreatmentCategory = 'facial' | 'corporal' | 'depilacion' | 'pestanas_cejas' | 'spa' | 'masajes' | 'otro';

export interface Treatment extends BaseEntity {
  name: string;
  category: TreatmentCategory;
  description: string | null;
  color_code: string;
  icon_name: string | null;
  is_active: boolean;
  sub_treatments?: SubTreatment[];
  marketing_media?: MarketingMedia[];
}

export interface SubTreatmentSupply {
  id?: UUID;
  sub_treatment_id: UUID;
  product_id: UUID;
  product_name?: string;
  quantity_consumed: number;
  unit?: string;
}

export interface SubTreatment extends BaseEntity {
  treatment_id: UUID;
  treatment_name?: string;
  treatment_color?: string;
  name: string;
  duration_minutes: number;
  base_price: number;
  allowed_days: number[]; // [1, 2, 3, 4, 5] (Lunes a Viernes)
  allowed_start_time: string; // "09:00"
  allowed_end_time: string; // "20:00"
  is_active: boolean;
  supplies?: SubTreatmentSupply[];
  marketing_media?: MarketingMedia[];
}

// 5. Turnos / Citas (Agenda)
export type AppointmentStatus = 
  | 'scheduled'    // Agendado
  | 'confirmed'    // Confirmado por cliente
  | 'in_progress'  // En atención en Box
  | 'completed'    // Finalizado y liquidado
  | 'cancelled'    // Cancelado
  | 'no_show';     // Ausente

export interface CartItem {
  id: UUID;
  appointment_id: UUID;
  item_type: 'sub_treatment' | 'product';
  item_id: UUID;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  added_by_staff_id: UUID | null;
  added_by_staff_name?: string;
  created_at: string;
}

export interface Appointment extends BaseEntity {
  client_id: UUID;
  client?: Client;
  staff_id: UUID;
  staff?: Staff;
  sub_treatment_id: UUID;
  sub_treatment?: SubTreatment;
  treatment?: Treatment;
  box_id: UUID;
  box?: Box;
  start_time: string; // ISO string "2026-09-02T14:00:00.000Z"
  end_time: string;   // ISO string "2026-09-02T15:00:00.000Z"
  status: AppointmentStatus;
  deposit_amount: number; // Seña abonada previamente
  deposit_payment_method: string | null;
  service_price: number;
  total_amount: number; // Suma del servicio base + items del carrito
  balance_due: number;  // Total - Seña
  notes: string | null;
  whatsapp_reminder_status: 'pending' | 'generated' | 'sent';
  whatsapp_reminder_sent_at: string | null;
  cart_items?: CartItem[];
}

// 6. Historia Clínica / Sesiones
export interface Session extends BaseEntity {
  appointment_id: UUID | null;
  client_id: UUID;
  client?: Client;
  staff_id: UUID;
  staff?: Staff;
  box_id: UUID | null;
  box?: Box;
  sub_treatment_id: UUID;
  sub_treatment?: SubTreatment;
  session_date: string;
  actual_start: string;
  actual_end: string;
  actual_duration_minutes: number;
  observations: string;
  reactions: string | null;
  products_used_notes: string | null;
  is_locked: boolean;
  audit_history: {
    modified_at: string;
    modified_by: string;
    field: string;
    old_value: any;
    new_value: any;
  }[];
}

// 7. Ficha Corporal
export interface BodyPoint {
  id: string;
  x: number; // Coordenada porcentual 0-100 en el SVG
  y: number;
  view: 'front' | 'back';
  zone_name: string; // e.g. "Abdomen superior", "Flanco izquierdo", "Glúteo"
  condition: 'adiposidad' | 'flacidez' | 'celulitis' | 'estrias' | 'contractura' | 'tratamiento';
  notes?: string;
}

export interface BodyMeasurements {
  weight_kg?: number;
  height_cm?: number;
  body_fat_pct?: number;
  fluid_retention?: 'leve' | 'moderada' | 'severa' | 'ninguna';
  bust_cm?: number;
  underbust_cm?: number;
  waist_cm?: number;
  abdomen_high_cm?: number;
  abdomen_low_cm?: number;
  hips_cm?: number;
  thigh_right_cm?: number;
  thigh_left_cm?: number;
  arm_right_cm?: number;
  arm_left_cm?: number;
  notes?: string;
}

export interface BodyChart extends BaseEntity {
  client_id: UUID;
  session_id: UUID | null;
  date: string;
  points: BodyPoint[];
  measurements: BodyMeasurements;
  clinical_contraindications: string[];
  notes: string;
}

// 8. Ficha Cosmetológica / Facial
export interface FacialZone {
  id: string;
  zone: 'frente' | 'nariz' | 'mejilla_der' | 'mejilla_izq' | 'menton' | 'cuello' | 'escote' | 'orbicular_ojos';
  condition: 'grasa' | 'seca' | 'deshidratada' | 'sensible' | 'manchas' | 'acne' | 'lineas_expresion' | 'poros_dilatados';
  severity: 'leve' | 'moderada' | 'intensa';
  notes?: string;
}

export interface FacialChart extends BaseEntity {
  client_id: UUID;
  session_id: UUID | null;
  date: string;
  skin_type: 'eutrofica' | 'grasa' | 'seca' | 'mixta' | 'sensible' | 'acneica';
  phototype: 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
  hydration_level: 'optima' | 'moderada' | 'deshidratada' | 'alipica';
  sensitivity_level: 'normal' | 'reactiva' | 'rosacea' | 'eritema';
  allergies: string;
  active_lesions: string;
  current_skincare_routine: string;
  zones: FacialZone[];
  recommended_homecare: string;
}

// 9. Fotos de Seguimiento Antes / Después
export interface SessionPhoto extends BaseEntity {
  client_id: UUID;
  session_id: UUID | null;
  photo_type: 'before' | 'during' | 'after';
  image_url: string;
  tag: string; // e.g. "Abdomen Frente", "Perfil Rostro"
  notes: string | null;
  taken_at: string;
}

// 10. Consentimiento Informado & Formulario de Consulta
export type ConsentType = 'facial' | 'laser' | 'pestanas' | 'microblading';

export interface LashTechnicalGuide {
  service_type?: 'Lleno (Full Set)' | 'Llenar / Retoque' | 'Eliminación' | 'Otro';
  request_type?: 'Clásico' | 'Híbrido' | 'Volumen' | 'Mega volumen';
  material_type?: 'Sintético' | 'Seda' | 'Visón (Mink)' | 'Otro';
  style?: 'Natural' | 'Redondo' | 'Muñeca/Linda' | 'Gato/Zorro' | 'Ardilla' | 'Otro';
  curl?: 'A(J)' | 'B' | 'C' | 'D' | 'U' | 'L' | 'L+';
  thickness_mm?: string; // "0.03 mm" a "0.30 mm"
  length_mm?: string;    // "4 mm" a "22 mm"
  volume_fan?: 'Clásica 1 a 1' | '2D' | '3D' | '4D' | '5D' | '6D' | '7D' | '8D' | '9D' | '10D Mega Volume';
  mapping_left_eye?: string; // ej. "8-9-10-11-12-10 mm"
  mapping_right_eye?: string; // ej. "10-12-11-10-9-8 mm"
  notes?: string;
}

export type MicrobladingBrowShape = 'Arqueado' | 'Redondeado' | 'En forma de S' | 'Derecho' | 'Arco empinado' | 'Hacia arriba';

export interface MicrobladingDesignGuide {
  brow_shape?: MicrobladingBrowShape;
  pigment_color?: string;
  notes?: string;
  // Registro de Tratamiento (Imagen 6)
  treatment_notes?: string;
  pigments_used?: string;
  reactions?: string;
  pain_level?: string; // "1" a "10"
  anesthesia_used?: string;
  blades_used?: string; // Cuchillas
}

export interface ConsentFormData {
  consent_type?: ConsentType;
  gender?: string;
  emergency_contact?: string;
  referral_source?: string;
  medical_history?: {
    chronic_condition?: { answer: boolean; details?: string };
    medications?: { answer: boolean; details?: string };
    recent_surgery?: { answer: boolean; details?: string };
    allergic_reaction?: { answer: boolean; details?: string };
    skin_allergy?: { answer: boolean; details?: string };
  };
  skincare_history?: {
    prior_treatments?: { answer: boolean; details?: string };
    concerns_goals?: string;
    skin_conditions?: { answer: boolean; details?: string };
  };
  treatment_considerations?: {
    is_smoker?: boolean;
    sun_exposure?: boolean;
    stress_activities?: boolean;
    dietary_restriction?: boolean;
    post_care_knowledge?: boolean;
    upcoming_events?: boolean;
    follow_instructions?: boolean;
    pregnant_or_nursing?: boolean;
    recent_peeling?: boolean;
  };
  laser_history?: {
    prior_laser?: { answer: boolean; details?: string };
    concerns_goals?: string;
    adverse_reactions_history?: { answer: boolean; details?: string };
    accutane_6months?: boolean;
    retin_a_retinol_7days?: boolean;
    photosensitizing_meds?: boolean;
    daily_sun_exposure?: boolean;
    current_sunburn?: boolean;
    skin_irritates_easily?: boolean;
    sun_exposure_soon?: boolean;
    tanning_bed_lotion?: boolean;
    recent_peeling_laser?: boolean;
    bleaching_agents_sensitive?: boolean;
    tattoos_in_area?: boolean;
    botox_fillers_6months?: boolean;
    next_menstrual_cycle?: string;
    skin_abrasion_or_mole_in_area?: string;
    current_skincare_products?: string;
    prior_professional_hair_removal?: { answer: boolean; details?: string };
  };
  laser_checklist?: {
    oil_lotions_in_area?: boolean;
    topical_meds_in_area?: boolean;
    current_allergies?: boolean;
    eczema_psoriasis_in_area?: boolean;
    photosensitivity_history?: boolean;
    recent_tanning?: boolean;
    recent_chemotherapy?: boolean;
    other_conditions?: boolean;
  };
  laser_aftercare?: {
    avoid_sun_2weeks?: boolean;
    use_sunscreen_fps30?: boolean;
    avoid_hot_showers_sauna?: boolean;
    no_wax_tweezers_shave_only?: boolean;
    avoid_oil_fragrance_products?: boolean;
    use_cold_compress_if_irritated?: boolean;
  };
  lash_history?: {
    prior_extensions?: { answer: boolean; details?: string };
    concerns_goals?: string;
    eye_sensitivity_history?: { answer: boolean; details?: string };
  };
  lash_checklist?: {
    contact_lenses?: boolean;
    oil_lotions_around_eyes?: boolean;
    eye_drops_usage?: boolean;
    current_allergies?: boolean;
    recurrent_eye_infections?: boolean;
    dry_eye_sjogren?: boolean;
    recent_chemotherapy?: boolean;
    other_conditions?: boolean;
  };
  lash_aftercare?: {
    no_waterproof_mascara?: boolean;
    no_oil_products_eyes?: boolean;
    no_water_24_48h?: boolean;
    no_tint_perm?: boolean;
    no_rubbing_pulling?: boolean;
    care_with_eye_drops?: boolean;
  };
  lash_technical_guide?: LashTechnicalGuide;
  microblading_history?: {
    prior_microblading?: { answer: boolean; details?: string };
    concerns_goals?: string;
    skin_conditions_brow_area?: { answer: boolean; details?: string };
  };
  microblading_considerations?: {
    is_smoker?: boolean;
    sun_exposure_brows?: boolean;
    excessive_sweating_brows?: boolean;
    dietary_restrictions_affecting_healing?: boolean;
    knows_aftercare?: boolean;
    upcoming_event_interfering?: boolean;
    willing_follow_aftercare?: boolean;
    recent_peeling_exfoliation_brows?: boolean;
    pregnant_or_nursing?: boolean;
  };
  microblading_consent_clauses?: {
    accept_natural_brow_microblading?: boolean;
    understand_allergic_reaction_risk?: boolean;
    understand_infection_risk?: boolean;
    will_consult_doctor_if_issues?: boolean;
    aware_color_variation?: boolean;
    understand_dark_6_days?: boolean;
    understand_touch_up_needed?: boolean;
    understand_final_look_6_8_weeks?: boolean;
    understand_semipermanent_6_12_months?: boolean;
    understand_skin_treatments_may_affect?: boolean;
    not_under_influence?: boolean;
    no_rash_infection?: boolean;
    accept_aftercare_instructions?: boolean;
    accept_color_shape_responsibility?: boolean;
    consent_photos_before_after?: boolean;
  };
  microblading_design_guide?: MicrobladingDesignGuide;
  media_authorization?: {
    allow_photos_videos: boolean;
    allow_instagram_tag: boolean;
    instagram_handle?: string;
  };
  cancellation_policy?: {
    accepted: boolean;
    deposit_amount?: number;
    notice_hours?: number;
    tolerance_minutes?: number;
  };
  skin_analysis?: {
    skin_type?: string;
    pores?: string;
    moisture?: string;
    elasticity?: string;
    acne?: string;
    sensitivity?: string;
    fine_lines_glogau?: string;
    lifestyle?: string;
    known_allergies?: string;
    current_meds?: string;
    previous_treatments?: string;
    notes?: string;
  };
}

export interface InformedConsent extends BaseEntity {
  client_id: UUID;
  treatment_id: UUID | null;
  sub_treatment_id: UUID | null;
  consent_type?: ConsentType;
  title: string;
  content_text: string;
  client_dni: string;
  client_full_name: string;
  signature_image_base64: string;
  signed_at: string;
  witness_name?: string;
  ip_address?: string;
  form_data?: ConsentFormData;
  treatment_name?: string;
  sub_treatment_name?: string;
}

// 11. Productos & Stock
export interface Product extends BaseEntity {
  name: string;
  barcode: string | null;
  sku: string | null;
  category: string;
  brand: string | null;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  min_stock_alert: number;
  unit: string; // "ml", "gr", "unidad", "pack"
  is_internal_supply: boolean; // Usado en cabina / tratamientos
  is_for_sale: boolean;        // Vendible al público
  supplier: string | null;
  notes: string | null;
}

export type StockMovementType = 'purchase' | 'sale' | 'session_consumption' | 'adjustment' | 'waste';

export interface StockMovement extends BaseEntity {
  product_id: UUID;
  product_name?: string;
  movement_type: StockMovementType;
  quantity: number; // Positivo para ingresos, negativo para egresos
  unit_cost: number;
  reference_id: UUID | null; // e.g. appointment_id o session_id
  notes: string | null;
  created_by: string;
}

// 12. Caja y Facturación
export interface CashRegisterShift extends BaseEntity {
  opened_at: string;
  closed_at: string | null;
  initial_cash: number;
  total_incomes: number;
  total_expenses: number;
  expected_cash: number;
  total_cash?: number;
  total_cards?: number;
  total_transfers?: number;
  actual_cash: number | null;
  difference: number | null;
  status: 'open' | 'closed';
  opened_by: string;
  closed_by: string | null;
  notes: string | null;
}

export type PaymentMethod = 'cash' | 'card_debit' | 'card_credit' | 'transfer' | string;

export interface PaymentCardRule {
  id: string;
  name: string; // ej. "Mastercard", "Visa Banco Nación"
  percentage: number; // Positivo = recargo (ej. 5), Negativo = descuento (ej. -5)
  is_active: boolean;
}

export interface PaymentSurchargesConfig {
  cash_discount_percent: number; // ej. 10 para 10% de descuento
  debit_surcharge_percent: number; // ej. 0
  transfer_discount_percent: number; // ej. 0
  credit_default_surcharge_percent: number; // ej. 5
  card_rules: PaymentCardRule[];
}

export interface CashTransaction extends BaseEntity {
  shift_id: UUID;
  appointment_id: UUID | null;
  client_id: UUID | null;
  client_name?: string;
  type: 'income' | 'expense';
  category: string; // "Cobro de Turno", "Seña de Turno", "Venta de Producto", "Insumos", etc.
  amount: number;
  payment_method: PaymentMethod;
  card_brand?: string | null;
  surcharge_percentage?: number | null;
  notes: string | null;
}

export interface Receipt extends BaseEntity {
  receipt_number: string; // "REC-000124"
  appointment_id: UUID | null;
  client_id: UUID;
  client_name: string;
  client_dni: string | null;
  total_amount: number;
  items_summary: string;
  payment_method: PaymentMethod;
  pdf_path?: string;
}

// 13. Comisiones de Personal
export interface StaffCommission extends BaseEntity {
  staff_id: UUID;
  staff_name?: string;
  session_id: UUID | null;
  appointment_id: UUID | null;
  service_name: string;
  service_price: number;
  commission_rate: number; // Porcentaje aplicado
  amount_calculated: number;
  period_date: string; // YYYY-MM
  status: 'pending' | 'paid';
  paid_at: string | null;
}

// 14. Marketing & Publicaciones en Redes
export interface MarketingMedia {
  id: UUID;
  title: string;
  media_type: 'image' | 'video';
  file_url: string;
  thumbnail_url?: string;
  caption_template: string;
  hashtags: string[];
  suggested_stories: string[];
}

export interface MarketingPost extends BaseEntity {
  treatment_id: UUID | null;
  sub_treatment_id: UUID | null;
  title: string;
  caption: string;
  hashtags: string[];
  media_files: string[];
  target_channels: ('instagram' | 'whatsapp_status' | 'facebook' | 'tiktok')[];
  scheduled_for: string; // ISO string
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'manual_ready';
  published_at: string | null;
  log: string | null;
}

// 15. Copias de Seguridad (Backups)
export interface BackupItem {
  fileName: string;
  filePath: string;
  batName: string;
  batPath: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
  isAutomatic?: boolean;
}

export interface BackupConfig {
  backupDirectory: string;
  backupOnClose: boolean;
  backupRetentionDays: number;
}
