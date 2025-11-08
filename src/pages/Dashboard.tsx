import { useEffect, useState } from 'react';
import { Package, TrendingUp, TrendingDown, AlertTriangle, Download, Upload } from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { dashboardService, commandesService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { DashboardStats, ChartData } from '../types';

export const Dashboard = () => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'Super Administrateur';
  const [stats, setStats] = useState<DashboardStats>({});
  const [mouvementsData, setMouvementsData] = useState<ChartData[]>([]);
  const [categoriesData, setCategoriesData] = useState<ChartData[]>([]);
  const [rawMaterialsData, setRawMaterialsData] = useState<ChartData[]>([]);
  const [mouvementsStats, setMouvementsStats] = useState({ entrees_externes: 0, entrees_internes: 0, sorties_externes: 0, sorties_internes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  
const loadDashboardData = async () => {
  try {
    const token = localStorage.getItem('token');
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const [statsRes, mouvRes, catRes, rawRes, mouvStatsRes, commandesStatsRes] = await Promise.all([
      dashboardService.getStats(),
      dashboardService.getChartData('mouvements'),
      dashboardService.getChartData('categories'),
      dashboardService.getChartData('raw-materials'),
      fetch(`${API_BASE_URL}/mouvements/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }).then(r => r.json()),
      commandesService.getStats(),
    ]);

    setMouvementsData(mouvRes.data || []);
    setCategoriesData(catRes.data || []);
    setRawMaterialsData(rawRes.data || []);

    // Calculer les statistiques de mouvements du mois en cours
    const statsData = mouvStatsRes || [];
    const statsMap: any = {
      entrees_externes: 0,
      entrees_internes: 0,
      sorties_externes: 0,
      sorties_internes: 0
    };
    
    statsData.forEach((stat: any) => {
      if (stat.type === 'Entrée Externe') statsMap.entrees_externes = stat.count;
      if (stat.type === 'Entrée Interne') statsMap.entrees_internes = stat.count;
      if (stat.type === 'Sortie Externe') statsMap.sorties_externes = stat.count;
      if (stat.type === 'Sortie Interne') statsMap.sorties_internes = stat.count;
    });
    
    setMouvementsStats(statsMap);

    // Mettre à jour les stats avec les calculs corrects
    const updatedStats = statsRes.data || {};
    
    // Calculer entrees_ce_mois et sorties_ce_mois à partir des mouvements
    updatedStats.entrees_ce_mois = statsMap.entrees_externes + statsMap.entrees_internes;
    updatedStats.sorties_ce_mois = statsMap.sorties_externes + statsMap.sorties_internes;
    
    // Les uniformes terminés = nombre d'articles de type "uniforme_fini"
    updatedStats.uniformes_termines = updatedStats.uniformes_termines || 0;
    
    setStats(updatedStats);

  } catch (error) {
    console.error('Error loading dashboard data:', error);
    setStats({});
    setMouvementsData([]);
    setCategoriesData([]);
    setRawMaterialsData([]);
    setMouvementsStats({ entrees_externes: 0, entrees_internes: 0, sorties_externes: 0, sorties_internes: 0 });
  } finally {
    setLoading(false);
  }
};


  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-military-700"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isSuperAdmin ? (
            <>
              <StatCard
                title="Uniformes terminés"
                value={stats.uniformes_termines || 0}
                icon={Package}
                subtitle="Articles finis disponibles"
              />
              <StatCard
                title="Matières premières"
                value={stats.matieres_premieres || 0}
                icon={Package}
                subtitle="Articles en stock"
              />
              <StatCard
                title="Mouvements du mois"
                value={stats.mouvements_du_mois || 0}
                icon={TrendingUp}
                subtitle="Entrées et sorties"
              />
              <StatCard
                title="Stocks faibles"
                value={stats.stock_faible || 0}
                icon={AlertTriangle}
                subtitle="Articles à réapprovisionner"
              />
            </>
          ) : (
            <>
              <StatCard
                title="Total Articles"
                value={stats.total_articles || 0}
                icon={Package}
                trend="+12% par rapport au mois dernier"
              />
              <StatCard
                title="Entrées ce mois"
                value={stats.entrees_ce_mois || 0}
                icon={TrendingUp}
                trend="+8% par rapport au mois dernier"
              />
              <StatCard
                title="Sorties ce mois"
                value={stats.sorties_ce_mois || 0}
                icon={TrendingDown}
                trend="-3% par rapport au mois dernier"
              />
              <StatCard
                title="Stock faible"
                value={stats.stock_faible || 0}
                icon={AlertTriangle}
                subtitle="Articles à réapprovisionner"
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Entrées Externes</h3>
              <Download className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{mouvementsStats.entrees_externes}</p>
            <p className="text-xs text-gray-500 mt-1">Approvisionnements externes</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Entrées Internes</h3>
              <Download className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{mouvementsStats.entrees_internes}</p>
            <p className="text-xs text-gray-500 mt-1">Mouvements internes entrants</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Sorties Externes</h3>
              <Upload className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{mouvementsStats.sorties_externes}</p>
            <p className="text-xs text-gray-500 mt-1">Distributions externes</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Sorties Internes</h3>
              <Upload className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{mouvementsStats.sorties_internes}</p>
            <p className="text-xs text-gray-500 mt-1">Mouvements internes sortants</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mouvements de stock</h3>
            <p className="text-sm text-gray-500 mb-4">Évolution des entrées et sorties sur 7 jours</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mouvementsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#111827' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Line type="monotone" dataKey="Entrées" stroke="#16a34a" strokeWidth={3} dot={{ fill: '#16a34a', r: 4 }} />
                <Line type="monotone" dataKey="Sorties" stroke="#dc2626" strokeWidth={3} dot={{ fill: '#dc2626', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des mouvements</h3>
            <p className="text-sm text-gray-500 mb-4">Distribution par type de mouvement</p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Entrées Externes', value: mouvementsStats.entrees_externes },
                    { name: 'Entrées Internes', value: mouvementsStats.entrees_internes },
                    { name: 'Sorties Externes', value: mouvementsStats.sorties_externes },
                    { name: 'Sorties Internes', value: mouvementsStats.sorties_internes }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }: any) => `${name ? name.split(' ')[0] : ''} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#16a34a" />
                  <Cell fill="#86efac" />
                  <Cell fill="#dc2626" />
                  <Cell fill="#fca5a5" />
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock par catégorie</h3>
            <p className="text-sm text-gray-500 mb-4">Répartition du stock total par catégorie</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '11px' }} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  cursor={{ fill: 'rgba(47, 110, 47, 0.1)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="value" fill="#2f6e2f" radius={[8, 8, 0, 0]} name="Quantité" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock de matières premières</h3>
            <p className="text-sm text-gray-500 mb-4">Quantités par catégorie de matières premières</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rawMaterialsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '11px' }} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  cursor={{ fill: 'rgba(11, 61, 11, 0.1)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="quantite" fill="#0b3d0b" radius={[8, 8, 0, 0]} name="Quantité" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};