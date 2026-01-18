# -*- coding: utf-8 -*-

# Lire le fichier en binaire pour éviter les problèmes d'encodage
with open(r"c:\Users\Robert\Documents\SAES5\MonApp\src\views\FavoritesView.tsx", "rb") as f:
    content = f.read()

# Remplacements binaires pour corriger l'encodage cassé
replacements_bin = [
    # Emoji coeur cassé -> Texte simple
    (b'Graye List \xc3\xa2\xc2\xa4\xc2\xb8', b'Graye List'),
    (b'Graye List \xe2\x9d\xa4\xef\xb8\x8f', b'Graye List'),
    # Autres corrections
    (b'le \xc3\xa2\xc2\xa4\xc2\xb8 pour', b'le coeur pour'),
    (b'le \xe2\x9d\xa4\xef\xb8\x8f pour', b'le coeur pour'),
]

for wrong, correct in replacements_bin:
    if wrong in content:
        content = content.replace(wrong, correct)
        print(f"✓ Remplacement: {wrong[:20]}... → {correct}")

# Écrire le fichier
with open(r"c:\Users\Robert\Documents\SAES5\MonApp\src\views\FavoritesView.tsx", "wb") as f:
    f.write(content)

print("\n✅ Fichier corrigé avec succès!")
