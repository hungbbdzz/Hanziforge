# Exports an optimized runtime JS file: data/hanzi_data_runtime.js

$compJson = Get-Content "data\components.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$recipesJson = Get-Content "data\recipes_map.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$charJson = Get-Content "data\characters_db.json" -Raw -Encoding UTF8 | ConvertFrom-Json

# Export 214 Standard KangXi Radicals for starting inventory
$radicalsList = [System.Collections.Generic.List[object]]::new()
foreach ($prop in $compJson.PSObject.Properties) {
    $c = $prop.Value
    if ($c.is_radical) {
        $radicalsList.Add([ordered]@{
            character = "$($c.character)"
            name = if ($c.name) { "$($c.name)" } else { "$($c.character)" }
            pinyin = if ($c.pinyin) { "$($c.pinyin)" } else { "" }
            meaning = if ($c.meaning) { "$($c.meaning)" } else { "$($c.character)" }
            stroke_count = if ($c.stroke_count) { [int]$c.stroke_count } else { 1 }
            is_radical = $true
        })
    }
}

# Sort KangXi radicals by stroke count
$radicalsList.Sort([System.Comparison[object]]{
    param($a, $b)
    return [int]$a.stroke_count - [int]$b.stroke_count
})

# Compact the recipes map for JS runtime
$jsContent = @"
// HanziForge - Big Data Engine Runtime (9,200+ Crafting Recipes & 214 KangXi Radicals)

(function() {
  const RADICALS_DATA = $($radicalsList | ConvertTo-Json -Depth 5 -Compress);

  // O(1) Fast Spatial Recipe Hash Map (8,660+ Recipes)
  const CRAFTING_RECIPES_MAP = $($recipesJson | ConvertTo-Json -Depth 5 -Compress);

  // Character Dictionary Cache (9,574 Characters with Sino-Vietnamese readings)
  const CHARACTERS_DB = $($charJson | ConvertTo-Json -Depth 5 -Compress);

  if (typeof window !== 'undefined') {
    window.RADICALS_DATA = RADICALS_DATA;
    window.CRAFTING_RECIPES_MAP = CRAFTING_RECIPES_MAP;
    window.CHARACTERS_DB = CHARACTERS_DB;
  }
})();
"@

[System.IO.File]::WriteAllText("data\hanzi_data_runtime.js", $jsContent, [System.Text.Encoding]::UTF8)
Write-Host "Generated data\hanzi_data_runtime.js successfully! Count: $($radicalsList.Count) radicals, Size: $([math]::Round((Get-Item 'data\hanzi_data_runtime.js').Length / 1KB, 1)) KB"
