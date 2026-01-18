import re

# Lire le fichier
with open(r"c:\Users\Robert\Documents\SAES5\MonApp\src\views\FavoritesView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remplacer les caractères mal échappés
content = content.replace("},\\r\r\n", "},\r\n")
content = content.replace("{\\r\r\n", "{\r\n")  
content = content.replace("\\r\r\n", "\r\n")

# Écrire le fichier réparé
with open(r"c:\Users\Robert\Documents\SAES5\MonApp\src\views\FavoritesView.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Fichier réparé avec succès!")
