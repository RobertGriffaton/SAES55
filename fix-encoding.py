# -*- coding: utf-8 -*-

# Lire le fichier
with open(r"c:\Users\Robert\Documents\SAES5\MonApp\src\views\FavoritesView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Dictionnaire de remplacement - ordre important !
replacements = [
    ('â¤ï¸', '❤️'),
    ('❤ï¸', '❤️'),
    ('â€¢', '•'),
    ('DéjÃ\xa0 validé', 'Déjà validé'),  # Avec espace insécable
    ('DéjÃ validé', 'Déjà validé'),      # Avec espace normal
    ('DéjÃ\xa0', 'Déjà '),
    ('DéjÃ ', 'Déjà '),
    ('Ã\xa0', 'à'),
    ('Ã ', 'à'),
    ('Ã€', 'À'),
    ('Ã©', 'é'),
    ('Ã¨', 'è'),
    ('ðŸ½ï¸', '🍽️'),
    ('ðŸ"±', '📱'),
    ('validÃ©', 'validé'),
    ('testÃ©', 'testé'),
    ('suggÃ¨re', 'suggère'),
    ('PartagÃ©', 'Partagé'),
]

count = 0
# Appliquer tous les remplacements dans l'ordre
for wrong, correct in replacements:
    before_count = content.count(wrong)
    if before_count > 0:
        content = content.replace(wrong, correct)
        count += before_count
        print(f"  ✓ {repr(wrong)} → {repr(correct)} ({before_count} remplacements)")

# Écrire le fichier corrigé
with open(r"c:\Users\Robert\Documents\SAES5\MonApp\src\views\FavoritesView.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print(f"\n✅ {count} caractères mal encodés corrigés !")
