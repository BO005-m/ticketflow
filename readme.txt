# TicketFlow

## Description du Projet
TicketFlow est une application complète de gestion de billetterie événementielle. Elle permet aux utilisateurs de découvrir des événements, d'acheter des billets, de les revendre en toute sécurité et de valider les entrées via un système de scan de codes QR.

Le projet est conçu avec une architecture moderne séparant le backend et le frontend pour une meilleure stabilité et maintenance.

## Structure du Projet

Le projet est divisé en deux parties principales :

### 1. Backend (`/backend`)
Développé avec **FastAPI** (Python), il gère la logique métier, la base de données et la sécurité.
- `app/routes/` : Contient les points d'entrée de l'API (Authentification, Événements, Billets).
- `app/utils/` : Utilitaires pour la génération de codes QR et la gestion des tokens JWT.
- `app/config/` : Configuration de la base de données et des migrations.
- `main.py` : Point d'entrée principal de l'application FastAPI.

### 2. Frontend (`/frontend`)
Développé avec **Next.js** (React) et **Tailwind CSS**, il offre une interface utilisateur moderne et réactive.
- `src/app/` : Utilise le App Router de Next.js pour gérer la navigation (Dashboard, Login, Scan, Billets).
- `src/components/` : Composants UI réutilisables (Navigation, Pied de page, etc.).
- `src/lib/` : Contexte d'authentification et configuration de l'API.

## Fonctionnalités Clés
- **Gestion des Événements** : Création et consultation d'événements.
- **Système de Billetterie** : Achat et visualisation de billets personnels.
- **Revente de Billets** : Possibilité de remettre en vente ses billets sur la plateforme.
- **Validation QR Code** : Système intégré pour scanner et valider les billets lors de l'événement.
- **Authentification Sécurisée** : Gestion des comptes utilisateurs via JWT.

## Installation et Lancement

### Backend
1. Aller dans le dossier `backend`.
2. Installer les dépendances : `pip install -r requirements.txt`.
3. Lancer le serveur : `python main.py`.

### Frontend
1. Aller dans le dossier `frontend`.
2. Installer les dépendances : `npm install`.
3. Lancer en mode développement : `npm run dev`.
