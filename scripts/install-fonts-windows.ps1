$ErrorActionPreference = "Stop"

function Get-FontFamilyName {
  param([string]$FontPath)
  try {
    Add-Type -AssemblyName System.Drawing -ErrorAction Stop
    $pfc = New-Object System.Drawing.Text.PrivateFontCollection
    $pfc.AddFontFile($FontPath)
    if ($pfc.Families.Length -gt 0) {
      return $pfc.Families[0].Name
    }
  } catch {
    # Fallback to filename if parsing fails
  }
  return [System.IO.Path]::GetFileNameWithoutExtension($FontPath)
}

function Install-FontFile {
  param([string]$FontPath)

  if (-not $script:installedHashes) {
    $script:installedHashes = @{}
  }

  try {
    $hash = (Get-FileHash -Path $FontPath -Algorithm SHA256).Hash
    if ($script:installedHashes.ContainsKey($hash)) {
      Write-Host "Skipping duplicate font file: $(Split-Path $FontPath -Leaf)"
      return
    }
    $script:installedHashes[$hash] = $true
  } catch {
    # continue without dedupe if hashing fails
  }

  $fontsDir = Join-Path $env:LOCALAPPDATA "Microsoft\Windows\Fonts"
  if (-not (Test-Path $fontsDir)) {
    New-Item -ItemType Directory -Path $fontsDir | Out-Null
  }

  $dest = Join-Path $fontsDir (Split-Path $FontPath -Leaf)
  Copy-Item $FontPath $dest -Force

  $family = Get-FontFamilyName -FontPath $dest
  $ext = [System.IO.Path]::GetExtension($dest).ToLowerInvariant()
  $fontType = if ($ext -eq ".otf") { "OpenType" } else { "TrueType" }
  $regPath = "HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Fonts"
  $valueName = "$family ($fontType)"
  Set-ItemProperty -Path $regPath -Name $valueName -Value (Split-Path $dest -Leaf)
  $script:installedAny = $true
}

function Download-FirstAvailable {
  param(
    [string[]]$Urls,
    [string]$OutPath
  )

  foreach ($u in $Urls) {
    try {
      Invoke-WebRequest -Uri $u -OutFile $OutPath -UseBasicParsing
      $size = (Get-Item $OutPath).Length
      if ($size -ge 10240) {
        return $u
      }
      Remove-Item $OutPath -Force -ErrorAction SilentlyContinue
    } catch {
      # try next mirror
    }
  }

  return $null
}

if ($env:ERDB_FONT_DOWNLOAD -eq "0") {
  Write-Warning "Font download disabled (ERDB_FONT_DOWNLOAD=0)."
  exit 1
}

$script:installedAny = $false

