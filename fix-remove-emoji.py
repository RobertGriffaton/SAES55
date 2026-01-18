# -*- coding: utf-8 -*-

# Lire le fichier
with open(r"c:\Users\Robert\Documents\SAES5\MonApp\src\views\FavoritesView.tsx", "rb") as f:
    data = f.read()

# Rechercher et remplacer tous les patterns problématiques
patterns_to_remove = [
    b'\xc3\xa2\xc2\xa4\xc2\xb8',  # Emoji coeur cassé
    b'\xe2\x9d\xa4\xef\xb8\x8f',  # Emoji coeur UTF-8
    b'\xc3\xa2\xc2\xa4\xc2\xb8\xc2\x8f',  # Autre variante
]

for pattern in patterns_to_remove:
    if pattern in data:
        data = data.replace(pattern, b'')
        print(f"Supprimé: {pattern.hex()}")

# Écrire le fichier
with open(r"c:\Users\Robert\Documents\SAES5\MonApp\src\views\FavoritesView.tsx", "wb") as f:
    f.write(data)

print("\n✅ Caractères mal encodés supprimés!")
print("\nVérification:")
with open(r"c:\Users\Robert\Documents\SAES5\MonApp\src\views\FavoritesView.tsx", "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if "Graye List" in line and i == 323:
            print(f"Ligne {i}: {line.strip()}")
