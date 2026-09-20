Add-Type -AssemblyName System.Drawing

$sourcePath = Join-Path $PSScriptRoot '..\public\Medinovel_logo.png'
$publicPath = Join-Path $PSScriptRoot '..\public'
$source = [System.Drawing.Image]::FromFile((Resolve-Path $sourcePath))

try {
  foreach ($size in @(192, 512)) {
    $bitmap = [System.Drawing.Bitmap]::new($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.Clear([System.Drawing.Color]::White)
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $padding = [int]($size * 0.06)
      $scale = [Math]::Min(($size - 2 * $padding) / $source.Width, ($size - 2 * $padding) / $source.Height)
      $width = [int][Math]::Round($source.Width * $scale)
      $height = [int][Math]::Round($source.Height * $scale)
      $x = [int][Math]::Floor(($size - $width) / 2)
      $y = [int][Math]::Floor(($size - $height) / 2)
      $graphics.DrawImage($source, $x, $y, $width, $height)
      $bitmap.Save((Join-Path $publicPath "pwa-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $graphics.Dispose()
      $bitmap.Dispose()
    }
  }
} finally {
  $source.Dispose()
}
