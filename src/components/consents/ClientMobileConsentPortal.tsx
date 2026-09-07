import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api';
import { Client, Treatment, ConsentFormData, ConsentType, LashTechnicalGuide } from '../../types';
import {
  Sparkles,
  CheckCircle2,
  FileCheck2,
  HeartPulse,
  ShieldCheck,
  Eraser,
  Send,
  User,
  Phone,
  Mail,
  Calendar,
  Camera,
  Clock,
  Instagram,
  Zap,
  Eye,
  Layers,
  Sparkle,
  Pencil,
} from 'lucide-react';

export const ClientMobileConsentPortal: React.FC = () => {
  // Query params
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('clientId') || '';
  const treatmentId = urlParams.get('treatmentId') || '';
  const subTreatmentId = urlParams.get('subTreatmentId') || '';
  const initialType = (urlParams.get('type') as ConsentType) || 'facial';

  const [consentType, setConsentType] = useState<ConsentType>(initialType);
  const [client, setClient] = useState<Client | null>(null);
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State Común
  const [fullName, setFullName] = useState('');
  const [dni, setDni] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('Femenino');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [referralSource, setReferralSource] = useState('');

  // Historial Médico y de Salud (Común)
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

  // 1. Facial
  const [priorTreatments, setPriorTreatments] = useState(false);
  const [priorTreatmentsDetails, setPriorTreatmentsDetails] = useState('');
  const [concernsGoals, setConcernsGoals] = useState('');
  const [skinConditions, setSkinConditions] = useState(false);
  const [skinConditionsDetails, setSkinConditionsDetails] = useState('');
  const [isSmoker, setIsSmoker] = useState(false);
  const [sunExposure, setSunExposure] = useState(false);
  const [stressActivities, setStressActivities] = useState(false);
  const [dietaryRestriction, setDietaryRestriction] = useState(false);
  const [postCareKnowledge, setPostCareKnowledge] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState(false);
  const [followInstructions, setFollowInstructions] = useState(true);
  const [pregnantOrNursing, setPregnantOrNursing] = useState(false);
  const [recentPeeling, setRecentPeeling] = useState(false);

  // 2. Láser
  const [priorLaser, setPriorLaser] = useState(false);
  const [priorLaserDetails, setPriorLaserDetails] = useState('');
  const [laserGoals, setLaserGoals] = useState('');
  const [laserReactions, setLaserReactions] = useState(false);
  const [laserReactionsDetails, setLaserReactionsDetails] = useState('');
  const [accutane6Months, setAccutane6Months] = useState(false);
  const [retinA7Days, setRetinA7Days] = useState(false);
  const [photosensitizingMeds, setPhotosensitizingMeds] = useState(false);
  const [dailySunExposure, setDailySunExposure] = useState(false);
  const [currentSunburn, setCurrentSunburn] = useState(false);
  const [skinIrritatesEasily, setSkinIrritatesEasily] = useState(false);
  const [sunExposureSoon, setSunExposureSoon] = useState(false);
  const [tanningBedLotion, setTanningBedLotion] = useState(false);
  const [recentPeelingLaser, setRecentPeelingLaser] = useState(false);
  const [bleachingAgentsSensitive, setBleachingAgentsSensitive] = useState(false);
  const [tattoosInArea, setTattoosInArea] = useState(false);
  const [botoxFillers6Months, setBotoxFillers6Months] = useState(false);
  const [nextMenstrualCycle, setNextMenstrualCycle] = useState('');
  const [skinAbrasionInArea, setSkinAbrasionInArea] = useState('');
  const [currentSkincareProducts, setCurrentSkincareProducts] = useState('');
  const [priorProfHairRemoval, setPriorProfHairRemoval] = useState(false);
  const [priorProfHairRemovalDetails, setPriorProfHairRemovalDetails] = useState('');
  const [laserCheckOil, setLaserCheckOil] = useState(false);
  const [laserCheckTopical, setLaserCheckTopical] = useState(false);
  const [laserCheckAllergies, setLaserCheckAllergies] = useState(false);
  const [laserCheckEczema, setLaserCheckEczema] = useState(false);
  const [laserCheckPhotosens, setLaserCheckPhotosens] = useState(false);
  const [laserCheckTanning, setLaserCheckTanning] = useState(false);
  const [laserCheckChemo, setLaserCheckChemo] = useState(false);
  const [aftercareSun2Weeks, setAftercareSun2Weeks] = useState(true);
  const [aftercareFps30, setAftercareFps30] = useState(true);
  const [aftercareHotShowers, setAftercareHotShowers] = useState(true);
  const [aftercareNoWax, setAftercareNoWax] = useState(true);
  const [aftercareNoOilFragrance, setAftercareNoOilFragrance] = useState(true);
  const [aftercareColdCompress, setAftercareColdCompress] = useState(true);

  // 3. PESTAÑAS (Nuevo)
  const [priorLashes, setPriorLashes] = useState(false);
  const [priorLashesDetails, setPriorLashesDetails] = useState('');
  const [lashGoals, setLashGoals] = useState('');
  const [lashSensitivity, setLashSensitivity] = useState(false);
  const [lashSensitivityDetails, setLashSensitivityDetails] = useState('');

  // Checklist Pestañas
  const [lashContactLenses, setLashContactLenses] = useState(false);
  const [lashOilAroundEyes, setLashOilAroundEyes] = useState(false);
  const [lashEyeDrops, setLashEyeDrops] = useState(false);
  const [lashAllergies, setLashAllergies] = useState(false);
  const [lashRecurrentInfections, setLashRecurrentInfections] = useState(false);
  const [lashDryEye, setLashDryEye] = useState(false);
  const [lashChemo, setLashChemo] = useState(false);

  // Cuidados Post-Pestañas
  const [lashNoWaterproof, setLashNoWaterproof] = useState(true);
  const [lashNoOil, setLashNoOil] = useState(true);
  const [lashNoWater48h, setLashNoWater48h] = useState(true);
  const [lashNoTintPerm, setLashNoTintPerm] = useState(true);
  const [lashNoRubbing, setLashNoRubbing] = useState(true);
  const [lashCareEyeDrops, setLashCareEyeDrops] = useState(true);

  // Ficha Técnica / Registro de Diseño de Pestañas (Imágenes 1 y 5)
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
  // Consideraciones Microblading
  const [mbSmoker, setMbSmoker] = useState(false);
  const [mbSunExposure, setMbSunExposure] = useState(false);
  const [mbSweating, setMbSweating] = useState(false);
  const [mbDietaryRestrictions, setMbDietaryRestrictions] = useState(false);
  const [mbKnowsAftercare, setMbKnowsAftercare] = useState(false);
  const [mbUpcomingEvent, setMbUpcomingEvent] = useState(false);
  const [mbWillingFollowAftercare, setMbWillingFollowAftercare] = useState(false);
  const [mbRecentPeeling, setMbRecentPeeling] = useState(false);
  const [mbPregnant, setMbPregnant] = useState(false);
  // Consentimiento Microblading (cláusulas con iniciales)
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
  // Guía de Cejas
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

  // Cargar datos iniciales
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        if (clientId) {
          const clients = await api.getClients();
          const found = clients.find((c) => c.id === clientId);
          if (found) {
            setClient(found);
            setFullName(`${found.first_name} ${found.last_name}`);
            setDni(found.dni || '');
            setPhone(found.phone || '');
            setEmail(found.email || '');
            if (found.birth_date) {
              setBirthDate(found.birth_date.split('T')[0]);
            }
          }
        }

        if (treatmentId) {
          const treatments = await api.getTreatments();
          const tFound = treatments.find((t) => t.id === treatmentId);
          if (tFound) {
            setTreatment(tFound);
            if (tFound.category === 'depilacion') {
              setConsentType('laser');
            } else if (tFound.category === 'pestanas_cejas' || tFound.name.toLowerCase().includes('pestañ') || tFound.name.toLowerCase().includes('lash')) {
              setConsentType('pestanas');
            }
          }
        }
      } catch (err) {
        console.error('Error cargando portal móvil:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [clientId, treatmentId]);

  // Inicializar Canvas táctil
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.strokeStyle = '#2D2926';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [loading, submitted, consentType]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSignature || !canvasRef.current) {
      alert('Por favor, realiza tu firma con el dedo en el recuadro antes de enviar.');
      return;
    }

    if (!acceptCancellationPolicy) {
      alert('Debes aceptar la Política de Citas y Cancelaciones para continuar.');
      return;
    }

    try {
      setSaving(true);
      const signatureBase64 = canvasRef.current.toDataURL('image/png');

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
          skin_conditions: { answer: skinConditions, details: skinConditionsDetails },
        } : undefined,
        laser_history: consentType === 'laser' ? {
          prior_laser: { answer: priorLaser, details: priorLaserDetails },
          concerns_goals: laserGoals,
          adverse_reactions_history: { answer: laserReactions, details: laserReactionsDetails },
          accutane_6months: accutane6Months,
          retin_a_retinol_7days: retinA7Days,
          photosensitizing_meds: photosensitizingMeds,
          daily_sun_exposure: dailySunExposure,
          current_sunburn: currentSunburn,
          skin_irritates_easily: skinIrritatesEasily,
          sun_exposure_soon: sunExposureSoon,
          tanning_bed_lotion: tanningBedLotion,
          recent_peeling_laser: recentPeelingLaser,
          bleaching_agents_sensitive: bleachingAgentsSensitive,
          tattoos_in_area: tattoosInArea,
          botox_fillers_6months: botoxFillers6Months,
          next_menstrual_cycle: nextMenstrualCycle,
          skin_abrasion_or_mole_in_area: skinAbrasionInArea,
          current_skincare_products: currentSkincareProducts,
          prior_professional_hair_removal: { answer: priorProfHairRemoval, details: priorProfHairRemovalDetails },
        } : undefined,
        laser_checklist: consentType === 'laser' ? {
          oil_lotions_in_area: laserCheckOil,
          topical_meds_in_area: laserCheckTopical,
          current_allergies: laserCheckAllergies,
          eczema_psoriasis_in_area: laserCheckEczema,
          photosensitivity_history: laserCheckPhotosens,
          recent_tanning: laserCheckTanning,
          recent_chemotherapy: laserCheckChemo,
        } : undefined,
        laser_aftercare: consentType === 'laser' ? {
          avoid_sun_2weeks: aftercareSun2Weeks,
          use_sunscreen_fps30: aftercareFps30,
          avoid_hot_showers_sauna: aftercareHotShowers,
          no_wax_tweezers_shave_only: aftercareNoWax,
          avoid_oil_fragrance_products: aftercareNoOilFragrance,
          use_cold_compress_if_irritated: aftercareColdCompress,
        } : undefined,
        lash_history: consentType === 'pestanas' ? {
          prior_extensions: { answer: priorLashes, details: priorLashesDetails },
          concerns_goals: lashGoals,
          eye_sensitivity_history: { answer: lashSensitivity, details: lashSensitivityDetails },
        } : undefined,
        lash_checklist: consentType === 'pestanas' ? {
          contact_lenses: lashContactLenses,
          oil_lotions_around_eyes: lashOilAroundEyes,
          eye_drops_usage: lashEyeDrops,
          current_allergies: lashAllergies,
          recurrent_eye_infections: lashRecurrentInfections,
          dry_eye_sjogren: lashDryEye,
          recent_chemotherapy: lashChemo,
        } : undefined,
        lash_aftercare: consentType === 'pestanas' ? {
          no_waterproof_mascara: lashNoWaterproof,
          no_oil_products_eyes: lashNoOil,
          no_water_24_48h: lashNoWater48h,
          no_tint_perm: lashNoTintPerm,
          no_rubbing_pulling: lashNoRubbing,
          care_with_eye_drops: lashCareEyeDrops,
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
          dietary_restrictions_affecting_healing: mbDietaryRestrictions,
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

      const titleMap = {
        laser: 'Depilación Láser — Formulario de Consulta & Consentimiento Informado',
        pestanas: 'Extensión de Pestañas — Formulario de Consulta & Consentimiento Informado',
        facial: 'Cuidado Facial y de la Piel — Formulario de Consulta & Consentimiento Informado',
        microblading: 'Microblading — Formulario de Consulta & Consentimiento Informado',
      };

      const legalMap = {
        laser: 'Entiendo que la depilación láser es semipermanente (reducción 70-90%). Acepto el uso obligatorio de gafas protectoras y los cuidados post-tratamiento (prohibición de cera/pinzas, FPS 30). Confirmo ser mayor de 18 años.',
        pestanas: 'Entiendo que las extensiones son semipermanentes y conllevan riesgos de irritación orbital. Acepto mantener los ojos cerrados durante todo el procedimiento y los cuidados posteriores (no aceites, no agua 24-48h, no frotar). Confirmo ser mayor de 18 años.',
        facial: 'He completado este formulario de manera precisa y veraz. Acepto la Política de Cancelaciones y autorizaciones seleccionadas.',
        microblading: 'He completado este formulario lo mejor que he podido y he sabido. Acepto informar al técnico de cualquier cambio en la información anterior. Acepto renunciar a toda responsabilidad ante mi técnico y el salón por cualquier lesión o daño incurrido debido a cualquier declaración errónea sobre mi salud. Confirmo ser mayor de 18 años.',
      };

      await api.createConsent({
        client_id: clientId || (client ? client.id : 'anonymous'),
        treatment_id: treatmentId || null,
        sub_treatment_id: subTreatmentId || null,
        title: titleMap[consentType],
        content_text: legalMap[consentType],
        client_dni: dni,
        client_full_name: fullName,
        signature_image_base64: signatureBase64,
        form_data: formData,
      });

      setSubmitted(true);
    } catch (err: any) {
      alert('Error al enviar el consentimiento: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    const typeLabel = consentType === 'laser' ? 'Depilación Láser' : consentType === 'pestanas' ? 'Extensión de Pestañas' : consentType === 'microblading' ? 'Microblading' : 'Cuidado Facial';
    return (
      <div className="min-h-screen bg-silk-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-soft-lg border border-rose-gold-200 space-y-5 animate-scale-up">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif font-bold text-2xl text-graphite-900">
              ¡Consentimiento Registrado!
            </h2>
            <p className="text-xs text-graphite-600 leading-relaxed">
              Muchas gracias, <b>{fullName}</b>. Tu formulario y firma para <b>{typeLabel}</b> han sido guardados con éxito en <b>Aura Suite</b>.
            </p>
          </div>
          <div className="p-4 bg-silk-100 rounded-2xl border border-rose-gold-200/80 text-xs text-graphite-700">
            ✨ Ya puedes regresar con tu profesional para dar inicio a tu sesión.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-silk-100/70 p-3 sm:p-6 pb-20 font-sans text-graphite-900">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Selector de Tipo (3 Opciones: Facial, Láser, Pestañas) */}
        <div className="bg-white p-2 rounded-2xl border border-rose-gold-200 flex flex-wrap gap-2 shadow-soft">
          <button
            type="button"
            onClick={() => setConsentType('facial')}
            className={`flex-1 min-w-[120px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              consentType === 'facial'
                ? 'bg-rose-gold-600 text-white shadow-sm'
                : 'text-graphite-600 hover:bg-silk-50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Facial & Piel</span>
          </button>
          <button
            type="button"
            onClick={() => setConsentType('laser')}
            className={`flex-1 min-w-[120px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              consentType === 'laser'
                ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-sm'
                : 'text-graphite-600 hover:bg-silk-50'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Depilación Láser</span>
          </button>
          <button
            type="button"
            onClick={() => setConsentType('pestanas')}
            className={`flex-1 min-w-[120px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              consentType === 'pestanas'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm'
                : 'text-graphite-600 hover:bg-silk-50'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Extensión de Pestañas</span>
          </button>
          <button
            type="button"
            onClick={() => setConsentType('microblading' as ConsentType)}
            className={`flex-1 min-w-[120px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              consentType === 'microblading'
                ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-lg scale-105'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            ✍️ Microblading
          </button>
        </div>

        {/* Header Banner */}
        <div className="bg-white rounded-3xl p-6 border border-rose-gold-200 shadow-soft text-center space-y-2">
          <span className="text-[11px] font-bold tracking-widest uppercase text-rose-gold-600">
            AURA SUITE • GESTIÓN CLÍNICA & ESTÉTICA
          </span>
          <h1 className="font-serif font-bold text-2xl text-graphite-900 tracking-tight">
            {consentType === 'laser'
              ? 'Depilación Láser'
              : consentType === 'pestanas'
              ? 'Extensión de Pestañas'
              : consentType === 'microblading'
              ? 'Microblading'
              : 'Cuidado Facial y de la Piel'}
          </h1>
          <h2 className="font-serif text-sm text-graphite-600 tracking-wide uppercase">
            Libro de Registro & Formulario de Consulta
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Datos Personales */}
          <div className="bg-white rounded-3xl p-6 border border-rose-gold-100 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-rose-gold-100 pb-3">
              <User className="w-4 h-4 text-rose-gold-600" />
              <h3 className="font-serif font-bold text-base text-graphite-900">
                1. Información del Cliente
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-graphite-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre y apellido"
                  className="w-full p-3 rounded-2xl border border-rose-gold-200 bg-silk-50/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-graphite-700 mb-1">DNI / Documento *</label>
                <input
                  type="text"
                  required
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  placeholder="Número de documento"
                  className="w-full p-3 rounded-2xl border border-rose-gold-200 bg-silk-50/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-graphite-700 mb-1">Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-rose-gold-200 bg-silk-50/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-graphite-700 mb-1">Género</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-rose-gold-200 bg-silk-50/50"
                >
                  <option value="Femenino">Femenino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Otro">Otro / Prefiero no decir</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-graphite-700 mb-1">Teléfono / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 9 11 ..."
                  className="w-full p-3 rounded-2xl border border-rose-gold-200 bg-silk-50/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-graphite-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@email.com"
                  className="w-full p-3 rounded-2xl border border-rose-gold-200 bg-silk-50/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-graphite-700 mb-1">Contacto y Teléfono de Emergencia</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="Nombre y teléfono de un allegado"
                  className="w-full p-3 rounded-2xl border border-rose-gold-200 bg-silk-50/50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-graphite-700 mb-1">¿Cómo se enteró de nosotros?</label>
                <input
                  type="text"
                  value={referralSource}
                  onChange={(e) => setReferralSource(e.target.value)}
                  placeholder="Instagram, recomendación, pasaba por el lugar..."
                  className="w-full p-3 rounded-2xl border border-rose-gold-200 bg-silk-50/50"
                />
              </div>
            </div>
          </div>

          {/* 2. Historial Médico y de Salud (Común a todos) */}
          <div className="bg-white rounded-3xl p-6 border border-rose-gold-100 shadow-soft space-y-5">
            <div className="flex items-center gap-2 border-b border-rose-gold-100 pb-3">
              <HeartPulse className="w-4 h-4 text-rose-gold-600" />
              <h3 className="font-serif font-bold text-base text-graphite-900">
                2. Historial Médico y de Salud
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              {[
                { q: '¿Tiene alguna condición médica preexistente o enfermedad crónica?', val: chronicCondition, set: setChronicCondition, det: chronicDetails, setDet: setChronicDetails, ph: 'Descríbala...' },
                { q: '¿Está tomando actualmente algún medicamento o suplemento?', val: medications, set: setMedications, det: medicationDetails, setDet: setMedicationDetails, ph: 'Describa medicamento o dosis...' },
                { q: '¿Ha tenido alguna cirugía o procedimiento médico recientemente?', val: recentSurgery, set: setRecentSurgery, det: surgeryDetails, setDet: setSurgeryDetails, ph: 'Describa el procedimiento...' },
                { q: '¿Ha tenido alguna reacción alérgica a medicamentos o sustancias en el pasado?', val: allergicReaction, set: setAllergicReaction, det: allergyDetails, setDet: setAllergyDetails, ph: 'Descríbala...' },
                { q: '¿Tiene usted alguna alergia o sensibilidad cutánea conocida?', val: skinAllergy, set: setSkinAllergy, det: skinAllergyDetails, setDet: setSkinAllergyDetails, ph: 'Describa cosméticos, látex, adhesivos...' },
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 bg-silk-50/60 rounded-2xl border border-rose-gold-100 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-graphite-800">{item.q}</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 cursor-pointer font-bold">
                        <input type="radio" checked={!item.val} onChange={() => item.set(false)} />
                        <span>No</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer font-bold text-rose-gold-700">
                        <input type="radio" checked={item.val} onChange={() => item.set(true)} />
                        <span>Sí</span>
                      </label>
                    </div>
                  </div>
                  {item.val && (
                    <input
                      type="text"
                      placeholder={item.ph}
                      value={item.det}
                      onChange={(e) => item.setDet(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-rose-gold-300 bg-white"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ======================= SECCIÓN EXTENSIÓN DE PESTAÑAS ======================= */}
          {consentType === 'pestanas' && (
            <>
              {/* 3. Historia de las Extensiones de Pestañas */}
              <div className="bg-white rounded-3xl p-6 border border-pink-200 shadow-soft space-y-4">
                <div className="flex items-center gap-2 border-b border-pink-100 pb-3">
                  <Eye className="w-4 h-4 text-pink-600" />
                  <h3 className="font-serif font-bold text-base text-graphite-900">
                    3. Historia de las Extensiones de Pestañas
                  </h3>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-3.5 bg-pink-50/40 rounded-2xl border border-pink-100 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-graphite-800">
                        ¿Ha recibido algún tratamiento o procedimiento previo de extensiones de pestañas?
                      </span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1 cursor-pointer font-bold">
                          <input type="radio" checked={!priorLashes} onChange={() => setPriorLashes(false)} />
                          <span>No</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer font-bold text-pink-700">
                          <input type="radio" checked={priorLashes} onChange={() => setPriorLashes(true)} />
                          <span>Sí</span>
                        </label>
                      </div>
                    </div>
                    {priorLashes && (
                      <input
                        type="text"
                        placeholder="Describa fecha de última colocación, técnica y experiencia..."
                        value={priorLashesDetails}
                        onChange={(e) => setPriorLashesDetails(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-pink-300 bg-white"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-graphite-700 mb-1">
                      ¿Qué preocupaciones u objetivos específicos tienes para tu sesión de pestañas?
                    </label>
                    <textarea
                      rows={2}
                      value={lashGoals}
                      onChange={(e) => setLashGoals(e.target.value)}
                      placeholder="ej. Efecto natural, volumen ruso, alargamiento, relleno..."
                      className="w-full p-3 rounded-2xl border border-pink-200 bg-pink-50/30"
                    />
                  </div>

                  <div className="p-3.5 bg-pink-50/40 rounded-2xl border border-pink-100 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-graphite-800">
                        ¿Tiene antecedentes de afecciones como sensibilidad ocular, alergias o infecciones?
                      </span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1 cursor-pointer font-bold">
                          <input type="radio" checked={!lashSensitivity} onChange={() => setLashSensitivity(false)} />
                          <span>No</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer font-bold text-pink-700">
                          <input type="radio" checked={lashSensitivity} onChange={() => setLashSensitivity(true)} />
                          <span>Sí</span>
                        </label>
                      </div>
                    </div>
                    {lashSensitivity && (
                      <input
                        type="text"
                        placeholder="Describa la reacción (escozor, hinchazón, etc.)..."
                        value={lashSensitivityDetails}
                        onChange={(e) => setLashSensitivityDetails(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-pink-300 bg-white"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* 4. REGISTRO DE DISEÑO DEL CLIENTE & GUÍA DE PESTAÑAS (Imágenes 1 y 5) */}
              <div className="bg-white rounded-3xl p-6 border border-pink-200 shadow-soft space-y-5">
                <div className="flex items-center gap-2 border-b border-pink-100 pb-3">
                  <Layers className="w-4 h-4 text-pink-600" />
                  <div>
                    <h3 className="font-serif font-bold text-base text-graphite-900">
                      4. Registro de Diseño & Mapping del Cliente
                    </h3>
                    <p className="text-[11px] text-graphite-500">
                      Configuración técnica de aplicación ocular (Ojo Izquierdo y Ojo Derecho)
                    </p>
                  </div>
                </div>

                {/* Esquema de Diseño Ocular (Left & Right Eye) */}
                <div className="p-4 bg-gradient-to-r from-pink-50/70 via-silk-50 to-pink-50/70 rounded-2xl border border-pink-200/80 space-y-4">
                  <span className="font-serif font-bold text-xs text-pink-950 block text-center uppercase tracking-wide">
                    👁️ Mapping Ocular Personalizado
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Ojo Izquierdo */}
                    <div className="p-3.5 bg-white rounded-2xl border border-pink-200 shadow-xs space-y-2 text-center">
                      <span className="font-bold text-xs text-graphite-800">Ojo Izquierdo</span>
                      <div className="h-16 border-b-2 border-pink-400 rounded-b-full flex items-end justify-around px-2 pb-1 relative">
                        {['8', '9', '10', '11', '12', '10'].map((val, idx) => (
                          <div key={idx} className="flex flex-col items-center">
                            <span className="text-[10px] font-mono font-bold text-pink-700">{val}</span>
                            <div className="w-0.5 h-6 bg-pink-300"></div>
                          </div>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={mappingLeftEye}
                        onChange={(e) => setMappingLeftEye(e.target.value)}
                        placeholder="ej. 8-9-10-11-12-10 mm"
                        className="w-full text-center text-xs p-2 rounded-xl border border-pink-200 bg-silk-50/50 font-mono font-semibold"
                      />
                    </div>

                    {/* Ojo Derecho */}
                    <div className="p-3.5 bg-white rounded-2xl border border-pink-200 shadow-xs space-y-2 text-center">
                      <span className="font-bold text-xs text-graphite-800">Ojo Derecho</span>
                      <div className="h-16 border-b-2 border-pink-400 rounded-b-full flex items-end justify-around px-2 pb-1 relative">
                        {['10', '12', '11', '10', '9', '8'].map((val, idx) => (
                          <div key={idx} className="flex flex-col items-center">
                            <span className="text-[10px] font-mono font-bold text-pink-700">{val}</span>
                            <div className="w-0.5 h-6 bg-pink-300"></div>
                          </div>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={mappingRightEye}
                        onChange={(e) => setMappingRightEye(e.target.value)}
                        placeholder="ej. 10-12-11-10-9-8 mm"
                        className="w-full text-center text-xs p-2 rounded-xl border border-pink-200 bg-silk-50/50 font-mono font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Parámetros de Diseño (Servicio, Solicitud, Material, Estilo) */}
                <div className="space-y-3.5 text-xs">
                  {/* Servicio */}
                  <div>
                    <label className="block font-bold text-graphite-800 mb-1">Servicio:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['Lleno (Full Set)', 'Llenar / Retoque', 'Eliminación', 'Otro'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setLashServiceType(s)}
                          className={`p-2 rounded-xl font-bold border transition-all text-[11px] ${
                            lashServiceType === s
                              ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                              : 'bg-silk-50 text-graphite-700 border-rose-gold-200 hover:bg-pink-50'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Solicitud / Efecto */}
                  <div>
                    <label className="block font-bold text-graphite-800 mb-1">Solicitud / Efecto:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['Clásico', 'Híbrido', 'Volumen', 'Mega volumen'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setLashRequestType(r)}
                          className={`p-2 rounded-xl font-bold border transition-all text-[11px] ${
                            lashRequestType === r
                              ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                              : 'bg-silk-50 text-graphite-700 border-rose-gold-200 hover:bg-pink-50'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Material */}
                  <div>
                    <label className="block font-bold text-graphite-800 mb-1">Tipo de Pestañas / Material:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['Sintético', 'Seda', 'Visón (Mink)', 'Otro'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setLashMaterial(m)}
                          className={`p-2 rounded-xl font-bold border transition-all text-[11px] ${
                            lashMaterial === m
                              ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                              : 'bg-silk-50 text-graphite-700 border-rose-gold-200 hover:bg-pink-50'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Estilo (Mapping) */}
                  <div>
                    <label className="block font-bold text-graphite-800 mb-1">Estilo de Extensión:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {(['Natural', 'Redondo', 'Muñeca/Linda', 'Gato/Zorro', 'Ardilla'] as const).map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setLashStyle(style)}
                          className={`p-2 rounded-xl font-bold border transition-all text-[11px] ${
                            lashStyle === style
                              ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                              : 'bg-silk-50 text-graphite-700 border-rose-gold-200 hover:bg-pink-50'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rizo / Curva */}
                  <div>
                    <label className="block font-bold text-graphite-800 mb-1">Tipo de Rizo (Curl):</label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-center">
                      {(['A(J)', 'B', 'C', 'D', 'U', 'L', 'L+'] as const).map((curl) => (
                        <button
                          key={curl}
                          type="button"
                          onClick={() => setLashCurl(curl)}
                          className={`p-2 rounded-xl font-bold border transition-all ${
                            lashCurl === curl
                              ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                              : 'bg-silk-50 text-graphite-700 border-rose-gold-200 hover:bg-pink-50'
                          }`}
                        >
                          {curl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Volumen / Fans */}
                  <div>
                    <label className="block font-bold text-graphite-800 mb-1">Volumen / Abanicos (Fans):</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-center">
                      {(['Clásica 1 a 1', '2D', '3D', '4D', '5D', '6D', '7D', '8D', '9D', '10D Mega Volume'] as const).map((vol) => (
                        <button
                          key={vol}
                          type="button"
                          onClick={() => setLashVolume(vol)}
                          className={`p-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                            lashVolume === vol
                              ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-600 shadow-xs'
                              : 'bg-silk-50 text-graphite-700 border-rose-gold-200 hover:bg-pink-50'
                          }`}
                        >
                          {vol}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grosor & Longitud */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-bold text-graphite-800 mb-1">Grosor de las pestañas:</label>
                      <select
                        value={lashThickness}
                        onChange={(e) => setLashThickness(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-rose-gold-200 bg-silk-50 font-semibold"
                      >
                        {['0.03 mm', '0.05 mm', '0.06 mm', '0.07 mm', '0.10 mm', '0.12 mm', '0.15 mm', '0.18 mm', '0.20 mm', '0.25 mm', '0.30 mm'].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-graphite-800 mb-1">Largo de las pestañas:</label>
                      <select
                        value={lashLength}
                        onChange={(e) => setLashLength(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-rose-gold-200 bg-silk-50 font-semibold"
                      >
                        {['4 mm', '5 mm', '6 mm', '7 mm', '8 mm', '9 mm', '10 mm', '11 mm', '12 mm', '13 mm', '14 mm', '15 mm', '22 mm'].map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Notas de la Lashista */}
                  <div>
                    <label className="block font-bold text-graphite-800 mb-1">Notas / Observaciones:</label>
                    <textarea
                      rows={2}
                      value={lashNotes}
                      onChange={(e) => setLashNotes(e.target.value)}
                      placeholder="Observaciones de curvatura natural, aislamiento, adhesivo utilizado..."
                      className="w-full p-3 rounded-2xl border border-pink-200 bg-pink-50/20"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Normas de Seguridad & Checklist Pestañas */}
              <div className="bg-white rounded-3xl p-6 border border-pink-200 shadow-soft space-y-4">
                <div className="flex items-center gap-2 border-b border-pink-100 pb-3">
                  <ShieldCheck className="w-4 h-4 text-pink-600" />
                  <h3 className="font-serif font-bold text-base text-graphite-900">
                    5. Normas de Seguridad & Notificación de Condiciones
                  </h3>
                </div>

                <div className="space-y-3 text-xs text-graphite-800">
                  <div className="p-3.5 bg-pink-50/50 rounded-2xl border border-pink-200 leading-relaxed space-y-2">
                    <p className="font-bold text-pink-950">
                      Entiendo los riesgos inherentes y acepto las siguientes afirmaciones:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-graphite-700">
                      <li>Un juego completo puede mejorar la apariencia haciéndolas un 30-50% más gruesas y 20-50% más largas.</li>
                      <li>Existe riesgo de irritación orbital. Si el adhesivo entra en contacto con el ojo, se enjuagará y se buscará atención médica.</li>
                      <li><b>MANTENER OJOS CERRADOS:</b> Acepto mantener los ojos cerrados durante toda la duración del procedimiento.</li>
                      <li>Es un procedimiento semipermanente que requiere retoques periódicos para reponer pestañas naturales caídas.</li>
                    </ul>
                  </div>

                  {/* Checklist de notificación */}
                  <div className="p-4 bg-silk-50 rounded-2xl border border-rose-gold-200 space-y-2">
                    <span className="font-bold text-graphite-900 block text-xs">
                      Notifico al profesional de pestañas marcando si presento alguna condición:
                    </span>
                    <div className="space-y-1.5 text-[11px]">
                      {[
                        { label: 'Uso de lentes de contacto (podrían pedirme retirarlos)', val: lashContactLenses, set: setLashContactLenses },
                        { label: 'Uso de protector solar o humectantes con aceite alrededor de los ojos', val: lashOilAroundEyes, set: setLashOilAroundEyes },
                        { label: 'Uso de gotas oftálmicas recetadas o de venta libre', val: lashEyeDrops, set: setLashEyeDrops },
                        { label: 'Alergias o sensibilidades oculares actuales', val: lashAllergies, set: setLashAllergies },
                        { label: 'Antecedentes de infecciones recurrentes del ojo o conducto lagrimal', val: lashRecurrentInfections, set: setLashRecurrentInfections },
                        { label: 'Antecedentes de ojo seco o síndrome de Sjögren', val: lashDryEye, set: setLashDryEye },
                        { label: 'Historia reciente de quimioterapia', val: lashChemo, set: setLashChemo },
                      ].map((chk, i) => (
                        <label key={i} className="flex items-center gap-2 cursor-pointer text-graphite-800">
                          <input
                            type="checkbox"
                            checked={chk.val}
                            onChange={(e) => chk.set(e.target.checked)}
                            className="w-3.5 h-3.5 rounded text-pink-600 focus:ring-pink-400"
                          />
                          <span>{chk.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Instrucciones Post-Pestañas */}
                  <div className="p-4 bg-pink-50/70 rounded-2xl border border-pink-200 space-y-2">
                    <span className="font-bold text-pink-950 block text-xs">
                      Acepto las siguientes instrucciones de mantenimiento post-pestañas:
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-pink-900">
                      <li>NO usar máscara resistente al agua (waterproof).</li>
                      <li>NO utilizar productos a base de aceite en el área de los ojos.</li>
                      <li>NO dejar que el agua toque los ojos durante 24 a 48 horas después de la aplicación.</li>
                      <li>NO realizar tintes ni permanentes sobre las extensiones.</li>
                      <li>NO tirar ni frotar las extensiones de pestañas.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ======================= SECCIÓN DEPILACIÓN LÁSER ======================= */}
          {consentType === 'laser' && (
            <>
              {/* 3. Historia de la Depilación Láser */}
              <div className="bg-white rounded-3xl p-6 border border-purple-200 shadow-soft space-y-4">
                <div className="flex items-center gap-2 border-b border-purple-100 pb-3">
                  <Zap className="w-4 h-4 text-purple-600" />
                  <h3 className="font-serif font-bold text-base text-graphite-900">
                    3. Historia de la Depilación Láser
                  </h3>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-3.5 bg-purple-50/40 rounded-2xl border border-purple-100 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-graphite-800">
                        ¿Ha recibido algún tratamiento previo de depilación láser?
                      </span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1 cursor-pointer font-bold">
                          <input type="radio" checked={!priorLaser} onChange={() => setPriorLaser(false)} />
                          <span>No</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer font-bold text-purple-700">
                          <input type="radio" checked={priorLaser} onChange={() => setPriorLaser(true)} />
                          <span>Sí</span>
                        </label>
                      </div>
                    </div>
                    {priorLaser && (
                      <input
                        type="text"
                        placeholder="Descríbalo (zonas, tipo de láser, número de sesiones)..."
                        value={priorLaserDetails}
                        onChange={(e) => setPriorLaserDetails(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-purple-300 bg-white"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-graphite-700 mb-1">
                      ¿Qué preocupaciones u objetivos específicos tienes para tu sesión?
                    </label>
                    <textarea
                      rows={2}
                      value={laserGoals}
                      onChange={(e) => setLaserGoals(e.target.value)}
                      placeholder="Zonas prioritarias, reducción de foliculitis..."
                      className="w-full p-3 rounded-2xl border border-purple-200 bg-purple-50/30"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Historia de la Piel Láser */}
              <div className="bg-white rounded-3xl p-6 border border-purple-200 shadow-soft space-y-4">
                <div className="flex items-center gap-2 border-b border-purple-100 pb-3">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <h3 className="font-serif font-bold text-base text-graphite-900">
                    4. Historia de la Piel & Fotosensibilidad
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  {[
                    { label: '¿Ha utilizado Accutane o inmunosupresores en los últimos 6 meses?', val: accutane6Months, set: setAccutane6Months },
                    { label: '¿Algún producto con Retin-A, Retinol, AHA o ácido en los últimos 7 días?', val: retinA7Days, set: setRetinA7Days },
                    { label: '¿Medicamentos o productos que produzcan fotosensibilidad?', val: photosensitizingMeds, set: setPhotosensitizingMeds },
                    { label: '¿Exposición solar diaria o quemadura solar activa?', val: dailySunExposure, set: setDailySunExposure },
                    { label: '¿Cama solar, loción bronceadora o peelings recientes?', val: tanningBedLotion, set: setTanningBedLotion },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 bg-silk-50/50 rounded-2xl border border-rose-gold-100 flex items-center justify-between gap-3">
                      <span className="font-medium text-graphite-800">{item.label}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <label className="flex items-center gap-1 cursor-pointer font-bold">
                          <input type="radio" checked={!item.val} onChange={() => item.set(false)} />
                          <span>No</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer font-bold text-purple-700">
                          <input type="radio" checked={item.val} onChange={() => item.set(true)} />
                          <span>Sí</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ======================= SECCIÓN FACIAL ======================= */}
          {consentType === 'facial' && (
            <>
              <div className="bg-white rounded-3xl p-6 border border-rose-gold-100 shadow-soft space-y-4">
                <div className="flex items-center gap-2 border-b border-rose-gold-100 pb-3">
                  <Sparkles className="w-4 h-4 text-rose-gold-600" />
                  <h3 className="font-serif font-bold text-base text-graphite-900">
                    3. Historia del Cuidado Facial y de la Piel
                  </h3>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-3.5 bg-silk-50/60 rounded-2xl border border-rose-gold-100 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-graphite-800">
                        ¿Ha recibido algún tratamiento previo para el rostro o piel?
                      </span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1 cursor-pointer font-bold">
                          <input type="radio" checked={!priorTreatments} onChange={() => setPriorTreatments(false)} />
                          <span>No</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer font-bold text-rose-gold-700">
                          <input type="radio" checked={priorTreatments} onChange={() => setPriorTreatments(true)} />
                          <span>Sí</span>
                        </label>
                      </div>
                    </div>
                    {priorTreatments && (
                      <input
                        type="text"
                        placeholder="Descríbalo (ej. Peeling, Dermapen...)"
                        value={priorTreatmentsDetails}
                        onChange={(e) => setPriorTreatmentsDetails(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-rose-gold-300 bg-white"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-graphite-700 mb-1">
                      ¿Qué preocupaciones u objetivos específicos tienes para tu tratamiento?
                    </label>
                    <textarea
                      rows={2}
                      value={concernsGoals}
                      onChange={(e) => setConcernsGoals(e.target.value)}
                      placeholder="ej. Hidratación, manchas, luminosidad, acné..."
                      className="w-full p-3 rounded-2xl border border-rose-gold-200 bg-silk-50/50"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          {/* ======================= SECCIÓN MICROBLADING ======================= */}
          {consentType === 'microblading' && (
            <>
              {/* Historia del Microblading */}
              <div className="bg-white rounded-3xl p-6 border border-amber-200 shadow-soft space-y-4">
                <div className="flex items-center gap-2 border-b border-amber-100 pb-3">
                  <Pencil className="w-4 h-4 text-amber-600" />
                  <h3 className="font-serif font-bold text-base text-graphite-900">
                    3. Historia del Microblading
                  </h3>
                </div>
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-100 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-graphite-800">
                        ¿Ha recibido algún tratamiento o procedimiento previo relacionado con el microblading o el maquillaje permanente?
                      </span>
                      <div className="flex items-center gap-3 shrink-0">
                        <label className="flex items-center gap-1 cursor-pointer font-bold">
                          <input type="radio" checked={!priorMicroblading} onChange={() => setPriorMicroblading(false)} />
                          <span>No</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer font-bold text-amber-700">
                          <input type="radio" checked={priorMicroblading} onChange={() => setPriorMicroblading(true)} />
                          <span>Sí</span>
                        </label>
                      </div>
                    </div>
                    {priorMicroblading && (
                      <input
                        type="text"
                        placeholder="Descríbalo..."
                        value={priorMicrobladingDetails}
                        onChange={(e) => setPriorMicrobladingDetails(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-amber-300 bg-white"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold text-graphite-700 mb-1">
                      ¿Qué preocupaciones u objetivos específicos tienes para tu tratamiento de microblading?
                    </label>
                    <textarea
                      rows={2}
                      value={microbladingGoals}
                      onChange={(e) => setMicrobladingGoals(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-amber-200 bg-amber-50/30"
                    />
                  </div>
                  <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-100 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-graphite-800">
                        ¿Tiene antecedentes de afecciones cutáneas, como eczema, psoriasis o queloides, o alguna sensibilidad en la zona de las cejas?
                      </span>
                      <div className="flex items-center gap-3 shrink-0">
                        <label className="flex items-center gap-1 cursor-pointer font-bold">
                          <input type="radio" checked={!skinConditionsBrows} onChange={() => setSkinConditionsBrows(false)} />
                          <span>No</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer font-bold text-amber-700">
                          <input type="radio" checked={skinConditionsBrows} onChange={() => setSkinConditionsBrows(true)} />
                          <span>Sí</span>
                        </label>
                      </div>
                    </div>
                    {skinConditionsBrows && (
                      <input
                        type="text"
                        placeholder="Descríbalo..."
                        value={skinConditionsBrowsDetails}
                        onChange={(e) => setSkinConditionsBrowsDetails(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-amber-300 bg-white"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Consideraciones sobre el Tratamiento */}
              <div className="bg-white rounded-3xl p-6 border border-amber-200 shadow-soft space-y-4">
                <div className="flex items-center gap-2 border-b border-amber-100 pb-3">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <h3 className="font-serif font-bold text-base text-graphite-900">
                    4. Consideraciones sobre el Tratamiento
                  </h3>
                </div>
                <div className="space-y-3 text-xs">
                  {[
                    { label: '¿Es usted fumador o está expuesto regularmente al humo de segunda mano?', val: mbSmoker, set: setMbSmoker },
                    { label: '¿Expones frecuentemente tu rostro al sol? ¿Usas protector solar en las cejas o en el rostro?', val: mbSunExposure, set: setMbSunExposure },
                    { label: '¿Realiza usted actividades que puedan provocar sudoración excesiva o roce en el área de las cejas?', val: mbSweating, set: setMbSweating },
                    { label: '¿Está siguiendo alguna restricción dietética específica o tomando medicamentos que podrían afectar el proceso de curación de su piel?', val: mbDietaryRestrictions, set: setMbDietaryRestrictions },
                    { label: '¿Conoce los cuidados posteriores al tratamiento de microblading necesarios para mantener los resultados?', val: mbKnowsAftercare, set: setMbKnowsAftercare },
                    { label: '¿Tiene algún evento u ocasión próxima que pueda interferir con el proceso de curación o el cuidado posterior al tratamiento?', val: mbUpcomingEvent, set: setMbUpcomingEvent },
                    { label: '¿Está dispuesto a seguir las instrucciones de cuidado posterior al tratamiento proporcionadas?', val: mbWillingFollowAftercare, set: setMbWillingFollowAftercare },
                    { label: '¿Se ha sometido recientemente a una exfoliación, peeling u otro tratamiento para la piel en el área de las cejas?', val: mbRecentPeeling, set: setMbRecentPeeling },
                    { label: '¿Estás embarazada o amamantando?', val: mbPregnant, set: setMbPregnant },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 bg-silk-50/50 rounded-2xl border border-amber-100 flex items-center justify-between gap-3">
                      <span className="font-medium text-graphite-800">{item.label}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <label className="flex items-center gap-1 cursor-pointer font-bold">
                          <input type="radio" checked={!item.val} onChange={() => item.set(false)} />
                          <span>No</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer font-bold text-amber-700">
                          <input type="radio" checked={item.val} onChange={() => item.set(true)} />
                          <span>Sí</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consentimiento del Cliente */}
              <div className="bg-white rounded-3xl p-6 border border-amber-200 shadow-soft space-y-4">
                <div className="flex items-center gap-2 border-b border-amber-100 pb-3">
                  <FileCheck2 className="w-4 h-4 text-amber-600" />
                  <h3 className="font-serif font-bold text-base text-graphite-900">
                    5. Consentimiento del Cliente
                  </h3>
                </div>
                <div className="space-y-3 text-xs">
                  <p className="text-graphite-700 font-medium mb-4">
                    Por favor, lea cada punto cuidadosamente y marque para indicar su comprensión y acuerdo.
                  </p>
                  {[
                    { label: 'Acepto que me realicen el microblading de cejas naturales. Al firmar este acuerdo, doy mi consentimiento para que mi técnico me realice el procedimiento.', val: mbAcceptProcedure, set: setMbAcceptProcedure },
                    { label: 'Entiendo que puedo tener una reacción alérgica al pigmento o a la crema anestésica utilizada y acepto el riesgo.', val: mbAllergyRisk, set: setMbAllergyRisk },
                    { label: 'Entiendo que siempre es posible que se produzca una infección como resultado del procedimiento, especialmente si no cuido adecuadamente el área después.', val: mbInfectionRisk, set: setMbInfectionRisk },
                    { label: 'Acepto que si experimento alguna condición médica en mis cejas, me comunicaré con mi técnico y consultaré con un médico a mi propio costo.', val: mbConsultDoctor, set: setMbConsultDoctor },
                    { label: 'Soy consciente de que puede haber variaciones de color entre el color seleccionado y la apariencia final después de que mis cejas hayan sanado.', val: mbColorVariation, set: setMbColorVariation },
                    { label: 'Entiendo que el área del procedimiento estará oscura durante aproximadamente los primeros 6 días y se aclarará posteriormente.', val: mbDark6Days, set: setMbDark6Days },
                    { label: 'El resultado final no se suele conseguir sin volver a una visita de retoque. Esto suele hacerse al menos 4 semanas después de la visita inicial.', val: mbTouchUpNeeded, set: setMbTouchUpNeeded },
                    { label: 'La apariencia final de la ceja se logrará entre 6 y 8 semanas después de las visitas finales.', val: mbFinalLook6_8Weeks, set: setMbFinalLook6_8Weeks },
                    { label: 'Microblading dará como resultado un cambio semipermanente en mi apariencia (generalmente dura entre 6 meses y 1 año).', val: mbSemipermanent, set: setMbSemipermanent },
                    { label: 'Los tratamientos de la piel como depilación láser, cirugía plástica u otros procedimientos pueden provocar cambios adversos en la zona.', val: mbSkinTreatmentsAffect, set: setMbSkinTreatmentsAffect },
                    { label: 'Actualmente no estoy bajo la influencia del alcohol o drogas recreativas.', val: mbNotUnderInfluence, set: setMbNotUnderInfluence },
                    { label: 'No tengo ningún tipo de sarpullido ni infección en ninguna parte del cuerpo.', val: mbNoRashInfection, set: setMbNoRashInfection },
                    { label: 'He recibido/recibiré instrucciones de cuidados posteriores y acepto seguirlas.', val: mbAcceptAftercare, set: setMbAcceptAftercare },
                    { label: 'Entiendo y acepto la responsabilidad de determinar el color, la forma y la posición del procedimiento según lo acordado durante la consulta.', val: mbAcceptColorShape, set: setMbAcceptColorShape },
                    { label: 'Doy mi consentimiento para tomar fotografías de \'antes y después\' con fines de documentación y promocionales.', val: mbConsentPhotos, set: setMbConsentPhotos },
                  ].map((chk, i) => (
                    <label key={i} className="flex items-start gap-3 p-3 bg-amber-50/40 rounded-xl border border-amber-100 cursor-pointer text-graphite-800">
                      <input
                        type="checkbox"
                        checked={chk.val}
                        onChange={(e) => chk.set(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-400 shrink-0"
                      />
                      <span className="leading-relaxed">{chk.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Guía de Cejas */}
              <div className="bg-white rounded-3xl p-6 border border-amber-200 shadow-soft space-y-4">
                <div className="flex items-center gap-2 border-b border-amber-100 pb-3">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <h3 className="font-serif font-bold text-base text-graphite-900">
                    6. Guía de Cejas
                  </h3>
                </div>
                
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-graphite-800 mb-2">Forma de la Ceja</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'Arqueado', icon: '〰️' },
                        { id: 'Redondeado', icon: '⌒' },
                        { id: 'En forma de S', icon: '~' },
                        { id: 'Derecho', icon: '—' },
                        { id: 'Arco empinado', icon: '∧' },
                        { id: 'Hacia arriba', icon: '↗' },
                      ].map(shape => (
                        <button
                          key={shape.id}
                          type="button"
                          onClick={() => setMbBrowShape(shape.id as any)}
                          className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all ${
                            mbBrowShape === shape.id
                              ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold shadow-sm'
                              : 'bg-silk-50 border-rose-gold-100 text-graphite-600 hover:bg-amber-50'
                          }`}
                        >
                          <span className="text-xl">{shape.icon}</span>
                          <span className="text-[10px] text-center">{shape.id}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-graphite-800 mb-1">Color de Pigmento</label>
                    <input
                      type="text"
                      value={mbPigmentColor}
                      onChange={(e) => setMbPigmentColor(e.target.value)}
                      placeholder="Ej. Castaño claro, marrón oscuro..."
                      className="w-full p-3 rounded-2xl border border-amber-200 bg-amber-50/30"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-graphite-800 mb-1">Notas Adicionales (Diseño)</label>
                    <textarea
                      rows={2}
                      value={mbDesignNotes}
                      onChange={(e) => setMbDesignNotes(e.target.value)}
                      placeholder="Ej. Mantener grosor natural, rellenar cola..."
                      className="w-full p-3 rounded-2xl border border-amber-200 bg-amber-50/30"
                    />
                  </div>
                </div>
              </div>

              {/* 7. Registro de Tratamiento (Imagen 6 - Para completar por la profesional) */}
              <div className="bg-white rounded-3xl p-6 border border-amber-200 shadow-soft space-y-4">
                <div className="flex items-center gap-2 border-b border-amber-100 pb-3">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <div>
                    <h3 className="font-serif font-bold text-base text-graphite-900">
                      7. Registro de Tratamiento
                    </h3>
                    <p className="text-[11px] text-graphite-500">
                      Elementos utilizados durante el procedimiento (completar por la profesional)
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-graphite-800 mb-1">Pigmentos</label>
                      <input
                        type="text"
                        value={mbPigmentsUsed}
                        onChange={(e) => setMbPigmentsUsed(e.target.value)}
                        placeholder="Marca, tono..."
                        className="w-full p-2.5 rounded-xl border border-amber-200 bg-amber-50/30"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-graphite-800 mb-1">Anestesia</label>
                      <input
                        type="text"
                        value={mbAnesthesiaUsed}
                        onChange={(e) => setMbAnesthesiaUsed(e.target.value)}
                        placeholder="Tipo de anestesia..."
                        className="w-full p-2.5 rounded-xl border border-amber-200 bg-amber-50/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-graphite-800 mb-1">Cuchillas</label>
                      <input
                        type="text"
                        value={mbBladesUsed}
                        onChange={(e) => setMbBladesUsed(e.target.value)}
                        placeholder="Tipo y número..."
                        className="w-full p-2.5 rounded-xl border border-amber-200 bg-amber-50/30"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-graphite-800 mb-1">Nivel de Dolor (1-10)</label>
                      <select
                        value={mbPainLevel}
                        onChange={(e) => setMbPainLevel(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-amber-200 bg-amber-50/30"
                      >
                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                          <option key={n} value={String(n)}>{n} {n <= 3 ? '— Leve' : n <= 6 ? '— Moderado' : '— Intenso'}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-graphite-800 mb-1">Reacciones</label>
                    <input
                      type="text"
                      value={mbReactions}
                      onChange={(e) => setMbReactions(e.target.value)}
                      placeholder="Ninguna, enrojecimiento leve, sangrado mínimo..."
                      className="w-full p-2.5 rounded-xl border border-amber-200 bg-amber-50/30"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-graphite-800 mb-1">Notas de Tratamiento</label>
                    <textarea
                      rows={3}
                      value={mbTreatmentNotes}
                      onChange={(e) => setMbTreatmentNotes(e.target.value)}
                      placeholder="Observaciones generales, técnica aplicada, zonas trabajadas..."
                      className="w-full p-3 rounded-2xl border border-amber-200 bg-amber-50/30"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Autorización de Fotos y Videos (Para todos) */}
          <div className="bg-white rounded-3xl p-6 border border-rose-gold-200 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-rose-gold-100 pb-3">
              <Camera className="w-4 h-4 text-rose-gold-600" />
              <h3 className="font-serif font-bold text-base text-graphite-900">
                Autorización de Fotografías & Redes Sociales
              </h3>
            </div>

            <div className="p-4 bg-rose-gold-50/50 rounded-2xl border border-rose-gold-200 text-xs text-graphite-700 leading-relaxed space-y-2">
              <p>
                Le solicitamos amablemente su permiso para utilizar estas fotografías con fines publicitarios en portafolios y anuncios en línea.
              </p>
              <p className="font-semibold text-rose-gold-900">
                ¡Además, nos encanta etiquetar a nuestros clientes en las fotos compartidas en nuestro perfil de Instagram!
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-silk-50/70 rounded-2xl border border-rose-gold-100 space-y-2">
                <span className="font-bold text-graphite-900 block">Uso de fotos/videos de antes y después:</span>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-emerald-800">
                    <input type="radio" name="allow_photos" checked={allowPhotosVideos} onChange={() => setAllowPhotosVideos(true)} />
                    <span>Sí, siéntete libre de usarlos.</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-rose-800">
                    <input type="radio" name="allow_photos" checked={!allowPhotosVideos} onChange={() => setAllowPhotosVideos(false)} />
                    <span>No, por favor no los utilices.</span>
                  </label>
                </div>
              </div>

              <div className="p-3.5 bg-silk-50/70 rounded-2xl border border-rose-gold-100 space-y-2">
                <span className="font-bold text-graphite-900 block">Etiquetado en Instagram:</span>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-emerald-800">
                    <input type="radio" name="allow_tag" checked={allowInstagramTag} onChange={() => setAllowInstagramTag(true)} />
                    <span>Sí, por favor etiquétame en Instagram.</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-rose-800">
                    <input type="radio" name="allow_tag" checked={!allowInstagramTag} onChange={() => setAllowInstagramTag(false)} />
                    <span>No, por favor no me etiquetes.</span>
                  </label>
                </div>
                {allowInstagramTag && (
                  <div className="pt-2 flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-rose-gold-600" />
                    <input
                      type="text"
                      placeholder="Tu usuario de Instagram (@tucuenta)"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value)}
                      className="flex-1 p-2 rounded-xl border border-rose-gold-200 bg-white text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Política de Citas & Cancelación */}
          <div className="bg-white rounded-3xl p-6 border border-rose-gold-200 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-rose-gold-100 pb-3">
              <Clock className="w-4 h-4 text-rose-gold-600" />
              <h3 className="font-serif font-bold text-base text-graphite-900">
                Política de Citas & Cancelación
              </h3>
            </div>

            <div className="p-4 bg-silk-50 rounded-2xl border border-rose-gold-200 text-xs text-graphite-700 leading-relaxed space-y-2">
              <ul className="list-disc pl-4 space-y-1 text-graphite-800">
                <li><b>Depósito / Seña:</b> Requerido al reservar, imputable al tratamiento.</li>
                <li><b>Aviso previo de 24 horas:</b> Obligatorio para reprogramar y conservar el depósito.</li>
                <li><b>Tolerancia de 15 minutos:</b> Llegadas posteriores se considerarán inasistencia.</li>
              </ul>
            </div>

            <label className="flex items-center gap-2.5 p-3.5 bg-rose-gold-50/70 rounded-2xl border border-rose-gold-200 cursor-pointer font-bold text-xs text-graphite-900">
              <input
                type="checkbox"
                required
                checked={acceptCancellationPolicy}
                onChange={(e) => setAcceptCancellationPolicy(e.target.checked)}
                className="w-4 h-4 rounded text-rose-gold-600 focus:ring-rose-gold-400"
              />
              <span>
                He leído y comprendido completamente la Política de Cancelación y acepto sus términos. *
              </span>
            </label>
          </div>

          {/* Declaración Legal & Firma Digital con el Dedo */}
          <div className="bg-white rounded-3xl p-6 border border-rose-gold-200 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-rose-gold-100 pb-3">
              <FileCheck2 className="w-4 h-4 text-rose-gold-600" />
              <h3 className="font-serif font-bold text-base text-graphite-900">
                Declaración de Conformidad & Firma Digital
              </h3>
            </div>

            <div className="p-4 bg-rose-gold-50/50 rounded-2xl border border-rose-gold-200 text-xs text-graphite-700 leading-relaxed">
              <p className="font-serif font-bold text-graphite-900 mb-1">
                Al firmar a continuación, usted acepta lo siguiente:
              </p>
              <p>
                He completado este formulario de manera precisa y veraz. Confirmo que soy mayor de 18 años, he recibido todas las aclaraciones sobre el procedimiento y firmo libremente de conformidad.
              </p>
            </div>

            {/* Recuadro de Firma Digital */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-serif font-bold text-xs text-graphite-800">
                  ✍️ Realiza tu firma con el dedo en el recuadro abajo:
                </label>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="flex items-center gap-1 text-[11px] font-semibold text-rose-gold-700 hover:text-rose-gold-900 px-2.5 py-1 rounded-xl bg-rose-gold-100/70"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Borrar y repetir</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-rose-gold-300 rounded-3xl overflow-hidden bg-white shadow-inner touch-none relative h-48 sm:h-56">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-full cursor-crosshair block"
                />
                {!hasSignature && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-graphite-400 text-xs font-medium">
                    Dibuja tu firma aquí con el dedo o lápiz táctil
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-gold-500 via-rose-gold-600 to-rose-gold-700 hover:from-rose-gold-600 hover:to-rose-gold-800 text-white font-serif font-bold text-base shadow-soft-lg flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <Send className="w-5 h-5" />
                <span>{saving ? 'Enviando y guardando...' : 'Firmar y Enviar Consentimiento'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
