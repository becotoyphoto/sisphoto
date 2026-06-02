# Script para aplicar todas as correções no projeto sisphoto
# Execute na raiz do projeto: .\aplicar-correcoes.ps1

$origem = ".\correcoes"
$projeto = "."

Write-Host "Aplicando correcoes..." -ForegroundColor Cyan

$arquivos = @(
    "src\middleware.ts",
    "src\contexts\AuthContext.tsx",
    "src\app\login\page.tsx",
    "src\app\page.tsx",
    "src\app\layout.tsx",
    "src\app\buscar\page.tsx",
    "src\app\categorias\page.tsx",
    "src\app\fotografo\page.tsx",
    "src\app\api\upload\route.ts",
    "src\app\api\checkout\route.ts",
    "src\components\Navbar.tsx"
)

foreach ($arquivo in $arquivos) {
    $src = Join-Path $origem $arquivo
    $dst = Join-Path $projeto $arquivo

    if (Test-Path $src) {
        $dir = Split-Path $dst -Parent
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
        Copy-Item $src $dst -Force
        Write-Host "OK: $arquivo" -ForegroundColor Green
    } else {
        Write-Host "AVISO: nao encontrado $src" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Correcoes aplicadas!" -ForegroundColor Green
Write-Host "Agora rode: vercel --prod --force" -ForegroundColor Cyan
