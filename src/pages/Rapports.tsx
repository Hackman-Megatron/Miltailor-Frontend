import { useState } from 'react';
import { FileText, Download, Calendar, TrendingUp, ShoppingCart, Package, CheckCircle } from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { rapportsService } from '../services/api';
import { formatDate } from '../utils/formatters';
import { Toast } from '../components/Toast';
import { Historique } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { StatCard } from '../components/StatCard';

export const Rapports = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categorie, setCategorie] = useState('tous');
  const [data, setData] = useState<Historique[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const categories = [
    { value: 'tous', label: 'Toutes les transactions' },
    { value: 'connexion', label: 'Connexions' },
    { value: 'commande', label: 'Commandes' },
    { value: 'stock', label: 'Stocks' },
    { value: 'mouvement', label: 'Mouvements' },
    { value: 'utilisateur', label: 'Utilisateurs' },
  ];

  const COLORS = ['#3B5F3B', '#4A7C4A', '#599959', '#68B668', '#77D377', '#86F086'];

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      setToast({ message: 'Veuillez sélectionner une période', type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const params = {
        startDate,
        endDate,
        categorie: categorie === 'tous' ? undefined : categorie,
      };

      const [transactionsRes, resumeRes] = await Promise.all([
        rapportsService.getAll(params),
        rapportsService.getResume(params),
      ]);

      setData(transactionsRes.data?.data || transactionsRes.data || []);
      setSummary(resumeRes.data?.data || resumeRes.data || null);
      setToast({ message: 'Rapport généré avec succès', type: 'success' });
    } catch (error) {
      console.error('Error generating report:', error);
      setToast({ message: 'Erreur lors de la génération du rapport', type: 'error' });
      setData([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!startDate || !endDate) {
      setToast({ message: 'Veuillez d\'abord générer un rapport', type: 'warning' });
      return;
    }

    try {
      const params = {
        startDate,
        endDate,
        categorie: categorie === 'tous' ? undefined : categorie,
      };

      const response = await rapportsService.exportPDF(params);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${startDate}-${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setToast({ message: 'Rapport exporté avec succès', type: 'success' });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setToast({ message: 'Erreur lors de l\'export', type: 'error' });
    }
  };

  const handleQuickPeriod = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const prepareChartData = () => {
    if (!data.length) return [];

    const groupedByDate: Record<string, number> = {};
    data.forEach((item) => {
      const date = new Date(item.date_action).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
      });
      groupedByDate[date] = (groupedByDate[date] || 0) + 1;
    });

    return Object.entries(groupedByDate)
      .map(([date, count]) => ({ date, count }))
      .slice(-10);
  };

  const preparePieData = () => {
    if (!summary?.par_categorie) return [];

    return summary.par_categorie.map((item: any) => ({
      name: item.type_activite.charAt(0).toUpperCase() + item.type_activite.slice(1),
      value: item.count,
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rapports et Analyses</h1>
            <p className="text-gray-600 mt-1">Générer des rapports détaillés sur les activités</p>
          </div>
          <button
            onClick={handleExportPDF}
            disabled={!data.length}
            className="flex items-center gap-2 px-4 py-2 bg-military-700 text-white rounded-lg hover:bg-military-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Exporter en PDF
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sélectionner une période</h2>
              <div className="flex flex-wrap gap-3 mb-4">
                <button
                  onClick={() => handleQuickPeriod(7)}
                  className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  7 derniers jours
                </button>
                <button
                  onClick={() => handleQuickPeriod(30)}
                  className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  30 derniers jours
                </button>
                <button
                  onClick={() => handleQuickPeriod(90)}
                  className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  3 derniers mois
                </button>
                <button
                  onClick={() => handleQuickPeriod(180)}
                  className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  6 derniers mois
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <select
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateReport}
                disabled={loading}
                className="mt-4 px-6 py-3 bg-military-700 text-white rounded-lg hover:bg-military-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Génération en cours...' : 'Générer le rapport'}
              </button>
            </div>

            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-military-700"></div>
              </div>
            )}

            {!loading && summary && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Transactions"
                    value={summary.total_transactions?.toString() || '0'}
                    icon={TrendingUp}
                    trend="up"
                  />
                  <StatCard
                    title="Commandes Livrées"
                    value={summary.nombre_commandes_livrees?.toString() || '0'}
                    icon={CheckCircle}
                    subtitle={`${summary.total_quantite_commandes_livrees || 0} unités`}
                    trend="up"
                  />
                  <StatCard
                    title="Total Commandes"
                    value={summary.commandes?.toString() || '0'}
                    icon={ShoppingCart}
                  />
                  <StatCard
                    title="Mouvements"
                    value={summary.mouvements?.toString() || '0'}
                    icon={Package}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution des transactions</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={prepareChartData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Bar dataKey="count" name="Transactions" fill="#3B5F3B" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par catégorie</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={preparePieData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {preparePieData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails des transactions</h3>
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Utilisateur
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Détails
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.slice(0, 20).map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(item.date_action)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                            {item.type_activite}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.action}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.utilisateur_nom || 'Système'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {item.details || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {data.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">Aucune transaction pour cette période</p>
                    </div>
                  )}

                  {data.length > 20 && (
                    <div className="mt-4 text-center text-sm text-gray-600">
                      Affichage de 20 transactions sur {data.length} au total. Exportez en PDF pour voir toutes les
                      transactions.
                    </div>
                  )}
                </div>
              </>
            )}

            {!loading && !summary && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun rapport généré</h3>
                <p className="text-gray-600">
                  Sélectionnez une période et cliquez sur "Générer le rapport" pour commencer
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </DashboardLayout>
  );
};