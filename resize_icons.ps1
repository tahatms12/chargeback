$apps = @(
    @{ file = 'image1_fixitcsv.jpg'; destDirs = @('FixitCSV\public') },
    @{ file = 'image2_craftline.jpg'; destDirs = @('Craftline\public') },
    @{ file = 'image3_stagewise.jpg'; destDirs = @('Stagewise\public') },
    @{ file = 'image4_customsready.jpg'; destDirs = @('customsready\public') },
    @{ file = 'image5_quoteloop.jpg'; destDirs = @('apps\quoteloop-new\public') },
    @{ file = 'image6_poref.jpg'; destDirs = @('apps\poref-new\public') }
)

$basePath = "C:\Users\Admin\Downloads\shopifyapps\final\chargeback"
$sizes = @(192, 512)

Add-Type -AssemblyName System.Drawing

foreach ($app in $apps) {
    $sourcePath = Join-Path -Path $basePath -ChildPath $app.file
    
    if (-Not (Test-Path -Path $sourcePath)) {
        Write-Warning "Source file not found: $sourcePath"
        continue
    }

    $image = [System.Drawing.Image]::FromFile($sourcePath)

    foreach ($dir in $app.destDirs) {
        $targetDir = Join-Path -Path $basePath -ChildPath $dir
        if (-Not (Test-Path -Path $targetDir)) {
            New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
        }

        foreach ($size in $sizes) {
            $destPath = Join-Path -Path $targetDir -ChildPath "logo-${size}x${size}.png"
            $bitmap = New-Object System.Drawing.Bitmap($size, $size)
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.DrawImage($image, 0, 0, $size, $size)
            
            $bitmap.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
            $graphics.Dispose()
            $bitmap.Dispose()
            Write-Host "Created $destPath"
        }
        
        # Save icon.png
        $iconPath = Join-Path -Path $targetDir -ChildPath "icon.png"
        $bitmapIcon = New-Object System.Drawing.Bitmap(512, 512)
        $graphicsIcon = [System.Drawing.Graphics]::FromImage($bitmapIcon)
        $graphicsIcon.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphicsIcon.DrawImage($image, 0, 0, 512, 512)
        
        $bitmapIcon.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $graphicsIcon.Dispose()
        $bitmapIcon.Dispose()
        Write-Host "Created $iconPath"
    }

    $image.Dispose()
}
