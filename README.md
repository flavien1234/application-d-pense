# Mes Dépenses

Application pour suivre ses dépenses du mois, installable sur iPhone et iPad (Progressive Web App, sans App Store).

## Fonctionnalités
- Total du mois et comparaison avec le mois précédent
- Navigation entre les mois (flèches ou glissement du doigt)
- Ajout, modification et suppression de dépenses (montant, catégorie, description, date)
- Répartition par catégorie avec pourcentages, et filtre par catégorie
- Budget mensuel avec barre de progression (orange au-delà de 80 %, rouge en cas de dépassement)
- Fonctionne hors connexion, mode sombre automatique
- Mise en page adaptée à l'iPad (deux colonnes)
- Export / import JSON (sauvegarde ou transfert iPhone ↔ iPad) et export CSV (Excel / Numbers)

## Mise en ligne (une seule fois)
1. Fusionnez cette branche dans `main`.
2. Sur GitHub : **Settings → Pages → Build and deployment → Source : GitHub Actions**.
3. L'application est publiée à l'adresse `https://<votre-compte>.github.io/application-d-pense/`.

## Installation sur iPhone / iPad
1. Ouvrez l'adresse ci-dessus dans **Safari**.
2. Touchez le bouton **Partager** (carré avec une flèche).
3. Choisissez **Sur l'écran d'accueil**, puis **Ajouter**.

L'icône « Dépenses » apparaît alors comme une vraie application.

## Données
Les dépenses sont enregistrées uniquement sur l'appareil (rien n'est envoyé sur internet). L'iPhone et l'iPad ont donc chacun leurs propres données : utilisez **Exporter** sur l'un puis **Importer** sur l'autre (via AirDrop ou Fichiers) pour les transférer. Pensez à exporter régulièrement pour garder une sauvegarde.
