import { useNavigate } from 'react-router-dom';
import {
  LogIn, Shield, ChevronDown, Package, Users, BarChart3, Lock,
  CheckCircle, AlertCircle, ArrowRight, Layers, Award, Settings,
  ChevronLeft, ChevronRight, Tag, Layers2, RefreshCw,
} from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { articlesService } from '../services/api';
import { uniformImages } from '../utils/images-catalogue';
import { useAuthStore } from '../store/authStore';

/* ─── Types ─── */
interface TenueMaitre {
  nom: string;
  type: string;
  categorie: string;
  description: string;
}

interface UniformeDB {
  id: string;
  nom: string;
  type: string;
  categorie: string;
  institution: string;
  quantite: number;
  quantification: string;
  statut: string;
}

interface CarouselCard extends TenueMaitre {
  dbRecord: UniformeDB | null;
  totalQty: number;
}

/* ─── Liste maître — exactement ARTICLES_COMMANDES de MouvementForm ─── */
const TENUES_MAITRE: TenueMaitre[] = [
  {
    nom: 'Camouflés',
    type: 'Opérationnel',
    categorie: 'Armée de Terre',
    description: 'Tenue camouflée réglementaire pour les opérations de terrain. Tissu résistant aux intempéries, mobilité optimale en milieu hostile.',
  },
  {
    nom: 'Tenues claires',
    type: 'Cérémonie',
    categorie: 'Cérémonie',
    description: "Tenue de sortie et de représentation officielle, portée lors des cérémonies militaires, remises de médailles et parades nationales.",
  },
  {
    nom: 'Trei gendarmerie',
    type: 'Service',
    categorie: 'Gendarmerie',
    description: "Tenue de service quotidien de la Gendarmerie Nationale. Identification visuelle immédiate pour les missions de maintien de l'ordre.",
  },
  {
    nom: 'Vareuse',
    type: 'Cérémonie',
    categorie: 'Marine / Armée',
    description: 'Veste de grande tenue militaire réglementaire. Portée lors des événements protocolaires avec insignes et galons cousus selon le grade.',
  },
  {
    nom: 'Tenue cafard',
    type: 'Combat',
    categorie: 'Combat',
    description: 'Tenue de combat légère haute résistance, conçue pour une mobilité maximale lors des opérations spéciales et interventions rapides.',
  },
];

const POLL_MS = 30_000;

