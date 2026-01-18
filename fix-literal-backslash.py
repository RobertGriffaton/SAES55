# Lire le fichier et enlever les \r littéraux
with open(r"c:\Users\Robert\Documents\SAES5\MonApp\src\views\FavoritesView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Compter les occurrences avant
count_before = content.count("\\r")
print(f"Backslashes \\r littéraux trouvés: {count_before}")

# Supprimer tous les \r littéraux (backslash + r)
content = content.replace("\\r", "")

# Compter après
count_after = content.count("\\r")
print(f"Backslashes \\r littéraux restants: {count_after}")

# Écrire le fichier corrigé
with open(r"c:\Users\Robert\Documents\SAES5\MonApp\src\views\FavoritesView.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("✅ Fichier corrigé avec succès!")
