# Guide d'Installation Locale - Système de Gestion de Stock Militaire

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé sur votre machine:

- **Node.js** (version 18 ou supérieure)
- **npm** (inclus avec Node.js)
- **MySQL** (version 8.0 ou supérieure)
- Un navigateur web moderne (Chrome, Firefox, Edge, Safari)

## 🚀 Installation Complète

### Étape 1: Cloner ou télécharger le projet

Si vous avez déjà le projet, passez à l'étape suivante.

### Étape 2: Configuration de MySQL

#### Démarrer MySQL

**Sur Windows:**
```bash
# Si MySQL est installé comme service
net start MySQL80

# Ou via XAMPP/WAMP/MAMP
# Démarrez l'application et activez MySQL
```

**Sur Linux/Mac:**
```bash
# Démarrer MySQL
sudo systemctl start mysql
# ou
sudo service mysql start
```

#### Vérifier la connexion MySQL

```bash
mysql -u root -p
```

Si vous êtes connecté avec succès, tapez `exit` pour quitter.

### Étape 3: Configuration du Backend

#### 3.1 Naviguer vers le dossier backend
```bash
cd src/backend
```

#### 3.2 Installer les dépendances
```bash
npm install
```

#### 3.3 Configurer les variables d'environnement

Le fichier `.env` a déjà été créé dans `src/backend/.env`. Modifiez-le si nécessaire:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_mysql
DB_NAME=stock_management
DB_PORT=3306

JWT_SECRET=military_stock_management_secret_key_2024_change_in_production
JWT_EXPIRES_IN=7d
```

**Important:** Remplacez `DB_PASSWORD` par votre mot de passe MySQL root.

#### 3.4 Initialiser la base de données

Ce script va créer automatiquement:
- La base de données `stock_management`
- Toutes les tables nécessaires
- Les catégories par défaut
- Les deux utilisateurs de test

```bash
npm run init-db
```

Vous devriez voir:
```
✓ Connexion au serveur MySQL réussie
✓ Base de données créée
✓ Tables créées avec succès
✓ Catégories par défaut insérées
✓ Utilisateurs de test créés
```

#### 3.5 Charger les données de test (Optionnel)

Pour avoir des données d'exemple (articles, commandes, mouvements):

```bash
npm run seed-db
```

#### 3.6 Démarrer le serveur backend

```bash
npm start
```

Le serveur devrait démarrer sur `http://localhost:5000`

Vous devriez voir:
```
✓ Database connected successfully
✓ Server running on port 5000
✓ Environment: development
✓ API available at: http://localhost:5000/api
```

**Laissez ce terminal ouvert et en cours d'exécution.**

### Étape 4: Configuration du Frontend

#### 4.1 Ouvrir un nouveau terminal

Dans un nouveau terminal/console, naviguez vers la racine du projet:

```bash
cd /chemin/vers/votre/projet
```

#### 4.2 Installer les dépendances
```bash
npm install
```

#### 4.3 Vérifier le fichier .env

Le fichier `.env` à la racine du projet devrait contenir:
```env
VITE_API_URL=http://localhost:5000/api
```

Si ce fichier n'existe pas, créez-le.

#### 4.4 Démarrer l'application frontend

```bash
npm run dev
```

L'application devrait se lancer sur `http://localhost:5173`

### Étape 5: Accéder à l'Application

Ouvrez votre navigateur et allez sur: `http://localhost:5173`

## 👥 Comptes de Test

### Super Administrateur
- **Email:** `superadmin@military.gov`
- **Mot de passe:** `superadmin123`
- **Permissions:** Accès complet à toutes les fonctionnalités

### Administrateur
- **Email:** `admin@military.gov`
- **Mot de passe:** `admin123`
- **Permissions:** Accès limité (pas de gestion des utilisateurs)

## 📁 Structure du Projet

```
project/
├── src/
│   ├── backend/
│   │   ├── config/          # Configuration (database)
│   │   ├── database/        # Schéma SQL et données
│   │   ├── middleware/      # Middleware d'authentification
│   │   ├── routes/          # Routes API
│   │   ├── scripts/         # Scripts utilitaires
│   │   ├── .env             # Variables d'environnement backend
│   │   ├── package.json     # Dépendances backend
│   │   └── server.js        # Point d'entrée backend
│   │
│   ├── components/          # Composants React réutilisables
│   ├── layouts/             # Layouts de l'application
│   ├── pages/               # Pages de l'application
│   ├── services/            # Services API
│   ├── store/               # État global (Zustand)
│   ├── types/               # Types TypeScript
│   └── utils/               # Utilitaires
│
├── .env                     # Variables d'environnement frontend
├── package.json             # Dépendances frontend
└── vite.config.ts           # Configuration Vite
```

## 🔧 Scripts Disponibles

### Backend (dans `src/backend/`)
- `npm start` - Démarre le serveur en production
- `npm run dev` - Démarre le serveur en mode développement (avec hot-reload)
- `npm run init-db` - Initialise la base de données
- `npm run seed-db` - Charge les données de test
- `npm run setup` - Initialise et charge les données (init-db + seed-db)

