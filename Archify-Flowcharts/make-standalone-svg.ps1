$dir = "C:\Users\Aryan Kaul\AppData\Local\Temp\opencode\.archify\architecture-zalen-20261017-191741"
$svg = Get-Content (Join-Path $dir "zalen.svg") -Raw
$style = @'
          :root {
            --frontend-stroke: #2563eb;
            --backend-stroke: #475569;
            --database-stroke: #6b21a8;
            --cloud-stroke: #0ea5e9;
            --security-stroke: #92400e;
            --messagebus-stroke: #0f766e;
            --external-stroke: #374151;
            --stage-bg: #f8fafc;
            --stage-stroke: #cbd5e1;
            --mask: #ffffff;
            --text: #0f172a;
            --muted: #475569;
            --bg: #f8fafc;
            --edge: #475569;
          }
          .text{ fill: var(--text); font-family: Inter,Segoe UI,system-ui,-apple-system,BlinkMacSystemFont,sans-serif; font-size:12px; }
          .sublabel{ fill: var(--muted); font-family: Inter,Segoe UI,system-ui,-apple-system,BlinkMacSystemFont,sans-serif; font-size:10px; }
          .label{ fill: var(--text); font-family: Inter,Segoe UI,system-ui,-apple-system,BlinkMacSystemFont,sans-serif; font-size:11px; }
          .edge{ stroke: var(--edge); stroke-width:1.2; fill:none; }
          .boundary{ fill:none; stroke: var(--stage-stroke); stroke-width:1; stroke-dasharray:3 3; }
'@
$si = $svg.IndexOf('<style>')
$sj = $svg.IndexOf('</style>')
$new = $svg.Substring(0, $si) + '<style>' + $style + '</style>' + $svg.Substring($sj + '</style>'.Length)
$dst = Join-Path $dir "zalen.standalone.svg"
Set-Content -Path $dst -Value $new -Encoding UTF8
"done: $((Get-Item $dst).Length)"