$downloadTargets = @(
  @{
    Label = "Noto Sans"
    Files = @(
      @{
        Name = "NotoSans-Regular.ttf"
        Urls = @(
          "https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf"
        )
      },
      @{
        Name = "NotoSans-Bold.ttf"
        Urls = @(
          "https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Bold.ttf"
        )
      }
    )
  },
  @{
    Label = "Noto Serif"
    Files = @(
      @{
        Name = "NotoSerif-Regular.ttf"
        Urls = @(
          "https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSerif/NotoSerif-Regular.ttf"
        )
      },
      @{
        Name = "NotoSerif-Bold.ttf"
        Urls = @(
          "https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSerif/NotoSerif-Bold.ttf"
        )
      }
    )
  },
  @{
    Label = "Spicy Sale"
    Files = @(
      @{
        Name = "spicy-sale.regular.ttf"
        Urls = @(
          "https://st.1001fonts.net/download/font/spicy-sale.regular.ttf"
        )
      }
    )
  },
  @{
    Label = "Somelist"
    Files = @(
      @{
        Name = "somelist.regular.ttf"
        Urls = @(
          "https://st.1001fonts.net/download/font/somelist.regular.ttf"
        )
      }
    )
  },
  @{
    Label = "Rubik Spray Paint"
    Files = @(
      @{
        Name = "RubikSprayPaint-Regular.ttf"
        Urls = @(
          "https://raw.githubusercontent.com/google/fonts/main/ofl/rubikspraypaint/RubikSprayPaint-Regular.ttf"
        )
      }
    )
  },
  @{
    Label = "Nabla"
    Files = @(
      @{
        Name = "nabla.regular.ttf"
        Urls = @(
          "https://st.1001fonts.net/download/font/nabla.regular.ttf"
        )
      }
    )
  },
  @{
    Label = "Honk"
    Files = @(
      @{
        Name = "honk.regular.ttf"
        Urls = @(
          "https://st.1001fonts.net/download/font/honk.regular.ttf"
        )
      }
    )
  },
  @{
    Label = "Paper Scratch"
    Files = @(
      @{
        Name = "paper-scratch.regular.otf"
        Urls = @(
          "https://st.1001fonts.net/download/font/paper-scratch.regular.otf"
        )
      }
    )
  },
  @{
    Label = "Sludgeborn"
    Files = @(
      @{
        Name = "sludgeborn.regular.ttf"
        Urls = @(
          "https://st.1001fonts.net/download/font/sludgeborn.regular.ttf"
        )
      }
    )
  },
  @{
    Label = "Playgum"
    Files = @(
      @{
        Name = "playgum.regular.ttf"
        Urls = @(
          "https://st.1001fonts.net/download/font/playgum.regular.ttf"
        )
      }
    )
  },
  @{
    Label = "Atlas Memo"
    Files = @(
      @{
        Name = "atlasmemo.atlas-memo.ttf"
        Urls = @(
          "https://st.1001fonts.net/download/font/atlasmemo.atlas-memo.ttf"
        )
      }
    )
  },
  @{
    Label = "Dracutaz"
    Files = @(
      @{
        Name = "dracutaz.regular.ttf"
        Urls = @(
          "https://st.1001fonts.net/download/font/dracutaz.regular.ttf"
        )
      }
    )
  },
  @{
    Label = "Banana Chips"
    Files = @(
      @{
        Name = "banana-chips.regular.otf"
        Urls = @(
          "https://st.1001fonts.net/download/font/banana-chips.regular.otf"
        )
      }
    )
  },
  @{
    Label = "Holy Star"
    Files = @(
      @{
        Name = "holy-star.holy-star.ttf"
        Urls = @(
          "https://st.1001fonts.net/download/font/holy-star.holy-star.ttf"
        )
      }
    )
  },
  @{
    Label = "Rocks Serif"
    Files = @(
      @{
        Name = "rocks-serif.regular.ttf"
        Urls = @(
          "https://st.1001fonts.net/download/font/rocks-serif.regular.ttf"
        )
      }
    )
  }
)

Write-Host "Downloading ERDB fonts..."

foreach ($target in $downloadTargets) {
  $tmpDir = Join-Path $env:TEMP ("erdb-fonts-" + [guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Path $tmpDir | Out-Null

  try {
    Write-Host "Downloading $($target.Label)..."
    foreach ($file in $target.Files) {
      $outPath = Join-Path $tmpDir $file.Name
      $usedUrl = Download-FirstAvailable -Urls $file.Urls -OutPath $outPath
      if (-not $usedUrl) {
        Write-Warning "Download failed for $($file.Name)."
        continue
      }
      Write-Host "Downloaded $($file.Name) from $usedUrl"
      Install-FontFile -FontPath $outPath
    }
  } catch {
    Write-Warning "Download/install failed for $($target.Label): $($_.Exception.Message)"
  } finally {
    Remove-Item $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}

if (-not $script:installedAny) {
  Write-Warning "No fonts installed. You may need to install manually."
  exit 1
}

Write-Host "Fonts installation complete."
