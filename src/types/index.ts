export interface User {
  id: string;
  nom_complet: string;
  email: string;
  role: 'Administrateur' | 'Super Administrateur';
  telephone?: string;
  institution?: string;
  statut: 'Actif' | 'Désactivé';
  date_creation: string;
}

export interface Article {
  id: string;
  nom: string;
  categorie: string;
  institution: string;
  quantite: number;
  quantification: string; // Changé de unite_mesure à quantification
  statut: 'Normal' | 'Faible';
  type: 'matiere_premiere' | 'uniforme_fini';
  seuil_alerte?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Stock {
  id: string;
  nom_produit: string;
  categorie: string;
  quantite_disponible: number;
  quantification: string; // Changé de unite_mesure à quantification
  seuil_alerte: number;
  date_creation?: string;
  date_modification?: string;
}

export interface Categorie {
  id: string;
  nom: string;
  description?: string;
  quantification: string; // Changé de unite_mesure à quantification
}

export interface Mouvement {
  id: string;
  type: 'Entrée Externe' | 'Entrée Interne' | 'Sortie Externe' | 'Sortie Interne';
  article_id?: string;
  article_nom?: string;
  quantite: number;
  quantification?: string; // Ajouté pour les mouvements
  date: string;
  source_destination: string;
  reference?: string;
  notes?: string;
  utilisateur_id: string;
  utilisateur_nom?: string;
}

export interface Commande {
  id: string;
  numero: string;
  institution: string;
  article: string;
  quantite: number;
  quantification?: string; // Changé de unite_mesure à quantification (pièces pour uniformes)
  statut: 'En attente' | 'En production' | 'Livrée' | 'Terminée' | 'Annulée';
  priorite: 'Basse' | 'Normale' | 'Haute' | 'Urgente';
  date_commande: string;
  date_livraison_prevue?: string;
  client_id?: string;
  client_nom?: string;
  client_telephone?: string;
  produit_id?: string;
  tirer_du_stock?: boolean; // Indique si la commande tire du stock existant
  uniforme_id?: string; // ID de l'uniforme sélectionné (si tirer_du_stock = true)
  created_at?: string;
  updated_at?: string;
}
export interface DashboardStats {
  total_articles?: number;
  entrees_ce_mois?: number;
  sorties_ce_mois?: number;
  stock_faible?: number;
  uniformes_termines?: number;
  matieres_premieres?: number;
  mouvements_du_mois?: number;
  commandes_totales?: number;
  commandes_en_attente?: number;
  commandes_en_production?: number;
  commandes_livrees?: number;
  commandes_terminees?: number;
  commandes_annulees?: number;
}

export interface ChartData {
  name: string;
  [key: string]: string | number;
}

export interface Historique {
  id: string;
  action: string;
  type_activite: 'connexion' | 'commande' | 'stock' | 'mouvement' | 'utilisateur' | 'autre';
  table_concernee: string;
  record_id?: string;
  utilisateur_id: string;
  utilisateur_nom?: string;
  role?: string;
  montant?: number;
  details?: string;
  date_action: string;
}

export interface RapportSummary {
  total_transactions: number;
  total_montant: number;
  total_montant_commandes_livrees: number;
  nombre_commandes_livrees: number;
  commandes: number;
  mouvements: number;
  par_categorie: Array<{
    type_activite: string;
    count: number;
  }>;
}

export interface Session {
  id: string;
  utilisateur_id: string;
  token: string;
  ip_address?: string;
  user_agent?: string;
  derniere_activite: string;
  date_connexion: string;
  date_deconnexion?: string;
  statut: 'active' | 'expired' | 'logout';
  nom_complet?: string;
  email?: string;
  role?: string;
}

export interface Fournisseur {
  id: string;
  nom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  date_creation: string;
}

export interface Client {
  id: string;
  nom: string;
  telephone: string;
  date_creation: string;
}