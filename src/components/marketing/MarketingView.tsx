import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { MarketingMedia, MarketingPost } from '../../types';
import {
  Share2,
  Sparkles,
  Plus,
  Image,
  Video,
  Copy,
  Check,
  Send,
  Calendar,
  Clock,
  Instagram,
  Smartphone,
  Layers,
  ExternalLink,
} from 'lucide-react';

export const MarketingView: React.FC = () => {
  const { treatments, addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'media' | 'scheduler'>('media');
  const [mediaList, setMediaList] = useState<MarketingMedia[]>([]);
  const [postsList, setPostsList] = useState<MarketingPost[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form New Media
  const [isNewMediaOpen, setIsNewMediaOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [fileUrl, setFileUrl] = useState('');
  const [captionTemplate, setCaptionTemplate] = useState('');
  const [hashtagsStr, setHashtagsStr] = useState('#EsteticaPro, #PielRadiante, #GlowSkin');
  const [selectedTreatmentId, setSelectedTreatmentId] = useState('');
  const [loading, setLoading] = useState(false);

  // Form Schedule Post
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postCaption, setPostCaption] = useState('');
  const [scheduledFor, setScheduledFor] = useState(new Date().toISOString().slice(0, 16));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [m, p] = await Promise.all([
        api.getMarketingMedia(),
        api.getMarketingPosts(),
      ]);
      setMediaList(m);
      setPostsList(p);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyCaption = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addToast({ type: 'success', title: 'Copy & Hashtags copiados al portapapeles' });
  };

  const handleCreateMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.createMarketingMedia({
        title,
        media_type: mediaType,
        file_url: fileUrl,
        thumbnail_url: fileUrl,
        caption_template: captionTemplate,
        hashtags: hashtagsStr.split(',').map((s) => s.trim()).filter(Boolean),
        treatment_id: selectedTreatmentId || null,
      });

      await loadData();
      addToast({ type: 'success', title: 'Recurso de marketing guardado' });
      setIsNewMediaOpen(false);
      setTitle('');
      setFileUrl('');
      setCaptionTemplate('');
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al guardar recurso', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedulePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.createMarketingPost({
        title: postTitle,
        caption: postCaption,
        target_channels: ['instagram', 'whatsapp_status'],
        scheduled_for: new Date(scheduledFor).toISOString(),
      });

      await loadData();
      addToast({ type: 'success', title: 'Publicación programada exitosamente' });
      setIsScheduleOpen(false);
      setPostTitle('');
      setPostCaption('');
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al programar', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePublishNow = async (id: string) => {
    try {
      await api.publishMarketingPost(id);
      await loadData();
      addToast({ type: 'success', title: 'Publicación marcada como publicada' });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al publicar', message: error.message });
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-silk-100/60">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-graphite-900 leading-tight">
            Marketing & Redes Sociales
          </h1>
          <p className="text-xs text-graphite-500 mt-0.5">
            Banco de piezas promocionales por tratamiento, copys para reels/historias y programador de publicaciones
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsScheduleOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-gold-100 hover:bg-rose-gold-200 text-rose-gold-800 text-xs font-semibold border border-rose-gold-200 transition-colors shadow-soft"
          >
            <Clock className="w-4 h-4" />
            <span>Programar Estado / Post</span>
          </button>

          <button
            onClick={() => setIsNewMediaOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 hover:from-rose-gold-600 hover:to-rose-gold-700 text-white text-xs font-semibold shadow-soft hover:shadow-soft-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Subir Recurso Promocional</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-silk-200 p-1 rounded-2xl border border-rose-gold-200/60 w-fit">
        <button
          onClick={() => setActiveTab('media')}
          className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'media'
              ? 'bg-white text-rose-gold-800 shadow-sm font-bold'
              : 'text-graphite-600 hover:text-graphite-900'
          }`}
        >
          📸 Biblioteca de Piezas ({mediaList.length})
        </button>

        <button
          onClick={() => setActiveTab('scheduler')}
          className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'scheduler'
              ? 'bg-white text-rose-gold-800 shadow-sm font-bold'
              : 'text-graphite-600 hover:text-graphite-900'
          }`}
        >
          🗓 Programador de Publicaciones ({postsList.length})
        </button>
      </div>

      {/* TAB 1: MEDIA LIBRARY */}
      {activeTab === 'media' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {mediaList.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-rose-gold-100 shadow-soft overflow-hidden flex flex-col justify-between hover:shadow-soft-md transition-all group"
            >
              {/* Media Image / Preview */}
              <div className="relative h-48 bg-silk-200 overflow-hidden">
                <img
                  src={item.file_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-bold text-graphite-800 shadow-sm flex items-center gap-1">
                  {item.media_type === 'video' ? <Video className="w-3 h-3 text-rose-500" /> : <Image className="w-3 h-3 text-rose-gold-600" />}
                  <span className="capitalize">{item.media_type}</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif font-bold text-base text-graphite-900 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs text-graphite-600 mt-2 bg-silk-50 p-3 rounded-2xl border border-rose-gold-100/60 line-clamp-3">
                    {item.caption_template}
                  </p>
                </div>

                {/* Hashtags */}
                {item.hashtags && item.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.hashtags.slice(0, 3).map((h, i) => (
                      <span key={i} className="text-[10px] text-rose-gold-700 bg-rose-gold-50 px-2 py-0.5 rounded-md font-semibold">
                        {h}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 border-t border-rose-gold-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopyCaption(`${item.caption_template}\n\n${item.hashtags?.join(' ')}`, item.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-silk-100 hover:bg-rose-gold-100 text-rose-gold-800 text-xs font-semibold transition-colors"
                  >
                    {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === item.id ? '¡Copiado!' : 'Copiar Texto & Hashtags'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: POSTS SCHEDULER */}
      {activeTab === 'scheduler' && (
        <div className="bg-white rounded-3xl border border-rose-gold-100 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-rose-gold-100 pb-3">
            <h3 className="font-serif font-bold text-base text-graphite-900">
              Cronograma de Publicaciones
            </h3>
            <span className="text-xs text-graphite-500">
              Preparado para publicación asistida o sincronización automática
            </span>
          </div>

          <div className="space-y-3">
            {postsList.length === 0 ? (
              <p className="text-xs text-graphite-400 italic text-center py-8">
                No hay publicaciones programadas. Haz clic en "Programar Estado / Post" para planificar contenido.
              </p>
            ) : (
              postsList.map((post) => {
                const date = new Date(post.scheduled_for).toLocaleString('es-AR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={post.id}
                    className="p-4 bg-silk-50 rounded-2xl border border-rose-gold-100 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-graphite-900">{post.title}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            post.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {post.status === 'published' ? 'Publicado' : 'Programado'}
                        </span>
                      </div>
                      <p className="text-graphite-600 line-clamp-1">{post.caption}</p>
                      <p className="text-[10px] text-graphite-400">Fecha: {date}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyCaption(post.caption, post.id)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-rose-gold-200 text-graphite-700 font-semibold text-xs hover:bg-rose-gold-50"
                      >
                        Copiar Copy
                      </button>

                      {post.status !== 'published' && (
                        <button
                          onClick={() => handlePublishNow(post.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-sm"
                        >
                          Publicar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal Subir Recurso */}
      {isNewMediaOpen && (
        <div className="fixed inset-0 z-50 bg-graphite-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-soft-lg border border-rose-gold-200 p-6 space-y-4 animate-scale-up text-xs">
            <h3 className="font-serif font-bold text-base text-graphite-900">
              Subir Recurso Promocional
            </h3>
            <form onSubmit={handleCreateMedia} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Título del Recurso *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Video Antes/Después Peeling"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Tipo de Archivo *</label>
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-rose-gold-200"
                  >
                    <option value="image">Imagen / Foto</option>
                    <option value="video">Video / Reel</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tratamiento Vinculado</label>
                  <select
                    value={selectedTreatmentId}
                    onChange={(e) => setSelectedTreatmentId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-rose-gold-200"
                  >
                    <option value="">General / Todo</option>
                    {treatments.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">URL de la Imagen / Archivo *</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Plantilla de Copy / Texto para Redes</label>
                <textarea
                  rows={3}
                  value={captionTemplate}
                  onChange={(e) => setCaptionTemplate(e.target.value)}
                  placeholder="Texto persuasivo listo para pegar en Instagram o WhatsApp..."
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Hashtags Sugeridos</label>
                <input
                  type="text"
                  value={hashtagsStr}
                  onChange={(e) => setHashtagsStr(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsNewMediaOpen(false)} className="px-4 py-2 rounded-xl border">Cancelar</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-rose-gold-600 text-white rounded-xl font-bold">Guardar Recurso</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Programar Post */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 bg-graphite-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-soft-lg border border-rose-gold-200 p-6 space-y-4 animate-scale-up text-xs">
            <h3 className="font-serif font-bold text-base text-graphite-900">
              Programar Publicación o Estado
            </h3>
            <form onSubmit={handleCreateSchedulePost} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Título de la Campaña *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Promo Día de la Madre - Facial Glow"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Fecha y Hora Programada *</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Texto del Post / Estado *</label>
                <textarea
                  rows={4}
                  required
                  value={postCaption}
                  onChange={(e) => setPostCaption(e.target.value)}
                  placeholder="Escribe el copy promocional completo..."
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsScheduleOpen(false)} className="px-4 py-2 rounded-xl border">Cancelar</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-rose-gold-600 text-white rounded-xl font-bold">Programar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