### Frontend (à la racine)
- `npm run dev` - Démarre le serveur de développement
- `npm run build` - Compile l'application pour la production
- `npm run preview` - Prévisualise le build de production
- `npm run lint` - Vérifie le code avec ESLint

## 🔍 Vérification de l'Installation

### 1. Vérifier la base de données

```bash
mysql -u root -p
```

```sql
USE stock_management;
SHOW TABLES;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM categories;
```

Vous devriez avoir:
- 5 tables: users, categories, articles, mouvements, commandes
- 2 utilisateurs
- 6 catégories

### 2. Vérifier l'API Backend

Ouvrez `http://localhost:5000/api` dans votre navigateur.
Vous devriez voir:
```json
{
  "message": "Stock Management API",
  "version": "1.0.0",
  "status": "running"
}
```

### 3. Vérifier tous les endpoints

```bash
# Test de connexion (avec Super Admin)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@military.gov","password":"superadmin123"}'
```

Si tout fonctionne, vous recevrez un token JWT.

## ✅ Fonctionnalités Complètes

### 1. **Dashboard**
- Statistiques en temps réel
- 4 graphiques dynamiques liés aux données réelles:
  - Mouvements de stock (entrées/sorties)
  - Distribution par catégories
  - Évolution mensuelle
  - Stock par matières premières

### 2. **Gestion des Articles** (CRUD complet)
- ✅ CREATE: Ajouter de nouveaux articles
- ✅ READ: Lister et filtrer les articles
- ✅ UPDATE: Modifier les articles existants
- ✅ DELETE: Supprimer des articles

### 3. **Gestion des Commandes** (CRUD complet)
- ✅ CREATE: Créer de nouvelles commandes
- ✅ READ: Lister et filtrer les commandes
- ✅ UPDATE: Modifier le statut et les détails
- ✅ DELETE: Supprimer des commandes

### 4. **Gestion des Mouvements** (CR_D)
- ✅ CREATE: Enregistrer entrées/sorties (avec transaction automatique)
- ✅ READ: Consulter l'historique des mouvements
- ✅ DELETE: Supprimer un mouvement

### 5. **Gestion des Catégories** (CRUD complet)
- ✅ CREATE: Ajouter des catégories
- ✅ READ: Lister les catégories
- ✅ UPDATE: Modifier les catégories
- ✅ DELETE: Supprimer des catégories

### 6. **Gestion des Utilisateurs** (CRUD complet - Super Admin uniquement)
- ✅ CREATE: Créer de nouveaux utilisateurs
- ✅ READ: Lister les utilisateurs
- ✅ UPDATE: Modifier les utilisateurs
- ✅ DELETE: Supprimer des utilisateurs

### 7. **Rapports**
- ✅ Rapports de production
- ✅ Rapports de livraisons
- ⚠️ Export PDF (fonctionnalité de base, à améliorer)

## 🛠️ Dépannage

### Erreur: "Cannot connect to MySQL server"
- Vérifiez que MySQL est démarré
- Vérifiez les identifiants dans `.env`
- Vérifiez que le port 3306 n'est pas utilisé par une autre application

### Erreur: "Port 5000 already in use"
- Changez le port dans `src/backend/.env`
- Ou arrêtez l'application utilisant le port 5000

### Erreur: "Port 5173 already in use"
- Vite va automatiquement utiliser le port suivant disponible
- Ou spécifiez un port dans `vite.config.ts`

### L'application ne se connecte pas au backend
- Vérifiez que le backend est en cours d'exécution
- Vérifiez que `VITE_API_URL` dans `.env` pointe vers `http://localhost:5000/api`
- Videz le cache du navigateur et rechargez

### Les graphiques sont vides
- Vérifiez que vous avez des données dans la base
- Exécutez `npm run seed-db` dans le dossier backend
- Vérifiez la console du navigateur pour les erreurs

## 📊 Test Complet de la Plateforme

1. **Login:** Connectez-vous avec un des comptes de test
2. **Dashboard:** Vérifiez que les statistiques et graphiques s'affichent
3. **Articles:** Créez, modifiez et supprimez un article de test
4. **Mouvements:** Enregistrez une entrée ou sortie de stock
5. **Commandes:** Créez une nouvelle commande
6. **Rapports:** Consultez les rapports disponibles

## 🔐 Sécurité

- Les mots de passe sont hashés avec bcrypt
- JWT pour l'authentification
- Validation des données côté serveur
- Protection CORS configurée
- Transactions SQL pour les opérations critiques

## 📝 Notes Importantes

1. **Mode Développement:** Cette configuration est pour le développement local uniquement
2. **Mot de passe MySQL:** N'oubliez pas de configurer votre mot de passe MySQL dans `.env`
3. **Données de Test:** Utilisez `npm run seed-db` pour avoir des données d'exemple
4. **Production:** Pour la production, changez les variables d'environnement et utilisez HTTPS

## 🆘 Support

Si vous rencontrez des problèmes:
1. Vérifiez que MySQL est bien démarré
2. Vérifiez les logs du backend dans le terminal
3. Vérifiez la console du navigateur pour les erreurs frontend
4. Assurez-vous que tous les ports sont disponibles (3306, 5000, 5173)

---

**Bonne utilisation! 🎉**
