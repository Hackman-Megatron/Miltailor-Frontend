# 🚀 DÉMARRAGE RAPIDE

## ⚡ Installation en 3 minutes

### 1️⃣ Backend (Terminal 1)
```bash
cd .../backend
npm install
# Modifiez .env avec votre mot de passe MySQL (ligne DB_PASSWORD)
npm run dev
```

### 2️⃣ Frontend (Terminal 2)
```bash
# À la racine du projet
npm install
npm run dev
```

### 3️⃣ Accédez à l'application
Ouvrez votre navigateur: **http://localhost:5173**

---

## 👤 Connexion

### Super Administrateur
- **Email:** superadmin@military.gov
- **Mot de passe:** superadmin123
- **Accès:** Complet (tous les modules)

### Administrateur
- **Email:** admin@military.gov
- **Mot de passe:** admin123
- **Accès:** Standard (sans gestion utilisateurs)

---

## ✅ Vérification rapide

Si tout fonctionne, vous devriez voir:

**Backend (Terminal 1):**
```
✓ Database connected successfully
✓ Server running on port 5000
```

**Frontend (Terminal 2):**
```
VITE ready in XXXms
Local: http://localhost:5173
```

---

## 📚 Documentation complète

- **Installation détaillée:** Voir `INSTALLATION_LOCALE.md`
- **Rapport de vérification:** Voir `RAPPORT_VERIFICATION.md`

---

## 🆘 Problème ?

### MySQL ne se connecte pas
```bash
# Vérifiez que MySQL est démarré
# Windows: net start MySQL80
# Linux/Mac: sudo systemctl start mysql
```

### Port 5000 déjà utilisé
Modifiez `PORT=5001` dans `src/backend/.env`

### Base de données existe déjà
```bash
# Réinitialisez
cd src/backend
npm run init-db
```

---

**🎉 C'est tout! Votre application est prête à l'emploi.**
