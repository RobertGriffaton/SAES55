# -*- coding: utf-8 -*-
"""
Script de nettoyage complet de l'encodage pour FavoritesView.tsx
"""

# Lire le fichier
with open(r"c:\Users\Robert\Documents\SAES5\MonApp\src\views\FavoritesView.tsx", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

print("🔍 Analyse du fichier...")

# Liste complète de tous les remplacements nécessaires
fixes = [
    # Emojis cassés - on les enlève complètement
    ("Graye List ❤️", "Graye List"),
    ("Graye List â¤ï¸", "Graye List"),
    ("Graye List â¤¸", "Graye List"),
    ("Graye List ❤", "Graye List"),
    
    # Point bullet
    ("â€¢", "•"),
    ("â€™", "'"),
    
    # Caractères accentués français
    ("Ã€", "À"),
    ("Ã‚", "Â"),
    ("Ã‰", "É"),
    ("Ãˆ", "È"),
    ("Ã‰", "É"),
    ("Ã", "à"),
    ("Ã¢", "â"),
    ("Ã©", "é"),
    ("Ã¨", "è"),
    ("Ãª", "ê"),
    ("Ã®", "î"),
    ("Ã´", "ô"),
    ("Ã¹", "ù"),
    ("Ã»", "û"),
    ("Ã§", "ç"),
    
    # Espaces insécables mal encodés
    ("Ã\xa0", "à"),
    ("Ã ", "à"),
    
    # Corrections spécifiques connues
    ("DÃ©jÃ  validÃ©", "Déjà validé"),
    ("DÃ©jÃ validÃ©", "Déjà validé"),
    ("DÃ©jÃ ", "Déjà "),
    ("validÃ©", "validé"),
    ("testÃ©", "testé"),
    ("suggÃ¨re", "suggère"),
    ("PartagÃ©", "Partagé"),
    ("favoris, l'IA te suggÃ¨re", "favoris, l'IA te suggère"),
    
    # Emoji dans le texte d'aide
    ("le ❤️ pour", "le coeur pour"),
    ("le â¤ï¸ pour", "le coeur pour"),
    ("le â¤¸ pour", "le coeur pour"),
    ("le ❤ pour", "le coeur pour"),
    
    # Emojis dans la fonction de partage
    ("🍽️", "🍽"),
    ("📱", "📱"),
    ("ðŸ½ï¸", "🍽"),
    ("ðŸ"±", "📱"),
]

count = 0
for wrong, correct in fixes:
    occurrences = content.count(wrong)
    if occurrences > 0:
        content = content.replace(wrong, correct)
        count += occurrences
        print(f"  ✓ {wrong[:30]:30} → {correct[:30]:30} ({occurrences}x)")

# Écrire le fichier avec encodage UTF-8 strict
with open(r"c:\Users\Robert\Documents\SAES5\MonApp\src\views\FavoritesView.tsx", "w", encoding="utf-8", newline="\r\n") as f:
    f.write(content)

print(f"\n✅ {count} corrections appliquées!")
print("📝 Fichier sauvegardé avec encodage UTF-8")

# Vérification finale
print("\n🔍 Vérification finale...")
with open(r"c:\Users\Robert\Documents\SAES5\MonApp\src\views\FavoritesView.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()
    
checks = [
    (323, "Titre"),
    (341, "À tester"),
    (349, "Déjà validé"),
    (414, "suggère"),
]

for line_num, desc in checks:
    if line_num <= len(lines):
        line = lines[line_num - 1].strip()
        print(f"{desc:15} (L{line_num}): {line[:80]}")

print("\n✨ Nettoyage terminé!")
