$dir = "C:\Users\Aryan Kaul\AppData\Local\Temp\opencode\.archify\architecture-zalen-20261017-191741"
$html = Get-Content (Join-Path $dir "zalen.html") -Raw
$start = $html.IndexOf('<svg')
$end = $html.IndexOf('</svg>') + '</svg>'.Length
$svg = $html.Substring($start, $end - $start)

# Inspect internal style for external var() dependencies
$si = $svg.IndexOf('<style>')
$sj = $svg.IndexOf('</style>')
$inner = $svg.Substring($si, $sj - $si)
$varCount = [regex]::Matches($svg, 'var\(').Count
$defCount = [regex]::Matches($svg, '--[a-zA-Z0-9-]+\s*:').Count
Write-Output "inner style length: $($inner.Length)"
Write-Output "var() refs in svg: $varCount"
Write-Output "custom prop defs in svg: $defCount"
Write-Output "--- inner style head ---"
Write-Output $inner.Substring(0, [Math]::Min(900, $inner.Length))

# Write standalone svg
$svgPath = Join-Path $dir "zalen.svg"
Set-Content -Path $svgPath -Value $svg -Encoding UTF8
Write-Output "WROTE SVG bytes: $((Get-Item $svgPath).Length)"
