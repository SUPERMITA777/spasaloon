import React from 'react';
import {
  BookOpen,
  Calendar,
  Users,
  Activity,
  QrCode,
  DollarSign,
  Package,
  Share2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const UserGuideView: React.FC = () => {
  const sections = [
    {
      icon: <Calendar className="w-5 h-5 text-rose-gold-600" />,
      title: '1. Agenda Inteligente & Boxes',
      desc: 'Visualiza tus citas en formato cuadrícula estilo Google Calendar. Cada columna representa un Box/Sala de tu centro o un Profesional. Puedes mover citas entre horarios y boxes arrastrándolas con el ratón. Al hacer clic en un turno verás el cliente, seña, saldo restante y su carrito de consumos.',
    },
    {
      icon: <QrCode className="w-5 h-5 text-sage-600" />,
      title: '2. Acceso Móvil por QR para Profesionales (100% Offline)',
      desc: 'Cada profesional cuenta con un código QR único. Al escanearlo con la cámara de su celular conectado al Wi-Fi del centro, ingresa a su agenda del día, consulta sus pacientes asignados y puede agregar productos y tratamientos extra al carrito de la cita directamente desde su teléfono sin necesidad de internet.',
    },
    {
      icon: <Activity className="w-5 h-5 text-mauve-600" />,
      title: '3. Ficha Corporal & Cosmetológica Facial',
      desc: 'El módulo diferencial del software: silueta anatómica interactiva (frente y dorso) para marcar adiposidad, celulitis, flacidez o estrías; registro de medidas de contornos (cintura, cadera, abdomen) con comparador evolutivo sesión a sesión, diagnóstico de biotipo cutáneo y consentimientos con firma digital.',
    },
    {
      icon: <Package className="w-5 h-5 text-amber-600" />,
      title: '4. Control de Insumos & Stock',
      desc: 'Diferenciación entre productos vendibles al público e insumos internos de uso en cabina. Los insumos se descuentan automáticamente al finalizar las sesiones y el sistema emite alertas visuales cuando el stock desciende del umbral mínimo configurado.',
    },
    {
      icon: <DollarSign className="w-5 h-5 text-emerald-600" />,
      title: '5. Caja, Facturación & Comisiones',
      desc: 'Apertura y cierre de turnos con arqueo de caja automático, desglose de cobros por medio de pago (efectivo, transferencias, MercadoPago, tarjetas), registro de gastos y cálculo instantáneo de comisiones devengadas por profesional.',
    },
    {
      icon: <Share2 className="w-5 h-5 text-sky-600" />,
      title: '6. Marketing & Redes Sociales',
      desc: 'Banco de recursos promocionales clasificados por tratamiento con fotos, videos y copys persuasivos con hashtags listos para copiar con 1 clic y publicar en estados de WhatsApp, historias de Instagram o publicaciones programadas.',
    },
  ];

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-silk-100/60">
      {/* Header */}
      <div>
        <h1 className="font-serif font-bold text-2xl text-graphite-900 leading-tight">
          Guía de Uso & Manual Rápido
        </h1>
        <p className="text-xs text-graphite-500 mt-0.5">
          Aprende a aprovechar al máximo todas las funciones de Estética Pro en tu consultorio
        </p>
      </div>

      {/* Hero Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-gold-600 via-rose-gold-500 to-rose-blush-500 text-white shadow-soft space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <h2 className="font-serif font-bold text-lg">
            Bienvenido a Hikari Suite Gestión
          </h2>
        </div>
        <p className="text-xs text-rose-50/90 leading-relaxed max-w-2xl">
          Este software fue diseñado para operar de forma <b>100% local y segura</b> en centros de salud, estética, consultorios, barberías, spas y salones, protegiendo los datos de tus clientes y facilitando el trabajo de tu equipo.
        </p>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sections.map((sec, i) => (
          <div
            key={i}
            className="bg-white rounded-3xl p-6 border border-rose-gold-100 shadow-soft space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-silk-100 border border-rose-gold-100">
                {sec.icon}
              </div>
              <h3 className="font-serif font-bold text-base text-graphite-900">
                {sec.title}
              </h3>
            </div>
            <p className="text-xs text-graphite-600 leading-relaxed">
              {sec.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
