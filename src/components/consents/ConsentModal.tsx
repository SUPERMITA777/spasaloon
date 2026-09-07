import React, { useRef, useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { jsPDF } from 'jspdf';
import { getSocket } from '../../services/socket';
import {
  X,
  FileSignature,
  Save,
  Download,
  RotateCcw,
  QrCode,
  Smartphone,
  CheckCircle2,
  HeartPulse,
  Sparkles,
  ShieldCheck,
  FileCheck2,
  Camera,
  Clock,
  Instagram,
  Zap,
  Eye,
  Layers,
  Pencil,
} from 'lucide-react';
import { ConsentFormData, ConsentType, LashTechnicalGuide, MicrobladingDesignGuide } from '../../types';

interface Props {
  clientId: string;
  clientName: string;
  clientDni: string;
  treatmentId: string;
  treatmentName: string;
  onClose: () => void;
}

export const ConsentModal: React.FC<Props> = ({
  clientId,
  clientName,
  clientDni,
  treatmentId,
  treatmentName,
  onClose,
}) => {
  const { addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'qr_mobile' | 'desktop_form'>('qr_mobile');
  
  // Detección automática de tipo (Láser vs Pestañas vs Microblading vs Facial)
  const isLaser = treatmentName.toLowerCase().includes('láser') || treatmentName.toLowerCase().includes('laser') || treatmentName.toLowerCase().includes('depil');
  const isLash = treatmentName.toLowerCase().includes('pestañ') || treatmentName.toLowerCase().includes('lash');
  const isMicroblading = treatmentName.toLowerCase().includes('microblading') || treatmentName.toLowerCase().includes('ceja') || treatmentName.toLowerCase().includes('brow');
  
  const [consentType, setConsentType] = useState<ConsentType>(
    isLash ? 'pestanas' : isMicroblading ? 'microblading' : isLaser ? 'laser' : 'facial'
  );

  // QR State
  const [qrUrl, setQrUrl] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [loadingQr, setLoadingQr] = useState(true);
  const [mobileSignedReceived, setMobileSignedReceived] = useState(false);

  // Form State Común
  const [gender, setGender] = useState('Femenino');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [referralSource, setReferralSource] = useState('');

  const [chronicCondition, setChronicCondition] = useState(false);
  const [chronicDetails, setChronicDetails] = useState('');
  const [medications, setMedications] = useState(false);
  const [medicationDetails, setMedicationDetails] = useState('');
  const [recentSurgery, setRecentSurgery] = useState(false);
  const [surgeryDetails, setSurgeryDetails] = useState('');
  const [allergicReaction, setAllergicReaction] = useState(false);
  const [allergyDetails, setAllergyDetails] = useState('');
  const [skinAllergy, setSkinAllergy] = useState(false);
  const [skinAllergyDetails, setSkinAllergyDetails] = useState('');

  // Facial Específico
  const [priorTreatments, setPriorTreatments] = useState(false);
  const [priorTreatmentsDetails, setPriorTreatmentsDetails] = useState('');
  const [concernsGoals, setConcernsGoals] = useState('');

  // Láser Específico
  const [priorLaser, setPriorLaser] = useState(false);
  const [priorLaserDetails, setPriorLaserDetails] = useState('');
  const [laserGoals, setLaserGoals] = useState('');

  // Pestañas Específico (Registro de Diseño - Imágenes 1 y 5)
  const [priorLashes, setPriorLashes] = useState(false);
  const [priorLashesDetails, setPriorLashesDetails] = useState('');
  const [lashGoals, setLashGoals] = useState('');
  const [lashServiceType, setLashServiceType] = useState<'Lleno (Full Set)' | 'Llenar / Retoque' | 'Eliminación' | 'Otro'>('Lleno (Full Set)');
  const [lashRequestType, setLashRequestType] = useState<'Clásico' | 'Híbrido' | 'Volumen' | 'Mega volumen'>('Volumen');
  const [lashMaterial, setLashMaterial] = useState<'Sintético' | 'Seda' | 'Visón (Mink)' | 'Otro'>('Seda');
  const [lashCurl, setLashCurl] = useState<'A(J)' | 'B' | 'C' | 'D' | 'U' | 'L' | 'L+'>('C');
  const [lashThickness, setLashThickness] = useState('0.15 mm');
  const [lashLength, setLashLength] = useState('11 mm');
  const [lashStyle, setLashStyle] = useState<'Natural' | 'Redondo' | 'Muñeca/Linda' | 'Gato/Zorro' | 'Ardilla' | 'Otro'>('Muñeca/Linda');
  const [lashVolume, setLashVolume] = useState<'Clásica 1 a 1' | '2D' | '3D' | '4D' | '5D' | '6D' | '7D' | '8D' | '9D' | '10D Mega Volume'>('3D');
  const [mappingLeftEye, setMappingLeftEye] = useState('8-9-10-11-12-10 mm');
  const [mappingRightEye, setMappingRightEye] = useState('10-12-11-10-9-8 mm');
  const [lashNotes, setLashNotes] = useState('');

  // Microblading Específico
  const [priorMicroblading, setPriorMicroblading] = useState(false);
  const [priorMicrobladingDetails, setPriorMicrobladingDetails] = useState('');
  const [microbladingGoals, setMicrobladingGoals] = useState('');
  const [skinConditionsBrows, setSkinConditionsBrows] = useState(false);
  const [skinConditionsBrowsDetails, setSkinConditionsBrowsDetails] = useState('');
  const [mbSmoker, setMbSmoker] = useState(false);
  const [mbSunExposure, setMbSunExposure] = useState(false);
  const [mbSweating, setMbSweating] = useState(false);
  const [mbDietRestriction, setMbDietRestriction] = useState(false);
  const [mbKnowsAftercare, setMbKnowsAftercare] = useState(false);
  const [mbUpcomingEvent, setMbUpcomingEvent] = useState(false);
  const [mbWillingFollowAftercare, setMbWillingFollowAftercare] = useState(false);
  const [mbRecentPeeling, setMbRecentPeeling] = useState(false);
  const [mbPregnant, setMbPregnant] = useState(false);
  const [mbAcceptProcedure, setMbAcceptProcedure] = useState(false);
  const [mbAllergyRisk, setMbAllergyRisk] = useState(false);
  const [mbInfectionRisk, setMbInfectionRisk] = useState(false);
  const [mbConsultDoctor, setMbConsultDoctor] = useState(false);
  const [mbColorVariation, setMbColorVariation] = useState(false);
  const [mbDark6Days, setMbDark6Days] = useState(false);
  const [mbTouchUpNeeded, setMbTouchUpNeeded] = useState(false);
  const [mbFinalLook6_8Weeks, setMbFinalLook6_8Weeks] = useState(false);
  const [mbSemipermanent, setMbSemipermanent] = useState(false);
  const [mbSkinTreatmentsAffect, setMbSkinTreatmentsAffect] = useState(false);
  const [mbNotUnderInfluence, setMbNotUnderInfluence] = useState(false);
  const [mbNoRashInfection, setMbNoRashInfection] = useState(false);
  const [mbAcceptAftercare, setMbAcceptAftercare] = useState(false);
  const [mbAcceptColorShape, setMbAcceptColorShape] = useState(false);
  const [mbConsentPhotos, setMbConsentPhotos] = useState(false);
  const [mbBrowShape, setMbBrowShape] = useState<'Arqueado' | 'Redondeado' | 'En forma de S' | 'Derecho' | 'Arco empinado' | 'Hacia arriba'>('Arqueado');
  const [mbPigmentColor, setMbPigmentColor] = useState('');
  const [mbDesignNotes, setMbDesignNotes] = useState('');
  // Registro de Tratamiento (Imagen 6)
  const [mbTreatmentNotes, setMbTreatmentNotes] = useState('');
  const [mbPigmentsUsed, setMbPigmentsUsed] = useState('');
  const [mbReactions, setMbReactions] = useState('');
  const [mbPainLevel, setMbPainLevel] = useState('5');
  const [mbAnesthesiaUsed, setMbAnesthesiaUsed] = useState('');
  const [mbBladesUsed, setMbBladesUsed] = useState('');

  // Fotos & Cancelación
  const [allowPhotosVideos, setAllowPhotosVideos] = useState(true);
  const [allowInstagramTag, setAllowInstagramTag] = useState(true);
  const [instagramHandle, setInstagramHandle] = useState('');
  const [acceptCancellationPolicy, setAcceptCancellationPolicy] = useState(true);

  // Canvas Firma
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cargar QR para el celular del cliente
  useEffect(() => {
    async function loadQr() {
      try {
        setLoadingQr(true);
        const res = await fetch(`http://localhost:3100/api/consents/qr-url?clientId=${clientId}&treatmentId=${treatmentId}&type=${consentType}`);
        const data = await res.json();
        setQrUrl(data.url);
        setQrImage(data.qrImage);
      } catch (err) {
        console.error('Error cargando QR:', err);
      } finally {
        setLoadingQr(false);
      }
    }
    loadQr();
  }, [clientId, treatmentId, consentType]);

  // Escuchar firma desde el móvil vía WebSockets
  useEffect(() => {
    const s = getSocket();
    const handleConsentSigned = (consent: any) => {
      if (consent.client_id === clientId) {
        setMobileSignedReceived(true);
        addToast({
          type: 'success',
          title: '¡Consentimiento firmado desde el celular!',
          message: `${clientName} completó y firmó el formulario correctamente.`,
        });
      }
    };

    s.on('consent:signed', handleConsentSigned);
    return () => {
      s.off('consent:signed', handleConsentSigned);
    };
  }, [clientId, clientName, addToast]);

  // Inicializar Canvas
  useEffect(() => {
    if (activeTab === 'desktop_form') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.strokeStyle = '#2D2926';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [activeTab]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Guardar consentimiento desde PC
  const handleSaveDesktop = async () => {
    if (!hasSignature) {
      addToast({ type: 'warning', title: 'Por favor complete la firma en pantalla' });
      return;
    }

    try {
      setSaving(true);
      const signatureBase64 = canvasRef.current?.toDataURL('image/png') || '';

      const formData: ConsentFormData = {
        consent_type: consentType,
        gender,
        emergency_contact: emergencyContact,
        referral_source: referralSource,
        medical_history: {
          chronic_condition: { answer: chronicCondition, details: chronicDetails },
          medications: { answer: medications, details: medicationDetails },
          recent_surgery: { answer: recentSurgery, details: surgeryDetails },
          allergic_reaction: { answer: allergicReaction, details: allergyDetails },
          skin_allergy: { answer: skinAllergy, details: skinAllergyDetails },
        },
        skincare_history: consentType === 'facial' ? {
          prior_treatments: { answer: priorTreatments, details: priorTreatmentsDetails },
          concerns_goals: concernsGoals,
        } : undefined,
        laser_history: consentType === 'laser' ? {
          prior_laser: { answer: priorLaser, details: priorLaserDetails },
          concerns_goals: laserGoals,
        } : undefined,
        lash_history: consentType === 'pestanas' ? {
          prior_extensions: { answer: priorLashes, details: priorLashesDetails },
          concerns_goals: lashGoals,
        } : undefined,
        lash_technical_guide: consentType === 'pestanas' ? {
          service_type: lashServiceType,
          request_type: lashRequestType,
          material_type: lashMaterial,
          style: lashStyle,
          curl: lashCurl,
          thickness_mm: lashThickness,
          length_mm: lashLength,
          volume_fan: lashVolume,
          mapping_left_eye: mappingLeftEye,
          mapping_right_eye: mappingRightEye,
          notes: lashNotes,
        } : undefined,
        microblading_history: consentType === 'microblading' ? {
          prior_microblading: { answer: priorMicroblading, details: priorMicrobladingDetails },
          concerns_goals: microbladingGoals,
          skin_conditions_brow_area: { answer: skinConditionsBrows, details: skinConditionsBrowsDetails },
        } : undefined,
        microblading_considerations: consentType === 'microblading' ? {
          is_smoker: mbSmoker,
          sun_exposure_brows: mbSunExposure,
          excessive_sweating_brows: mbSweating,
          dietary_restrictions_affecting_healing: mbDietRestriction,
          knows_aftercare: mbKnowsAftercare,
          upcoming_event_interfering: mbUpcomingEvent,
          willing_follow_aftercare: mbWillingFollowAftercare,
          recent_peeling_exfoliation_brows: mbRecentPeeling,
          pregnant_or_nursing: mbPregnant,
        } : undefined,
        microblading_consent_clauses: consentType === 'microblading' ? {
          accept_natural_brow_microblading: mbAcceptProcedure,
          understand_allergic_reaction_risk: mbAllergyRisk,
          understand_infection_risk: mbInfectionRisk,
          will_consult_doctor_if_issues: mbConsultDoctor,
          aware_color_variation: mbColorVariation,
          understand_dark_6_days: mbDark6Days,
          understand_touch_up_needed: mbTouchUpNeeded,
          understand_final_look_6_8_weeks: mbFinalLook6_8Weeks,
          understand_semipermanent_6_12_months: mbSemipermanent,
          understand_skin_treatments_may_affect: mbSkinTreatmentsAffect,
          not_under_influence: mbNotUnderInfluence,
          no_rash_infection: mbNoRashInfection,
          accept_aftercare_instructions: mbAcceptAftercare,
          accept_color_shape_responsibility: mbAcceptColorShape,
          consent_photos_before_after: mbConsentPhotos,
        } : undefined,
        microblading_design_guide: consentType === 'microblading' ? {
          brow_shape: mbBrowShape,
          pigment_color: mbPigmentColor,
          notes: mbDesignNotes,
          treatment_notes: mbTreatmentNotes,
          pigments_used: mbPigmentsUsed,
          reactions: mbReactions,
          pain_level: mbPainLevel,
          anesthesia_used: mbAnesthesiaUsed,
          blades_used: mbBladesUsed,
        } : undefined,
        media_authorization: {
          allow_photos_videos: allowPhotosVideos,
          allow_instagram_tag: allowInstagramTag,
          instagram_handle: instagramHandle || undefined,
        },
        cancellation_policy: {
          accepted: acceptCancellationPolicy,
          notice_hours: 24,
          tolerance_minutes: 15,
        },
      };

      const titleMap: Record<ConsentType, string> = {
        pestanas: `Extensión de Pestañas — Formulario de Consulta & Consentimiento: ${treatmentName}`,
        laser: `Depilación Láser — Formulario de Consulta & Consentimiento: ${treatmentName}`,
        facial: `Cuidado Facial y de la Piel — Formulario de Consulta & Consentimiento: ${treatmentName}`,
        microblading: `Microblading — Formulario de Consulta & Consentimiento: ${treatmentName}`,
      };

      const legalMap: Record<ConsentType, string> = {
        pestanas: `Entiendo que las extensiones son semipermanentes. Acepto mantener ojos cerrados durante todo el procedimiento y los cuidados posteriores (no aceites, no agua 24-48h, no frotar). Confirmo ser mayor de 18 años.`,
        laser: `Entiendo que la depilación láser es semipermanente (reducción 70-90%). Acepto el uso obligatorio de gafas protectoras y los cuidados post-tratamiento (prohibición de cera/pinzas, FPS 30). Confirmo ser mayor de 18 años.`,
        facial: `He completado este formulario de manera precisa y veraz. Acepto la Política de Cancelación y autorizaciones de fotos. Libero de responsabilidad por omisión médica.`,
        microblading: `He completado este formulario lo mejor que he podido y he sabido. Acepto informar al técnico de cualquier cambio. Acepto renunciar a toda responsabilidad ante mi técnico y el salón por cualquier lesión o daño incurrido debido a cualquier declaración errónea sobre mi salud. Confirmo ser mayor de 18 años.`,
      };

      await api.createConsent({
        client_id: clientId,
        treatment_id: treatmentId,
        title: titleMap[consentType],
        content_text: legalMap[consentType],
        client_dni: clientDni || 'S/D',
        client_full_name: clientName,
        signature_image_base64: signatureBase64,
        form_data: formData,
      });

      addToast({ type: 'success', title: '¡Consentimiento firmado y guardado!' });
      onClose();
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al guardar consentimiento', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  // Exportar PDF completo
  const handleExportPDF = () => {
    if (!hasSignature && !mobileSignedReceived) {
      addToast({ type: 'warning', title: 'Firme el documento antes de exportar a PDF' });
      return;
    }

    const doc = new jsPDF();
    const signatureBase64 = canvasRef.current?.toDataURL('image/png');

    // Header Elegante
    doc.setFillColor(197, 155, 126);
    doc.rect(0, 0, 210, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('times', 'bold');
    doc.setFontSize(15);
    
    const bannerTitle = consentType === 'pestanas'
      ? 'AURA SUITE — EXTENSIÓN DE PESTAÑAS'
      : consentType === 'laser'
      ? 'AURA SUITE — DEPILACIÓN LÁSER & REGISTRO'
      : consentType === 'microblading'
      ? 'AURA SUITE — MICROBLADING DE CEJAS'
      : 'AURA SUITE — CUIDADO FACIAL Y DE LA PIEL';

    doc.text(bannerTitle, 105, 15, { align: 'center' });

    // Subtítulo
    doc.setTextColor(45, 41, 38);
    doc.setFontSize(12);
    const subTitle = consentType === 'pestanas'
      ? 'REGISTRO DE DISEÑO DEL CLIENTE & CONSENTIMIENTO INFORMADO'
      : consentType === 'laser'
      ? 'FORMULARIO DE CONSULTA, PRECAUCIONES LÁSER & CONSENTIMIENTO'
      : consentType === 'microblading'
      ? 'FORMULARIO DE CONSULTA, GUÍA DE CEJAS & CONSENTIMIENTO'
      : 'FORMULARIO DE CONSULTA, AUTORIZACIONES & CONSENTIMIENTO';

    doc.text(subTitle, 105, 34, { align: 'center' });

    // Datos del Paciente
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Nombre del Cliente: ${clientName}`, 20, 44);
    doc.text(`DNI: ${clientDni || 'S/D'}`, 140, 44);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tratamiento: ${treatmentName}`, 20, 50);

    // 1. Historial Médico
    doc.setFont('helvetica', 'bold');
    doc.text('1. Historial Médico y de Salud', 20, 59);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`• Condición médica preexistente: ${chronicCondition ? 'SÍ (' + chronicDetails + ')' : 'NO'}`, 25, 65);
    doc.text(`• Medicamentos actuales: ${medications ? 'SÍ (' + medicationDetails + ')' : 'NO'}`, 25, 70);
    doc.text(`• Cirugías recientes: ${recentSurgery ? 'SÍ (' + surgeryDetails + ')' : 'NO'}`, 25, 75);
    doc.text(`• Alergias o sensibilidad conocida: ${skinAllergy ? 'SÍ (' + skinAllergyDetails + ')' : 'NO'}`, 25, 80);

    if (consentType === 'pestanas') {
      // 2. Registro de Diseño Ocular
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('2. Registro de Diseño & Mapping Ocular', 20, 90);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`• Servicio: ${lashServiceType} | Solicitud/Efecto: ${lashRequestType} | Material: ${lashMaterial}`, 25, 96);
      doc.text(`• Estilo/Mapping: ${lashStyle} | Curva: ${lashCurl} | Grosor: ${lashThickness} | Largo: ${lashLength} | Fans: ${lashVolume}`, 25, 101);
      doc.text(`• Mapping Ojo Izquierdo: ${mappingLeftEye} | Ojo Derecho: ${mappingRightEye}`, 25, 106);
      if (lashNotes) {
        doc.text(`• Notas de la Lashista: ${lashNotes}`, 25, 111);
      }

      // 3. Normas de Seguridad
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('3. Normas de Seguridad & Cuidados Post-Pestañas', 20, 120);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('• Mantener ojos cerrados durante toda la duración de la aplicación.', 25, 126);
      doc.text('• NO mojar los ojos ni aplicar vapor/agua durante 24 a 48 horas.', 25, 131);
      doc.text('• PROHIBIDO uso de máscara waterproof y productos a base de aceite en el área de los ojos.', 25, 136);
    } else if (consentType === 'microblading') {
      // 2. Historia del Microblading
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('2. Historia del Microblading & Guía de Cejas', 20, 90);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`• Procedimientos previos de microblading/maquillaje permanente: ${priorMicroblading ? 'SÍ (' + priorMicrobladingDetails + ')' : 'NO'}`, 25, 96);
      doc.text(`• Afecciones cutáneas en zona de cejas (eczema, psoriasis, queloides): ${skinConditionsBrows ? 'SÍ (' + skinConditionsBrowsDetails + ')' : 'NO'}`, 25, 101);
      doc.text(`• Objetivos: ${microbladingGoals || 'No especificado'}`, 25, 106);
      doc.text(`• Forma de ceja seleccionada: ${mbBrowShape} | Color de pigmento: ${mbPigmentColor || 'A definir'}`, 25, 111);

      // 3. Consideraciones
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('3. Consideraciones del Tratamiento', 20, 120);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`• Fumador/humo 2da mano: ${mbSmoker ? 'SÍ' : 'NO'} | Exposición solar frecuente: ${mbSunExposure ? 'SÍ' : 'NO'} | Embarazo/lactancia: ${mbPregnant ? 'SÍ' : 'NO'}`, 25, 126);
      doc.text(`• Peeling/exfoliación reciente en cejas: ${mbRecentPeeling ? 'SÍ' : 'NO'} | Dispuesto a seguir cuidados post: ${mbWillingFollowAftercare ? 'SÍ' : 'NO'}`, 25, 131);
      doc.text('• Resultado semipermanente (6 meses a 1 año). Se requiere retoque a las 4 semanas. Aspecto final a las 6-8 semanas.', 25, 136);

      // 4. Registro de Tratamiento & Elementos
      if (mbPigmentsUsed || mbAnesthesiaUsed || mbBladesUsed) {
        doc.addPage();
        doc.setFillColor(197, 155, 126);
        doc.rect(0, 0, 210, 18, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('times', 'bold');
        doc.setFontSize(13);
        doc.text('REGISTRO DE TRATAMIENTO — MICROBLADING', 105, 12, { align: 'center' });

        doc.setTextColor(45, 41, 38);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Elementos Utilizados', 20, 28);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text(`• Pigmentos: ${mbPigmentsUsed || 'N/A'}`, 25, 34);
        doc.text(`• Anestesia: ${mbAnesthesiaUsed || 'N/A'}`, 25, 39);
        doc.text(`• Cuchillas: ${mbBladesUsed || 'N/A'}`, 25, 44);
        doc.text(`• Reacciones: ${mbReactions || 'Ninguna'}`, 25, 49);
        doc.text(`• Nivel de dolor (1-10): ${mbPainLevel}`, 25, 54);
        if (mbTreatmentNotes) {
          doc.text(`• Notas de tratamiento: ${mbTreatmentNotes}`, 25, 62);
        }
      }
    } else if (consentType === 'laser') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('2. Historia de la Depilación Láser & Fotosensibilidad', 20, 90);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`• Procedimientos láser previos: ${priorLaser ? 'SÍ (' + priorLaserDetails + ')' : 'NO'}`, 25, 96);
      doc.text(`• Uso obligatorio de gafas protectoras y no depilar con cera/pinzas entre sesiones.`, 25, 101);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('2. Historia del Cuidado Facial', 20, 90);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`• Tratamientos previos: ${priorTreatments ? 'SÍ (' + priorTreatmentsDetails + ')' : 'NO'}`, 25, 96);
      doc.text(`• Objetivos: ${concernsGoals || 'No especificado'}`, 25, 101);
    }

    // Autorizaciones & Cancelación
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Autorizaciones & Política de Cancelación', 20, 142);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`• Fotos publicitarias: ${allowPhotosVideos ? 'AUTORIZADO' : 'NO AUTORIZADO'} | Instagram: ${allowInstagramTag ? 'ETIQUETAR' : 'NO ETIQUETAR'}`, 25, 148);
    doc.text(`• Política de cancelación (aviso 24hs / tolerancia 15 min): ACEPTADA POR EL CLIENTE`, 25, 153);

    // Firma
    if (signatureBase64) {
      doc.addImage(signatureBase64, 'PNG', 120, 178, 60, 25);
    }
    doc.line(120, 205, 185, 205);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Firma Digital del Cliente: ${clientName}`, 152, 210, { align: 'center' });
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, 152, 215, { align: 'center' });

    const fileSuffix = consentType === 'pestanas' ? 'Pestanas' : consentType === 'laser' ? 'Laser' : consentType === 'microblading' ? 'Microblading' : 'Facial';
    doc.save(`Consentimiento_${fileSuffix}_${clientName.replace(/\s+/g, '_')}.pdf`);
    addToast({ type: 'success', title: 'PDF de consentimiento descargado' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-graphite-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-soft-lg border border-rose-gold-200 overflow-hidden animate-scale-up flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-gold-600 to-rose-gold-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileSignature className="w-5 h-5" />
            <div>
              <h2 className="font-serif font-bold text-base leading-tight">
                {consentType === 'pestanas'
                  ? 'Extensión de Pestañas'
                  : consentType === 'laser'
                  ? 'Depilación Láser'
                  : 'Cuidado Facial y de la Piel'} — Formulario & Consentimiento
              </h2>
              <p className="text-[11px] text-rose-100">
                Paciente: <b>{clientName}</b> {clientDni ? `(DNI: ${clientDni})` : ''} • Servicio: <b>{treatmentName}</b>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selector Facial vs Láser vs Pestañas */}
        <div className="bg-silk-100/70 px-6 py-2.5 border-b border-rose-gold-100 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs font-bold text-graphite-700">Tipo de Consentimiento:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConsentType('facial')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                consentType === 'facial'
                  ? 'bg-rose-gold-600 text-white shadow-xs'
                  : 'bg-white text-graphite-600 border border-rose-gold-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Facial</span>
            </button>
            <button
              type="button"
              onClick={() => setConsentType('laser')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                consentType === 'laser'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white text-graphite-600 border border-rose-gold-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Láser</span>
            </button>
            <button
              type="button"
              onClick={() => setConsentType('pestanas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                consentType === 'pestanas'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-xs'
                  : 'bg-white text-graphite-600 border border-rose-gold-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Pestañas</span>
            </button>
            <button
              type="button"
              onClick={() => setConsentType('microblading')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                consentType === 'microblading'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-800 text-white shadow-xs'
                  : 'bg-white text-graphite-600 border border-rose-gold-200'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Microblading</span>
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-rose-gold-100 bg-silk-50 px-6 pt-3 gap-3 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('qr_mobile')}
            className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition-all ${
              activeTab === 'qr_mobile'
                ? 'border-rose-gold-600 text-rose-gold-800 font-bold'
                : 'border-transparent text-graphite-500 hover:text-graphite-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>📲 Firma con QR desde Celular (Recomendado)</span>
          </button>

          <button
            onClick={() => setActiveTab('desktop_form')}
            className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition-all ${
              activeTab === 'desktop_form'
                ? 'border-rose-gold-600 text-rose-gold-800 font-bold'
                : 'border-transparent text-graphite-500 hover:text-graphite-800'
            }`}
          >
            <FileSignature className="w-4 h-4" />
            <span>💻 Completar y Firmar en esta Pantalla</span>
          </button>
        </div>

        {/* Tab 1: QR Móvil */}
        {activeTab === 'qr_mobile' && (
          <div className="p-8 overflow-y-auto flex-1 bg-silk-50/40 flex flex-col items-center justify-center text-center space-y-6">
            {mobileSignedReceived ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-3 animate-scale-up max-w-md">
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-soft">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="font-serif font-bold text-lg text-emerald-950">
                  ¡Formulario y Firma Recibidos!
                </h3>
                <p className="text-xs text-emerald-800">
                  El cliente completó el formulario de <b>{consentType === 'pestanas' ? 'Extensión de Pestañas' : consentType === 'laser' ? 'Depilación Láser' : 'Cuidado Facial'}</b> y firmó correctamente desde su celular.
                </p>
                <div className="pt-2">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-soft"
                  >
                    Aceptar y Continuar
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-md w-full space-y-5">
                <div className="space-y-1.5">
                  <h3 className="font-serif font-bold text-lg text-graphite-900">
                    Escanea para Formulario de {consentType === 'pestanas' ? 'Extensión de Pestañas' : consentType === 'laser' ? 'Depilación Láser' : 'Cuidado Facial'}
                  </h3>
                  <p className="text-xs text-graphite-500 leading-relaxed">
                    Pídele al cliente que apunte la cámara de su celular al código QR para abrir el formulario interactivo y firmar con su dedo.
                  </p>
                </div>

                <div className="p-6 bg-white rounded-3xl border-2 border-rose-gold-200 shadow-soft inline-block mx-auto">
                  {loadingQr ? (
                    <div className="w-64 h-64 flex items-center justify-center text-xs text-graphite-400">
                      Generando QR offline...
                    </div>
                  ) : (
                    qrImage && (
                      <img src={qrImage} alt="QR Consentimiento" className="w-64 h-64 mx-auto rounded-2xl p-1" />
                    )
                  )}
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-mono text-graphite-400">
                    <Smartphone className="w-3.5 h-3.5 text-rose-gold-500" />
                    <span>Conectado a la Red Wi-Fi Local (Sin Internet)</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-rose-gold-800 bg-rose-gold-50 py-2.5 px-4 rounded-2xl border border-rose-gold-200">
                  <span className="w-2 h-2 rounded-full bg-rose-gold-600 animate-ping"></span>
                  <span>Esperando envío desde el celular del cliente...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Modo Formulario en PC */}
        {activeTab === 'desktop_form' && (
          <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-silk-50/40 text-xs">
            {/* Historial Médico */}
            <div className="bg-white rounded-2xl p-5 border border-rose-gold-100 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-rose-gold-100 pb-2">
                <HeartPulse className="w-4 h-4 text-rose-gold-600" />
                <h4 className="font-serif font-bold text-sm text-graphite-900">1. Historial Médico y de Salud</h4>
              </div>
              <div className="space-y-2">
                {[
                  { label: '¿Condición médica preexistente o crónica?', val: chronicCondition, set: setChronicCondition },
                  { label: '¿Medicamentos o suplementos actuales?', val: medications, set: setMedications },
                  { label: '¿Alergias o sensibilidad ocular/cutánea?', val: skinAllergy, set: setSkinAllergy },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-silk-50/50 rounded-xl border border-rose-gold-100">
                    <span className="font-semibold text-graphite-800">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" checked={!item.val} onChange={() => item.set(false)} />
                        <span>No</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer text-rose-gold-700 font-bold">
                        <input type="radio" checked={item.val} onChange={() => item.set(true)} />
                        <span>Sí</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Específico Pestañas */}
            {consentType === 'pestanas' && (
              <div className="bg-white rounded-2xl p-5 border border-pink-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-pink-100 pb-2">
                  <Eye className="w-4 h-4 text-pink-600" />
                  <h4 className="font-serif font-bold text-sm text-graphite-900">2. Ficha Técnica de Extensiones</h4>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <label className="font-bold text-graphite-700 block mb-1">Rizado:</label>
                    <select value={lashCurl} onChange={(e: any) => setLashCurl(e.target.value)} className="w-full p-2 border rounded-xl bg-silk-50">
                      {['A(J)', 'B', 'C', 'D', 'U', 'L', 'L+'].map((c) => (<option key={c} value={c}>{c}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-graphite-700 block mb-1">Estilo (Mapping):</label>
                    <select value={lashStyle} onChange={(e: any) => setLashStyle(e.target.value)} className="w-full p-2 border rounded-xl bg-silk-50">
                      {['Natural', 'Redondo', 'Muñeca/Linda', 'Gato/Zorro', 'Ardilla'].map((s) => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Firma Digital en PC */}
            <div className="bg-white rounded-2xl p-5 border border-rose-gold-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-serif font-bold text-xs text-graphite-900 flex items-center gap-1.5">
                  <FileSignature className="w-4 h-4 text-rose-gold-600" />
                  Firma Digital del Paciente:
                </label>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="flex items-center gap-1 text-[11px] text-rose-gold-600 hover:text-rose-gold-800"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Borrar firma</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-rose-gold-300 rounded-2xl overflow-hidden bg-white p-1">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-36 bg-silk-50/40 rounded-xl cursor-crosshair touch-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-rose-gold-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-graphite-800 hover:bg-graphite-900 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Descargar PDF Completo</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-rose-gold-300 text-xs font-semibold text-graphite-700 hover:bg-silk-100"
            >
              Cerrar
            </button>

            {activeTab === 'desktop_form' && (
              <button
                type="button"
                onClick={handleSaveDesktop}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 hover:from-rose-gold-600 hover:to-rose-gold-700 text-white text-xs font-semibold shadow-soft"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Guardando...' : 'Guardar en Expediente'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
