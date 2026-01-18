$content = Get-Content "c:\Users\Robert\Documents\SAES5\MonApp\src\views\FavoritesView.tsx" -Raw
$content = $content -replace '\\},\\\\r\\r', '},\r'
$content = $content -replace '\\{\\\\r\\r', "{\r"
$content = $content -replace '\\\\r\\r', '\r'
[System.IO.File]::WriteAllText("c:\Users\Robert\Documents\SAES5\MonApp\src\views\FavoritesView.tsx", $content)