export const Home = () => {
  const navigate = useNavigate();
  const [dbUniformes, setDbUniformes] = useState<UniformeDB[]>([]);
  const [loading, setLoading]         = useState(true);
  const [syncing, setSyncing]         = useState(false);
  const [lastSync, setLastSync]       = useState<Date | null>(null);
  const [centerIndex, setCenterIndex] = useState(0);
  const { isAuthenticated } = useAuthStore();
  const catalogueRef = useRef<HTMLDivElement>(null);
  const carouselRef  = useRef<HTMLDivElement>(null);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  /* ── Fetch — SANS quantite_min pour avoir TOUS les uniformes,
     y compris ceux à 0 (ils seront marqués "sous commande") ── */
  const fetchUniformes = useCallback(async (silent = false) => {
    silent ? setSyncing(true) : setLoading(true);
    try {
      const res = await articlesService.getAll({ type: 'uniforme_fini', limit: 200 });
      /* Gère les deux formats de réponse (paginé ou flat) */
      const raw: UniformeDB[] = res.data?.data ?? res.data ?? [];
      setDbUniformes(raw);
      setLastSync(new Date());
    } catch {
      /* En cas d'erreur silencieuse, conserve les données actuelles.
         Au premier chargement on laisse le tableau vide — toutes les
         cartes s'afficheront "sous commande", ce qui est exact. */
    } finally {
      silent ? setSyncing(false) : setLoading(false);
    }
  }, []);

  /* ── 1. Chargement initial ── */
  useEffect(() => { fetchUniformes(false); }, [fetchUniformes]);

  /* ── 2. Polling 30 s ── */
  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => fetchUniformes(true), POLL_MS);
  }, [fetchUniformes]);

  useEffect(() => {
    startPolling();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [startPolling]);

  /* ── 3. Retour sur l'onglet ── */
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') { fetchUniformes(true); startPolling(); }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchUniformes, startPolling]);

  /* ── 4. Reprise du focus ── */
  useEffect(() => {
    const onFocus = () => { fetchUniformes(true); startPolling(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchUniformes, startPolling]);

  /* ── Matching nom → BD (insensible casse/espaces) ── */
  const normalize = (s: string) => s?.trim().toLowerCase() ?? '';

  const buildCards = useCallback((): CarouselCard[] =>
    TENUES_MAITRE.map(tenue => {
      const nomN    = normalize(tenue.nom);
      const matches = dbUniformes.filter(db => normalize(db.nom) === nomN);
      /* Somme de toutes les quantités pour ce nom (multi-institutions) */
      const totalQty = matches.reduce((sum, db) => sum + (db.quantite ?? 0), 0);
      /* On garde le premier enregistrement comme référence d'affichage */
      const dbRecord = matches.find(db => db.quantite > 0) ?? matches[0] ?? null;
      return { ...tenue, dbRecord, totalQty };
    }),
  [dbUniformes]);

  const cards = buildCards();

  /* ── Statut : EN STOCK si totalQty > 0, SOUS COMMANDE sinon ──
     On n'affiche jamais les quantités côté public. ── */
  const getStatus = (card: CarouselCard) =>
    card.totalQty > 0
      ? { inStock: true,  label: 'En stock' }
      : { inStock: false, label: 'Disponible sous commande' };

  const handleLoginClick  = () => navigate(isAuthenticated ? '/dashboard' : '/connexion');
  const scrollToCatalogue = () => catalogueRef.current?.scrollIntoView({ behavior: 'smooth' });

  const activeCat = cards[centerIndex]?.categorie ?? null;
  const prev = () => setCenterIndex(i => Math.max(0, i - 1));
  const next = () => setCenterIndex(i => Math.min(cards.length - 1, i + 1));

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const CARD_W = 300 + 16;
    el.scrollTo({ left: centerIndex * CARD_W - el.clientWidth / 2 + CARD_W / 2, behavior: 'smooth' });
  }, [centerIndex]);

  const inStockCount = cards.filter(c => c.totalQty > 0).length;
  const formatTime = (d: Date) =>
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  /* ─────────────────────────── JSX ─────────────────────────── */
  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { font-family:'DM Sans',sans-serif; }
        .font-display { font-family:'Crimson Pro',Georgia,serif; }
        .mil-grad  { background:linear-gradient(135deg,#1C361C 0%,#2E5230 60%,#1A3019 100%); }
        .gold-line { background:linear-gradient(135deg,#B8972E,#D4AF37,#9A7B1E); }
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .65s ease forwards;}
        .d1{animation-delay:.10s;opacity:0}.d2{animation-delay:.25s;opacity:0}
        .d3{animation-delay:.40s;opacity:0}.d4{animation-delay:.55s;opacity:0}
        .no-scroll::-webkit-scrollbar{display:none}
        .no-scroll{-ms-overflow-style:none;scrollbar-width:none}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spinning{animation:spin 1s linear infinite}
      `}</style>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 mil-grad rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display text-lg font-bold text-gray-900">CEFTA</span>
              <span className="hidden sm:inline text-xs text-gray-400 ml-2">Atelier Militaire</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <button onClick={scrollToCatalogue} className="hover:text-gray-900 transition-colors">Catalogue</button>
            <a href="#plateforme" className="hover:text-gray-900 transition-colors">Plateforme</a>
            <a href="#footer" className="hover:text-gray-900 transition-colors">Contact</a>
          </nav>
          <button onClick={handleLoginClick}
            className="flex items-center gap-2 px-5 py-2.5 mil-grad text-white text-sm rounded-lg hover:opacity-90 transition-opacity font-medium">
            <LogIn className="w-4 h-4" />
            {isAuthenticated ? 'Dashboard' : 'Se connecter'}
          </button>
        </div>
      </header>

      {/* ── HERO — texte centré, pas d'image ── */}
      <section className="relative overflow-hidden py-28 px-6"
        style={{ background: 'linear-gradient(160deg,#1C361C 0%,#2E5230 50%,#1A3019 100%)' }}>
        {/* Motif décoratif subtil */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full border border-white/5" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full border border-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/[0.03]" />
          <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 text-white/[0.03]" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6 fu d1">
            <div className="w-8 gold-line" style={{ height: 2 }} />
            <span className="text-xs font-semibold tracking-widest text-amber-300 uppercase">Armée Camerounaise</span>
            <div className="w-8 gold-line" style={{ height: 2 }} />
          </div>

          <h1 className="font-display text-5xl sm:text-6xl font-bold text-white leading-tight mb-6 fu d2">
            Catalogue des<br />
            <span style={{ color: '#D4AF37' }}>Tenues Militaires</span><br />
            Réglementaires
          </h1>

          <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-xl mx-auto fu d3">
            Plateforme officielle de présentation des uniformes de l'Armée Camerounaise.
            Consultez les disponibilités en temps réel et passez vos commandes.
          </p>

          <div className="flex items-center justify-center gap-4 fu d4">
            <button onClick={scrollToCatalogue}
              className="flex items-center gap-2 px-7 py-3.5 bg-white text-[#2E5230] rounded-xl hover:bg-gray-50 transition-colors font-semibold text-sm">
              Voir le catalogue <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={handleLoginClick}
              className="flex items-center gap-2 px-7 py-3.5 border border-white/30 text-white rounded-xl hover:bg-white/10 transition-colors font-medium text-sm">
              Espace admin
            </button>
          </div>
        </div>

        {/* Flèche défilement */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30">
          <span className="text-xs tracking-widest uppercase">Défiler</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { label: 'Tenues au catalogue', value: TENUES_MAITRE.length },
            { label: 'En stock',             value: loading ? '…' : inStockCount },
            { label: 'Sous commande',        value: loading ? '…' : TENUES_MAITRE.length - inStockCount },
            { label: 'Institutions',         value: '8+' },
          ].map((s, i) => (
            <div key={i}>
              <div className="font-display text-3xl font-bold text-[#2E5230]">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CATALOGUE CARROUSEL ── */}
      <section ref={catalogueRef} id="catalogue" className="py-20 overflow-hidden">

        <div className="max-w-7xl mx-auto px-6 mb-10">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 gold-line" style={{ height: 2 }} />
                <span className="text-xs font-semibold tracking-widest text-amber-700 uppercase">Catalogue officiel</span>
              </div>
              <h2 className="font-display text-4xl font-bold text-gray-900 mb-3">Nos tenues réglementaires</h2>

              {/* Catégorie active + indicateur sync */}
              <div className="flex items-center gap-3 h-6">
                {activeCat && (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full mil-grad inline-block" />
                    <span className="text-sm font-semibold text-[#2E5230]">{activeCat}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  {syncing
                    ? <RefreshCw className="w-3 h-3 text-[#2E5230] spinning" />
                    : <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  }
                  <span className="text-xs text-gray-400">
                    {syncing ? 'Actualisation…' : lastSync ? `Mis à jour ${formatTime(lastSync)}` : ''}
                  </span>
                  <button
                    onClick={() => { fetchUniformes(true); startPolling(); }}
                    disabled={syncing || loading}
                    title="Actualiser maintenant"
                    className="p-1 rounded hover:bg-gray-100 text-gray-300 hover:text-[#2E5230] transition-colors disabled:opacity-30"
                  >
                    <RefreshCw className={`w-3 h-3 ${syncing ? 'spinning' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Flèches + compteur */}
            <div className="flex items-center gap-2">
              <button onClick={prev} disabled={centerIndex === 0}
                className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronLeft className="w-4 h-4 text-gray-700" />
              </button>
              <button onClick={next} disabled={centerIndex >= cards.length - 1}
                className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronRight className="w-4 h-4 text-gray-700" />
              </button>
              <span className="text-xs text-gray-400 ml-1 tabular-nums">{centerIndex + 1} / {cards.length}</span>
            </div>
          </div>
        </div>

        {/* Légende */}
        <div className="max-w-7xl mx-auto px-6 mb-6 flex items-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>En stock — disponible immédiatement</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Disponible sous commande</span>
          </div>
        </div>

        {/* Track */}
        {loading ? (
          <div className="flex gap-4 pl-[calc(50vw-150px)]">
            {TENUES_MAITRE.map((_, i) => (
              <div key={i} className="w-[300px] flex-shrink-0 h-[380px] bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div
            ref={carouselRef}
            className="no-scroll flex gap-4 overflow-x-auto pb-6"
            style={{ paddingLeft: 'calc(50vw - 150px)', paddingRight: 'calc(50vw - 150px)' }}
          >
            {cards.map((card, idx) => {
              const status   = getStatus(card);
              const isCenter = idx === centerIndex;
              const dist     = Math.abs(idx - centerIndex);
              const scale    = isCenter ? 1.04 : dist === 1 ? 0.93 : 0.85;
              const opacity  = isCenter ? 1    : dist === 1 ? 0.72 : 0.42;

              const badgeCls = status.inStock
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200';

              return (
                <div
                  key={card.nom}
                  onClick={() => setCenterIndex(idx)}
                  style={{
                    transform: `scale(${scale})`,
                    opacity,
                    transition: 'transform .4s cubic-bezier(.34,1.56,.64,1), opacity .4s ease, box-shadow .4s ease',
                    transformOrigin: 'center center',
                  }}
                  className={`w-[300px] flex-shrink-0 bg-white rounded-2xl border overflow-hidden cursor-pointer
                    ${isCenter ? 'border-[#2E5230]/30 shadow-2xl' : 'border-gray-100 shadow-sm'}`}
                >
                  {/* Bandeau visuel haut — pas d'image, fond dégradé militaire */}
                  <div className="relative h-36 flex items-center justify-center mil-grad overflow-hidden">
                    {/* Motif décoratif */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Shield className="w-20 h-20 text-white/10" />
                    </div>
                    <div className="absolute inset-0" style={{
                      background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.05) 0%, transparent 60%)'
                    }} />
                    {/* Nom en surimpression */}
                    <span className="relative z-10 text-white/60 text-xs font-semibold tracking-widest uppercase px-4 text-center leading-tight">
                      {card.nom}
                    </span>

                    {/* Badge disponibilité */}
                    <div className={`absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeCls}`}>
                      {status.inStock ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {status.label}
                    </div>

                    {/* Trait doré carte centrale */}
                    {isCenter && <div className="absolute bottom-0 inset-x-0 gold-line" style={{ height: 3 }} />}
                  </div>

                  {/* Contenu texte */}
                  <div className="p-5 space-y-3">
                    <h3 className="text-base font-bold text-gray-900 leading-tight">{card.nom}</h3>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-[#2E5230] flex-shrink-0" />
                        <span className="text-xs text-gray-500">{card.categorie}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Layers2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{card.type}</span>
                      </div>
                    </div>

                    {/* Disponibilité — texte uniquement, jamais de quantité */}
                    <div className="pt-2 border-t border-gray-100">
                      {status.inStock ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span className="text-xs text-emerald-700 font-medium">Disponible immédiatement</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span className="text-xs text-amber-600 italic">Contactez l'atelier pour commander</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{card.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {cards.map((card, idx) => (
            <button key={card.nom} onClick={() => setCenterIndex(idx)} title={card.nom}
              className="rounded-full transition-all duration-300"
              style={{ width: idx === centerIndex ? 28 : 8, height: 8, background: idx === centerIndex ? '#2E5230' : '#D1D5DB' }} />
          ))}
        </div>
      </section>

      {/* ── PLATEFORME ADMIN ── */}
      <section id="plateforme" className="py-20 px-6 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-8 gold-line" style={{ height: 2 }} />
              <span className="text-xs font-semibold tracking-widest text-amber-700 uppercase">Espace d'administration</span>
              <div className="w-8 gold-line" style={{ height: 2 }} />
            </div>
            <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">Une plateforme sécurisée et complète</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              CEFTA propose un système d'administration à deux niveaux, conçu pour répondre aux exigences
              opérationnelles et hiérarchiques de l'Armée Camerounaise.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {[
              { icon: <Package className="w-6 h-6" />,  title: 'Gestion des stocks',    desc: 'Suivez en temps réel la disponibilité de chaque tenue, gérez les entrées et sorties, et anticipez les réapprovisionnements.' },
              { icon: <BarChart3 className="w-6 h-6" />, title: 'Rapports & analyses',   desc: 'Générez des rapports détaillés sur la production, les livraisons et les commandes. Export PDF disponible.' },
              { icon: <Layers className="w-6 h-6" />,    title: 'Gestion des commandes', desc: "Suivez le cycle complet de vos commandes, de la création jusqu'à la livraison, avec historique en temps réel." },
              { icon: <Users className="w-6 h-6" />,     title: 'Multi-utilisateurs',    desc: 'Deux profils distincts avec permissions adaptées au rôle de chaque opérateur dans la chaîne logistique.' },
              { icon: <Award className="w-6 h-6" />,     title: 'Catalogue officiel',    desc: 'Gérez et publiez le catalogue des tenues réglementaires, avec disponibilités mises à jour en temps réel.' },
              { icon: <Settings className="w-6 h-6" />,  title: 'Configuration avancée', desc: 'Paramétrez les catégories, fournisseurs, clients et articles depuis une interface centralisée et intuitive.' },
            ].map((f, i) => (
              <div key={i} className="bg-[#F8F7F4] rounded-2xl p-6 border border-gray-100 hover:border-[#2E5230]/20 transition-colors">
                <div className="w-10 h-10 mil-grad rounded-xl flex items-center justify-center text-white mb-4">{f.icon}</div>
                <h4 className="font-semibold text-gray-900 mb-2">{f.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Admin */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#2E5230]/10 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#2E5230]" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-gray-900">Administrateur</h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Accès standard</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Accès complet aux opérations quotidiennes : gestion des stocks, création de commandes,
                suivi des mouvements et génération de rapports opérationnels.
              </p>
              <ul className="space-y-2">
                {['Consultation et mise à jour des stocks','Création et suivi de commandes','Gestion des mouvements de matériel','Génération de rapports PDF','Consultation du catalogue et des fournisseurs'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-[#2E5230] flex-shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Super Admin */}
            <div className="rounded-2xl border border-[#2E5230] bg-gradient-to-br from-[#1C361C] to-[#2E5230] p-8 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-white">Super Administrateur</h3>
                  <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full">Accès total</span>
                </div>
              </div>
              <p className="text-white/80 text-sm mb-6 leading-relaxed">
                Toutes les permissions, incluant la gestion des utilisateurs, la configuration système
                et l'accès à l'ensemble des données de la plateforme.
              </p>
              <ul className="space-y-2">
                {["Tout l'accès administrateur",'Gestion des comptes utilisateurs','Configuration des catégories et paramètres',"Journaux d'activité complets",'Gestion des clients et fournisseurs','Supervision et audit de la plateforme'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-white/90">
                    <CheckCircle className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button onClick={handleLoginClick}
              className="inline-flex items-center gap-2 px-8 py-3.5 mil-grad text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
              <LogIn className="w-4 h-4" />
              Accéder à l'espace d'administration
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer id="footer" className="bg-[#111B11] text-white pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-display text-lg font-bold">CEFTA</span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                Centre d'Équipement et de Fournitures des Tenues de l'Armée Camerounaise.
                Plateforme officielle de gestion des uniformes réglementaires.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-4">Navigation</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><button onClick={scrollToCatalogue} className="hover:text-white transition-colors">Catalogue des tenues</button></li>
                <li><a href="#plateforme" className="hover:text-white transition-colors">Plateforme admin</a></li>
                <li><button onClick={handleLoginClick} className="hover:text-white transition-colors">Se connecter</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-4">Tenues disponibles</h4>
              <ul className="space-y-2 text-sm">
                {TENUES_MAITRE.map(t => (
                  <li key={t.nom} className="text-white/50">{t.nom}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/30">
            <span>© {new Date().getFullYear()} Atelier Militaire CEFTA — Tous droits réservés</span>
            <span>Armée Camerounaise · Usage officiel uniquement</span>
          </div>
        </div>
      </footer>
    </div>
  );
};