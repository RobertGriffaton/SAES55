#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Script de nettoyage complet de l'encodage"""

import codecs

# Lire le fichier en mode binaire d'abord pour éviter les problèmes
with open(r"c:\Users\Robert\Documents\SAES5\MonApp\src\views\FavoritesView.tsx", "rb") as f:
    data = f.read()

print("Analyse du fichier...")

# Corrections en mode bytes pour être sûr
binary_fixes = [
    # Suppression des emojis coeur mal encodés après "Graye List"
    (b'Graye List \xe2\x9d\xa4\xef\xb8\x8f', b'Graye List'),
    (b'Graye List \xc3\xa2\xc2\xa4\xc2\xb8', b'Graye List'),
    # Emoji coeur dans le texte
    (b'le \xe2\x9d\xa4\xef\xb8\x8f pour', b'le coeur pour'),
    (b'le \xc3\xa2\xc2\xa4\xc2\xb8 pour', b'le coeur pour'),
]

for wrong, correct in binary_fixes:
    if wrong in data:
        data = data.replace(wrong, correct)
        print(f"  OK: Emoji supprime")

# Reconvertir en texte pour les autres corrections
content = data.decode('utf-8', errors='ignore')

# Corrections textuelles
text_fixes = [
    ("DejA  valide", "Deja valide"),
    ("A tester", "A tester"),
    ("suggere", "suggere"),
    ("Partage", "Partage"),
    ("teste", "teste"),
]

for wrong, correct in text_fixes:
    if wrong in content:
        content = content.replace(wrong, correct)
        print(f"  OK: {wrong[:20]} -> {correct[:20]}")

# Sauvegarder avec encodage UTF-8 propre
with codecs.open(r"c:\Users\Robert\Documents\SAES5\MonApp\src\views\FavoritesView.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("\nFichier nettoye et sauvegarde en UTF-8!")
