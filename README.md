# Mes tâches

Une petite application pour noter tout ce que j'ai à faire, rangé en trois catégories : **📚 Cours**, **🏠 Perso** et **💼 Alternance**.

## Utilisation

Ouvre `index.html` dans un navigateur (double-clic sur le fichier). Rien à installer.

- Ajoute une tâche avec une catégorie, une échéance (optionnelle), une priorité et une note.
- Les tâches sont classées automatiquement : en retard, aujourd'hui, cette semaine, plus tard, sans date.
- Clique sur une carte de catégorie en haut pour ne voir que celle-ci (re-clique pour enlever le filtre).
- Coche le rond pour marquer une tâche terminée ; ✎ pour modifier, 🗑 pour supprimer.

## Sauvegarde

Les tâches sont enregistrées dans le navigateur (localStorage) : elles restent après fermeture,
mais seulement sur ce navigateur et cet appareil. Utilise **Exporter** pour faire une sauvegarde
en fichier `.json`, et **Importer** pour la recharger (ou la transférer sur un autre appareil).
