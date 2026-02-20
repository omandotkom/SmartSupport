param(
  [switch]$SkipInstall,
  [switch]$SkipPrismaGenerate,
  [switch]$SkipMigrate,
  [switch]$NoDev
)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

function Invoke-Step {
  param(
    [Parameter(Mandatory = $true)][string]$Title,
    [Parameter(Mandatory = $true)][scriptblock]$Action
  )

  Write-Host ""
  Write-Host "==> $Title"
  & $Action
}

try {
  if (-not $SkipInstall) {
    Invoke-Step "Install dependencies (npm install)" {
      npm install
      if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    }
  }

  if (-not $SkipPrismaGenerate) {
    Invoke-Step "Generate Prisma Client (npx prisma generate)" {
      npx prisma generate
      if ($LASTEXITCODE -ne 0) { throw "prisma generate failed" }
    }
  }

  if (-not $SkipMigrate) {
    Invoke-Step "Apply migrations (npx prisma migrate deploy)" {
      npx prisma migrate deploy
      if ($LASTEXITCODE -ne 0) { throw "prisma migrate deploy failed" }
    }
  }

  if (-not $NoDev) {
    Invoke-Step "Run app (npm run dev)" {
      npm run dev
      if ($LASTEXITCODE -ne 0) { throw "npm run dev failed" }
    }
  }
}
catch {
  Write-Error $_
  exit 1
}
