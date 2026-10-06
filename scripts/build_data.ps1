# HanziForge - Big Data Processing Pipeline in PowerShell
# Processes dictionary.txt (JSONL) & Unihan_Readings.txt into components.json, recipes_map.json, characters_db.json

param (
    [string]$InputPath = "data\dictionary.txt",
    [string]$UnihanReadings = "data\unihan\Unihan_Readings.txt",
    [string]$ComponentsOut = "data\components.json",
    [string]$RecipesOut = "data\recipes_map.json",
    [string]$CharactersOut = "data\characters_db.json"
)

Write-Host "1. Loading Unihan Sino-Vietnamese Database ..." -ForegroundColor Cyan
$unihanDict = @{}
if (Test-Path $UnihanReadings) {
    $uLines = [System.IO.File]::ReadAllLines($UnihanReadings, [System.Text.Encoding]::UTF8)
    foreach ($ul in $uLines) {
        if ($ul.StartsWith('#') -or [string]::IsNullOrWhiteSpace($ul)) { continue }
        $parts = $ul.Split([char]9)
        if ($parts.Length -ge 3 -and $parts[1] -eq 'kVietnamese') {
            $codeHex = $parts[0].Replace('U+', '')
            $codePoint = [Convert]::ToInt32($codeHex, 16)
            $char = [char]::ConvertFromUtf32($codePoint)
            # Take primary reading and capitalize
            $primaryReading = ($parts[2].Trim() -split ' ')[0]
            if ($primaryReading) {
                $unihanDict[$char] = (Get-Culture).TextInfo.ToTitleCase($primaryReading.ToLower())
            }
        }
    }
    Write-Host "Loaded $($unihanDict.Count) Sino-Vietnamese readings from Unihan!" -ForegroundColor Green
}

# ── CVDICT Vietnamese-Chinese Dictionary (122,000+ proper Vietnamese definitions) ─
# Format per line: 繁體 简体 [pinyin] /nghĩa tiếng Việt/
$viDefDict = @{}
$cvdictPath = "data\CVDICT.u8"
if (Test-Path $cvdictPath) {
    Write-Host "1b. Loading CVDICT Vietnamese dictionary ..." -ForegroundColor Cyan
    $cvLines = [System.IO.File]::ReadAllLines($cvdictPath, [System.Text.Encoding]::UTF8)

    # First pass: collect all definitions per single character
    $cvAllDefs = [System.Collections.Generic.Dictionary[string, System.Collections.Generic.List[string]]]::new()
    foreach ($cl in $cvLines) {
        if ($cl.StartsWith('#') -or [string]::IsNullOrWhiteSpace($cl)) { continue }
        $m = [regex]::Match($cl, '^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+/(.+)/$')
        if (-not $m.Success) { continue }
        $tradChar = $m.Groups[1].Value
        $simpChar = $m.Groups[2].Value
        $defRaw   = $m.Groups[4].Value

        # Split by "/" to get all segments
        $segments = $defRaw -split '/' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }

        foreach ($target in @($simpChar, $tradChar)) {
            if ($target.Length -ne 1) { continue }
            if (-not $cvAllDefs.ContainsKey($target)) {
                $cvAllDefs[$target] = [System.Collections.Generic.List[string]]::new()
            }
            foreach ($seg in $segments) {
                $cvAllDefs[$target].Add($seg)
            }
        }
    }

    # Second pass: for each character pick best non-surname definition
    $cvCount = 0
    # Patterns that indicate a surname/abbreviation entry (using -like glob)
    # "ho " starts with "h" + Vietnamese "o with dot below" — use the actual char
    $surnamePrefixes = @("ho ", "ten ", "viet tat cua ", "viet tat ", "ngay ")
    foreach ($kv in $cvAllDefs.GetEnumerator()) {
        $char = $kv.Key
        $defs = $kv.Value
        $chosen = ""
        foreach ($d in $defs) {
            $dLow = $d.ToLower().Normalize([System.Text.NormalizationForm]::FormD) -replace '[^\x00-\x7F]',''
            $dLow = $dLow.Trim()
            $isSurname = $false
            foreach ($pfx in $surnamePrefixes) {
                if ($dLow.StartsWith($pfx)) { $isSurname = $true; break }
            }
            # Also skip entries that are just "[Xxx1]" notation
            if ($d -match '^\[.*\]$') { $isSurname = $true }
            if (-not $isSurname) {
                # Clean up: remove inline refs like "see also [Xxx1]" and parentheticals
                $cleaned = $d -replace '\|[^\s]+', '' # remove "繁|简" refs
                $cleaned = $cleaned -replace '\[[\w\d\s]+\]', '' # remove [Pinyin]
                $cleaned = $cleaned.Trim().TrimEnd(',').Trim()
                if ($cleaned -ne "") { $chosen = $cleaned; break }
            }
        }
        # Fallback: use first definition if all were "surname"
        if ($chosen -eq "" -and $defs.Count -gt 0) {
            $chosen = $defs[0] -replace '\[[\w\d\s]+\]', ''
            $chosen = $chosen.Trim().TrimEnd(',').Trim()
        }
        if ($chosen -ne "") {
            $viDefDict[$char] = $chosen
            $cvCount++
        }
    }
    # Extract compound words (2-4 chars) for each character
    $cvCompounds = @{}
    foreach ($cl in $cvLines) {
        if ($cl.StartsWith('#') -or [string]::IsNullOrWhiteSpace($cl)) { continue }
        $m = [regex]::Match($cl, '^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+/(.+)/$')
        if (-not $m.Success) { continue }
        $simp = $m.Groups[2].Value
        $py = $m.Groups[3].Value
        $defClean = ($m.Groups[4].Value -split '/' | Where-Object { $_ -ne "" }) -join '; '
        
        if ($simp.Length -ge 2 -and $simp.Length -le 4) {
            for ($ci = 0; $ci -lt $simp.Length; $ci++) {
                $c = $simp[$ci].ToString()
                if (-not $cvCompounds.ContainsKey($c)) {
                    $cvCompounds[$c] = [System.Collections.Generic.List[object]]::new()
                }
                if ($cvCompounds[$c].Count -lt 4) {
                    $cvCompounds[$c].Add([ordered]@{
                        word = $simp
                        pinyin = $py
                        meaning = $defClean
                    })
                }
            }
        }
    }
    Write-Host "Extracted compound words for $($cvCompounds.Keys.Count) characters from CVDICT!" -ForegroundColor Green
}




# ── Vietnamese Translation Engine ─────────────────────────────────────────────
# Maps English definition keywords → Vietnamese equivalents
$enToVi = @{
    # Nature & Elements
    "water"="nước"; "fire"="lửa"; "earth"="đất"; "wood"="gỗ, cây"; "metal"="kim loại"; "ice"="băng, nước đá"
    "mountain"="núi"; "river"="sông"; "lake"="hồ"; "sea"="biển"; "ocean"="đại dương"; "sky"="bầu trời"
    "sun"="mặt trời"; "moon"="mặt trăng"; "star"="ngôi sao"; "cloud"="mây"; "rain"="mưa"; "snow"="tuyết"
    "wind"="gió"; "storm"="bão"; "thunder"="sấm sét"; "lightning"="tia sét"; "fog"="sương mù"
    "stone"="đá"; "rock"="đá"; "sand"="cát"; "soil"="đất"; "mud"="bùn"; "dust"="bụi"; "ash"="tro"
    "grass"="cỏ"; "flower"="hoa"; "tree"="cây"; "forest"="rừng"; "bamboo"="tre"; "rice"="lúa"
    "leaf"="lá"; "root"="rễ"; "seed"="hạt"; "fruit"="quả"; "branch"="cành"
    # Animals
    "horse"="ngựa"; "ox"="trâu, bò"; "cow"="bò"; "pig"="lợn"; "sheep"="cừu"; "goat"="dê"
    "dog"="chó"; "cat"="mèo"; "rat"="chuột"; "rabbit"="thỏ"; "tiger"="hổ"; "dragon"="rồng"
    "snake"="rắn"; "monkey"="khỉ"; "bird"="chim"; "fish"="cá"; "insect"="côn trùng"; "deer"="hươu"
    "elephant"="voi"; "lion"="sư tử"; "bear"="gấu"; "fox"="cáo"; "wolf"="sói"; "eagle"="đại bàng"
    "crane"="hạc"; "duck"="vịt"; "chicken"="gà"; "rooster"="gà trống"; "sparrow"="chim sẻ"
    # Body
    "heart"="tim, tâm"; "mind"="tâm trí"; "soul"="linh hồn"; "spirit"="tinh thần"; "body"="thân thể"
    "head"="đầu"; "eye"="mắt"; "ear"="tai"; "nose"="mũi"; "mouth"="miệng"; "tongue"="lưỡi"
    "hand"="tay"; "foot"="chân"; "leg"="chân"; "arm"="cánh tay"; "finger"="ngón tay"; "toe"="ngón chân"
    "bone"="xương"; "blood"="máu"; "skin"="da"; "hair"="tóc"; "tooth"="răng"; "nail"="móng tay"
    "chest"="ngực"; "back"="lưng"; "stomach"="dạ dày, bụng"; "face"="mặt"; "neck"="cổ"
    "breath"="hơi thở"; "voice"="giọng nói"; "tears"="nước mắt"
    # People & Society
    "person"="người"; "people"="mọi người, dân"; "man"="đàn ông"; "woman"="phụ nữ"
    "child"="đứa trẻ"; "baby"="em bé"; "father"="cha"; "mother"="mẹ"; "son"="con trai"
    "daughter"="con gái"; "brother"="anh em"; "sister"="chị em"; "family"="gia đình"
    "king"="vua"; "emperor"="hoàng đế"; "official"="quan lại"; "soldier"="lính"; "slave"="nô lệ"
    "teacher"="thầy giáo"; "student"="học sinh"; "monk"="nhà sư"; "ghost"="ma quỷ"
    "friend"="bạn bè"; "enemy"="kẻ thù"; "lord"="chúa"; "master"="chủ, thầy"; "servant"="tôi tớ"
    # Actions
    "to walk"="đi bộ"; "to run"="chạy"; "to speak"="nói"; "to say"="nói, nói rằng"
    "to see"="nhìn, thấy"; "to hear"="nghe"; "to eat"="ăn"; "to drink"="uống"; "to sleep"="ngủ"
    "to work"="làm việc"; "to fight"="chiến đấu"; "to learn"="học"; "to write"="viết"; "to read"="đọc"
    "to give"="cho, tặng"; "to take"="lấy"; "to make"="làm, tạo ra"; "to go"="đi"; "to come"="đến"
    "to open"="mở"; "to close"="đóng"; "to stand"="đứng"; "to sit"="ngồi"; "to lie"="nằm"
    "to die"="chết"; "to live"="sống"; "to grow"="lớn, phát triển"; "to fall"="ngã, rơi xuống"
    "to rise"="dâng lên, đứng lên"; "to fly"="bay"; "to swim"="bơi"; "to climb"="leo"
    "to build"="xây dựng"; "to break"="phá vỡ"; "to carry"="mang, cõng"; "to cut"="cắt"
    "to pull"="kéo"; "to push"="đẩy"; "to hold"="cầm, giữ"; "to throw"="ném"
    "to enter"="vào"; "to exit"="ra"; "to return"="trở về"; "to stop"="dừng lại"
    "to begin"="bắt đầu"; "to end"="kết thúc"; "to change"="thay đổi"; "to use"="sử dụng"
    "to love"="yêu"; "to hate"="ghét"; "to fear"="sợ hãi"; "to hope"="hy vọng"
    "to think"="suy nghĩ"; "to know"="biết"; "to forget"="quên"; "to remember"="nhớ"
    "to send"="gửi"; "to receive"="nhận"; "to sell"="bán"; "to buy"="mua"; "to pay"="trả"
    "to obtain"="thu được, có được"; "to get"="được, có"; "to acquire"="thu được"; "to gain"="giành được"
    "to obey"="vâng lời, tuân theo"; "to follow"="theo sau, noi theo"
    # Adjectives / Qualities
    "big"="lớn"; "large"="to lớn"; "small"="nhỏ"; "little"="nhỏ bé"; "long"="dài"; "short"="ngắn"
    "tall"="cao"; "high"="cao"; "low"="thấp"; "wide"="rộng"; "narrow"="hẹp"; "deep"="sâu"
    "heavy"="nặng"; "light"="nhẹ, ánh sáng"; "hot"="nóng"; "cold"="lạnh"; "warm"="ấm"; "cool"="mát"
    "hard"="cứng"; "soft"="mềm"; "sharp"="sắc bén"; "round"="tròn"; "straight"="thẳng"
    "fast"="nhanh"; "slow"="chậm"; "old"="cũ, già"; "new"="mới"; "young"="trẻ"
    "good"="tốt"; "bad"="xấu"; "beautiful"="đẹp"; "ugly"="xấu xí"; "clean"="sạch"; "dirty"="bẩn"
    "strong"="mạnh mẽ"; "weak"="yếu"; "rich"="giàu"; "poor"="nghèo"; "full"="đầy"; "empty"="rỗng"
    "bright"="sáng"; "dark"="tối"; "clear"="rõ ràng"; "confused"="lộn xộn"; "quiet"="yên tĩnh"
    "loud"="ồn ào"; "ancient"="cổ xưa"; "sacred"="thiêng liêng"; "holy"="thánh thiện"
    "lucky"="may mắn"; "rare"="hiếm"; "strange"="lạ"; "secret"="bí mật"; "true"="thật"; "false"="giả"
    "alive"="còn sống"; "dead"="chết"; "wild"="hoang dã"; "tame"="thuần hóa"; "raw"="thô"
    "cooked"="nấu chín"; "sweet"="ngọt"; "bitter"="đắng"; "sour"="chua"; "salty"="mặn"; "spicy"="cay"
    # Places & Structures
    "house"="nhà"; "home"="ngôi nhà, gia đình"; "room"="phòng"; "door"="cửa"; "gate"="cổng"
    "wall"="tường"; "roof"="mái"; "floor"="sàn nhà"; "window"="cửa sổ"; "path"="đường mòn"
    "road"="con đường"; "bridge"="cầu"; "city"="thành phố"; "town"="thị trấn"; "village"="làng"
    "country"="đất nước"; "land"="đất đai"; "field"="cánh đồng"; "garden"="vườn"
    "temple"="đền thờ"; "palace"="cung điện"; "market"="chợ"; "shop"="cửa hàng"
    # Objects
    "sword"="kiếm"; "knife"="dao"; "bow"="cung"; "arrow"="mũi tên"; "shield"="lá chắn"; "spear"="giáo"
    "book"="sách"; "paper"="giấy"; "brush"="bút lông"; "ink"="mực"; "seal"="con dấu"
    "cloth"="vải"; "silk"="lụa"; "cotton"="bông"; "thread"="sợi chỉ"; "needle"="kim khâu"
    "pot"="nồi"; "cup"="chén, cốc"; "bowl"="bát"; "plate"="đĩa"; "box"="hộp"
    "rope"="dây thừng"; "net"="lưới"; "axe"="rìu"; "hammer"="búa"; "hook"="móc câu"
    "cart"="xe"; "boat"="thuyền"; "ship"="tàu"; "wheel"="bánh xe"
    "flag"="lá cờ"; "drum"="trống"; "flute"="sáo"; "bell"="chuông"; "coin"="đồng tiền"
    # Numbers, Time & Abstract
    "one"="một"; "two"="hai"; "three"="ba"; "four"="bốn"; "five"="năm"; "six"="sáu"
    "seven"="bảy"; "eight"="tám"; "nine"="chín"; "ten"="mười"; "hundred"="trăm"; "thousand"="nghìn"
    "day"="ngày"; "night"="đêm"; "morning"="buổi sáng"; "evening"="buổi tối"; "noon"="buổi trưa"
    "year"="năm"; "month"="tháng"; "week"="tuần"; "hour"="giờ"; "minute"="phút"
    "spring"="mùa xuân"; "summer"="mùa hè"; "autumn"="mùa thu"; "winter"="mùa đông"
    "past"="quá khứ"; "future"="tương lai"; "now"="hiện tại"; "early"="sớm"; "late"="muộn"
    "time"="thời gian"; "age"="tuổi, thời đại"; "period"="giai đoạn"; "moment"="khoảnh khắc"
    "heaven"="trời, thiên"; "earthly"="trần gian, thuộc đất"; "life"="cuộc sống, sinh mệnh"; "death"="cái chết"
    "beginning"="khởi đầu"; "end"="kết thúc"; "middle"="giữa"; "side"="bên cạnh"; "top"="đỉnh, trên"
    "bottom"="đáy, dưới"; "left"="trái"; "right"="phải"; "inside"="bên trong"; "outside"="bên ngoài"
    "front"="trước"; "behind"="phía sau"; "center"="trung tâm"; "edge"="mép, rìa"
    # Concepts
    "power"="quyền lực"; "strength"="sức mạnh"; "virtue"="đức hạnh"; "justice"="công lý"
    "truth"="sự thật"; "beauty"="vẻ đẹp"; "wisdom"="trí tuệ"; "knowledge"="kiến thức"
    "love"="tình yêu"; "hope"="hy vọng"; "faith"="niềm tin"; "peace"="hòa bình"; "war"="chiến tranh"
    "law"="luật pháp"; "rule"="quy tắc"; "order"="trật tự"; "chaos"="hỗn loạn"; "fate"="số phận"
    "luck"="may mắn"; "fortune"="vận may"; "wealth"="của cải"; "money"="tiền"
    "name"="tên"; "word"="từ, chữ"; "language"="ngôn ngữ"; "sound"="âm thanh"; "music"="âm nhạc"
    "color"="màu sắc"; "shape"="hình dạng"; "size"="kích thước"; "weight"="trọng lượng"
    "direction"="hướng"; "distance"="khoảng cách"; "speed"="tốc độ"; "heat"="nhiệt"
    "energy"="năng lượng"; "force"="lực"; "movement"="chuyển động"; "change"="sự thay đổi"
    "food"="thức ăn, đồ ăn"; "drink"="đồ uống"; "meat"="thịt"; "flesh"="thịt, da thịt"
    "grain"="ngũ cốc"; "bread"="bánh mì"; "salt"="muối"; "wine"="rượu"; "tea"="trà"
    "way"="con đường, cách"; "method"="phương pháp"
    "key"="chìa khóa"; "lock"="ổ khóa"
    "network"="mạng lưới"; "system"="hệ thống"; "pattern"="hoa văn, khuôn mẫu"
    "classic"="cổ điển"; "culture"="văn hóa"; "tradition"="truyền thống"
    "school"="trường học"; "lesson"="bài học"; "exam"="kỳ thi"; "reward"="phần thưởng"
    "punishment"="hình phạt"; "crime"="tội ác"; "court"="tòa án"; "magistrate"="quan tòa"
    "army"="quân đội"; "battle"="trận đánh"; "victory"="chiến thắng"; "defeat"="thất bại"
    "trade"="giao thương"; "merchant"="thương nhân"; "price"="giá cả"; "tax"="thuế"
    "letter"="thư, chữ cái"; "message"="tin nhắn"; "news"="tin tức"; "story"="câu chuyện"
    "dream"="giấc mơ"; "game"="trò chơi"; "art"="nghệ thuật"; "painting"="tranh vẽ"
    "ceremony"="lễ nghi"; "ritual"="nghi lễ"; "sacrifice"="sự hy sinh"; "prayer"="lời cầu nguyện"
    "medicine"="thuốc, y học"; "doctor"="bác sĩ"; "illness"="bệnh tật"; "disease"="bệnh"
    "cure"="chữa lành"; "poison"="chất độc"; "pain"="đau đớn"; "sorrow"="nỗi buồn"; "joy"="niềm vui"
    "anger"="cơn giận"; "fear"="nỗi sợ"; "surprise"="sự ngạc nhiên"; "shame"="sự xấu hổ"
    "pride"="niềm tự hào"; "envy"="sự ghen tị"; "greed"="lòng tham"; "kindness"="lòng tốt"
    "compound"="hợp chất"; "organic"="hữu cơ"; "variant"="biến thể"; "form"="hình thức, dạng"
    "type"="loại"; "kind"="loại, dạng"; "sort"="loại"; "class"="lớp, loại"
    "similar"="tương tự"; "different"="khác"; "same"="giống"; "original"="gốc, nguyên bản"
    "barren"="cằn cỗi, hoang vắng"; "uncultivated"="hoang dã, chưa khai phá"
    "pennant"="cờ hiệu"; "granary"="kho thóc, nhà kho"; "stockpile"="tích trữ"
    "savage"="man rợ"; "tribe"="bộ tộc"; "engrave"="khắc, chạm"; "contract"="hợp đồng"
    "torrential"="như thác lũ"; "gully"="rãnh, hố"; "pool"="vũng, bể"
    "bushy"="rậm rạp"; "kneeling"="quỳ gối"; "stamp"="con dấu"; "obey"="vâng lời"
    "season"="mùa, thời vụ"; "harvest"="thu hoạch"; "average"="bình quân"; "equivalent"="tương đương"
}

# Function to translate an English definition to Vietnamese
function Translate-ToVietnamese([string]$def) {
    if ([string]::IsNullOrWhiteSpace($def)) { return "" }
    
    # Direct lookup of full definition
    $lower = $def.ToLower().Trim()
    if ($enToVi.ContainsKey($lower)) { return $enToVi[$lower] }
    
    # Split by semicolon or comma and translate each part
    $parts = $def -split '[;,]' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
    $translated = [System.Collections.Generic.List[string]]::new()
    
    foreach ($part in $parts) {
        $p = $part.Trim().ToLower()
        # Remove "to " prefix for verbs
        $pNoTo = $p -replace '^to ', ''
        
        if ($enToVi.ContainsKey($p)) {
            $translated.Add($enToVi[$p])
        } elseif ($enToVi.ContainsKey($pNoTo)) {
            $translated.Add($enToVi[$pNoTo])
        } elseif ($p -match 'old form of|variant of|ancient form of') {
            # e.g. "old form of 隱" → "Dạng cổ của 隱"
            $charMatch = [regex]::Match($part, '[\x4E00-\x9FFF\x3400-\x4DBF]')
            if ($charMatch.Success) { $translated.Add("Dạng cổ/biến thể của $($charMatch.Value)") }
            else { $translated.Add($part) }
        } else {
            # Try word-by-word
            $words = $p -split '\s+'
            $found = $false
            foreach ($word in $words) {
                if ($enToVi.ContainsKey($word)) {
                    $translated.Add($enToVi[$word])
                    $found = $true
                    break
                }
            }
            if (-not $found) { $translated.Add($part) } # Keep original if no translation found
        }
    }
    
    if ($translated.Count -gt 0) {
        return ($translated | Select-Object -Unique) -join ", "
    }
    return $def
}


# ── Complete 214 KangXi Radicals + Variants Table (100% Standard Vietnamese) ─
$radicalSVNames = @{
  "一"="Nhất"; "丨"="Cổn"; "丶"="Chủ"; "丿"="Phiệt"; "乙"="Ất"; "亅"="Quyết";
  "二"="Nhị"; "亠"="Đầu"; "人"="Nhân"; "亻"="Nhân đứng"; "儿"="Nhi"; "入"="Nhập";
  "八"="Bát"; "冂"="Quynh"; "冖"="Mịch"; "冫"="Băng"; "几"="Kỷ"; "凵"="Khảm";
  "刀"="Đao"; "刂"="Đao đứng"; "力"="Lực"; "勹"="Bao"; "匕"="Chủy"; "匚"="Phương";
  "匸"="Hệ"; "十"="Thập"; "卜"="Bốc"; "卩"="Tiết"; "厂"="Hán"; "厶"="Khứ";
  "又"="Hựu"; "口"="Khẩu"; "囗"="Vi"; "土"="Thổ"; "士"="Sĩ"; "夂"="Trĩ";
  "夊"="Tuy"; "夕"="Tịch"; "大"="Đại"; "女"="Nữ"; "子"="Tử"; "宀"="Miên";
  "寸"="Thốn"; "小"="Tiểu"; "尢"="Uông"; "尸"="Thi"; "屮"="Triệt"; "山"="Sơn";
  "巛"="Xuyên"; "工"="Công"; "己"="Kỷ"; "巾"="Cân"; "干"="Can"; "幺"="Yêu";
  "广"="Quảng"; "廴"="Dẫn"; "廾"="Củng"; "弋"="Dặc"; "弓"="Cung"; "彐"="Kế";
  "彡"="Tam"; "彳"="Xích"; "心"="Tâm"; "忄"="Tâm đứng"; "戈"="Qua"; "戶"="Hộ";
  "户"="Hộ"; "手"="Thủ"; "扌"="Thủ"; "支"="Chi"; "攴"="Phộc"; "攵"="Phộc";
  "文"="Văn"; "斗"="Đẩu"; "斤"="Cân"; "方"="Phương"; "无"="Vô"; "日"="Nhật";
  "曰"="Viết"; "月"="Nguyệt"; "木"="Mộc"; "欠"="Khiếm"; "止"="Chỉ"; "歹"="Đãi";
  "殳"="Thù"; "毋"="Vô"; "比"="Tỉ"; "毛"="Mao"; "氏"="Thị"; "气"="Khí";
  "水"="Thủy"; "氵"="Tam điểm thủy"; "火"="Hỏa"; "灬"="Tứ điểm hỏa"; "爪"="Trảo";
  "父"="Phụ"; "爻"="Hào"; "爿"="Tường"; "片"="Phiến"; "牙"="Nha"; "牛"="Ngưu";
  "牜"="Ngưu"; "犬"="Khuyển"; "犭"="Khuyển"; "玄"="Huyền"; "玉"="Ngọc"; "王"="Vương";
  "瓜"="Qua"; "瓦"="Ngõa"; "甘"="Cam"; "生"="Sinh"; "用"="Dụng"; "田"="Điền";
  "疋"="Sơ"; "疒"="Nạch"; "癶"="Bát"; "白"="Bạch"; "皮"="Bì"; "皿"="Mãnh";
  "目"="Mục"; "矛"="Mâu"; "矢"="Thỉ"; "石"="Thạch"; "示"="Thị"; "礻"="Thị";
  "禸"="Nhựu"; "禾"="Hòa"; "穴"="Huyệt"; "立"="Lập"; "竹"="Trúc"; "⺮"="Trúc";
  "米"="Mễ"; "糸"="Mịch"; "纟"="Mịch"; "缶"="Phẫu"; "网"="Võng"; "罒"="Võng";
  "羊"="Dương"; "羽"="Vũ"; "老"="Lão"; "耂"="Lão"; "而"="Nhi"; "耒"="Lỗi";
  "耳"="Nhĩ"; "聿"="Duật"; "肉"="Nhục"; "⺼"="Nhục"; "臣"="Thần"; "自"="Tự";
  "至"="Chí"; "臼"="Cữu"; "舌"="Thiệt"; "舛"="Suyễn"; "舟"="Chu"; "艮"="Cấn";
  "色"="Sắc"; "艸"="Thảo"; "艹"="Thảo"; "虍"="Hô"; "虫"="Trùng"; "血"="Huyết";
  "行"="Hành"; "衣"="Y"; "衤"="Y"; "襾"="Á"; "見"="Kiến"; "见"="Kiến";
  "角"="Giác"; "言"="Ngôn"; "讠"="Ngôn"; "谷"="Cốc"; "豆"="Đậu"; "豕"="Thỉ";
  "豸"="Trĩ"; "貝"="Bối"; "贝"="Bối"; "赤"="Xích"; "走"="Tẩu"; "足"="Túc";
  "身"="Thân"; "車"="Xa"; "车"="Xa"; "辛"="Tân"; "辰"="Thần";
  "辵"="Sước"; "辶"="Sước"; "邑"="Ấp"; "阝"="Phụ / Ấp"; "酉"="Dậu"; "釆"="Biện";
  "里"="Lý"; "金"="Kim"; "钅"="Kim"; "長"="Trường"; "长"="Trường"; "門"="Môn";
  "门"="Môn"; "阜"="Phụ"; "隹"="Chuy"; "雨"="Vũ"; "青"="Thanh"; "非"="Phi";
  "面"="Diện"; "革"="Cách"; "韋"="Vi"; "韦"="Vi"; "韭"="Cửu"; "音"="Âm";
  "頁"="Hiệt"; "页"="Hiệt"; "風"="Phong"; "风"="Phong"; "飛"="Phi"; "飞"="Phi";
  "食"="Thực"; "饣"="Thực"; "首"="Thủ"; "香"="Hương"; "馬"="Mã"; "马"="Mã";
  "骨"="Cốt"; "高"="Cao"; "髟"="Bưu"; "鬥"="Đấu"; "鬯"="Sưởng"; "鬲"="Cách";
  "鬼"="Quỷ"; "魚"="Ngư"; "鱼"="Ngư"; "鳥"="Điểu"; "鸟"="Điểu"; "鹵"="Lỗ";
  "鹿"="Lộc"; "麥"="Mạch"; "麦"="Mạch"; "麻"="Ma"; "黃"="Hoàng"; "黄"="Hoàng";
  "黍"="Thử"; "黒"="Hắc"; "黑"="Hắc"; "黹"="Chỉ"; "黽"="Mãnh"; "黾"="Mãnh";
  "鼎"="Đỉnh"; "鼓"="Cổ"; "鼠"="Thử"; "鼻"="Tị"; "齊"="Tề"; "齐"="Tề";
  "齒"="Xỉ"; "齿"="Xỉ"; "龍"="Long"; "龙"="Long"; "龜"="Quy"; "龟"="Quy";
  "龠"="Dược";
  # Supplemental foundational characters
  "从"="Tùng"; "林"="Lâm"; "古"="Cổ"; "众"="Chúng"; "森"="Sâm";
  "品"="Phẩm"; "晶"="Tinh"; "淼"="Diểu"; "焱"="Diễm"; "磊"="Lỗi";
  "垚"="Nghiêu"; "犇"="Bôn"; "奸"="Gian"; "姦"="Gian tà"; "休"="Hưu";
  "明"="Minh"; "湖"="Hồ"; "这"="Giá (Đây)"; "包"="Bao"; "起"="Khởi";
  "问"="Vấn"; "闪"="Thiểm"; "间"="Gian"; "国"="Quốc"; "病"="Bệnh";
  "安"="An"; "字"="Tự"; "好"="Hảo"; "妈"="Mã (Mẹ)"; "爸"="Ba"
}

# Meaning dictionary for radicals
$radicalMeanings = @{
  "一"="Số một, khởi đầu"; "丨"="Nét sổ thẳng đứng"; "丶"="Dấu chấm"; "丿"="Nét phẩy chéo"; "乙"="Vị trí thứ hai Can"; "亅"="Nét móc";
  "二"="Số hai, đôi lứa"; "亠"="Dấu đầu chữ"; "人"="Con người"; "亻"="Người đang đứng"; "儿"="Trẻ nhỏ, người"; "入"="Đi vào, nhập";
  "八"="Số tám, chia ra"; "冂"="Vùng biên giới xa"; "冖"="Khăn trùm đầu"; "冫"="Băng tuyết lạnh"; "几"="Cái ghế, cái bàn nhỏ"; "凵"="Hố sâu, đồ đựng";
  "刀"="Con dao, vũ khí"; "刂"="Thanh đao dựng đứng"; "力"="Sức lực, bắp tay"; "勹"="Cái bao, bọc lại"; "匕"="Cái thìa, dao găm"; "匚"="Khay đựng, đồ vuông";
  "匸"="Nơi cất giấu kín"; "十"="Số mười, hoàn hảo"; "卜"="Quẻ bói toán"; "卩"="Đốt tre, con dấu"; "厂"="Vách đá sườn núi"; "厶"="Riêng tư, bản thân";
  "又"="Bàn tay phải, lại nữa"; "口"="Miệng, lời nói"; "囗"="Bao bọc bốn bề"; "土"="Đất đai, thổ nhưỡng"; "士"="Kẻ sĩ, quan lại"; "夂"="Bước đi chậm";
  "夊"="Đi theo sau"; "夕"="Buổi chiều tối"; "大"="To lớn, người dang tay"; "女"="Phụ nữ, con gái"; "子"="Đứa trẻ sơ sinh"; "宀"="Mái nhà che chở";
  "寸"="Đơn vị đo, tấc gang"; "小"="Nhỏ bé, ít ỏi"; "尢"="Chân yếu, què"; "尸"="Thể xác, người nằm"; "屮"="Mầm cây non"; "山"="Núi non trùng điệp";
  "巛"="Dòng sông uốn lượn"; "工"="Người thợ, công việc"; "己"="Bản thân mình"; "巾"="Khăn lau, vải"; "干"="Can thiệp, cái khiên"; "幺"="Nhỏ bé, sợi tơ nhỏ";
  "广"="Ngôi nhà bên sườn núi"; "廴"="Bước dài, dẫn đường"; "廾"="Hai tay nâng đồ"; "弋"="Cọc gỗ, mũi tên"; "弓"="Cây cung bắn tên"; "彐"="Đầu con nhím";
  "彡"="Lông dài, nét vẽ"; "彳"="Bước chân trái, đường đi"; "心"="Trái tim, tâm trí"; "忄"="Tâm tư, cảm xúc đứng"; "戈"="Cái mác đánh trận"; "戶"="Cánh cửa một cánh";
  "户"="Cánh cửa nhà"; "手"="Bàn tay con người"; "扌"="Hành động bằng tay"; "支"="Cành cây, chống đỡ"; "攴"="Cầm roi đánh"; "攵"="Hành động, đánh khẽ";
  "文"="Văn hóa, chữ viết"; "斗"="Cái đấu đong gạo"; "斤"="Cái rìu đốn cây"; "方"="Phương hướng, vuông vức"; "无"="Không có, hư vô"; "日"="Mặt trời, ban ngày";
  "曰"="Nói rằng, phát ngôn"; "月"="Mặt trăng, tháng, thịt"; "木"="Cây cối, gỗ rừng"; "欠"="Ngáp, thiếu thốn"; "止"="Dừng lại, bàn chân"; "歹"="Xương tàn, chết chóc";
  "殳"="Binh khí cán dài"; "毋"="Chớ, đừng, mẹ"; "比"="So sánh, gần nhau"; "毛"="Lông mao động vật"; "氏"="Dòng họ, thị tộc"; "气"="Hơi thở, không khí";
  "水"="Nước, chất lỏng"; "氵"="Ba giọt nước chảy"; "火"="Ngọn lửa bốc cháy"; "灬"="Bốn đốm lửa than"; "爪"="Móng vuốt muông thú"; "父"="Người cha, trưởng bối";
  "爻"="Quẻ dịch, giao nhau"; "爿"="Mảnh gỗ xẻ dọc"; "片"="Phiến gỗ mỏng"; "牙"="Răng nanh thú"; "牛"="Con trâu, con bò"; "牜"="Bộ trâu bò đứng";
  "犬"="Con chó giữ nhà"; "犭"="Muông thú hoang dã"; "玄"="Huyền bí, màu đen sâu"; "玉"="Viên ngọc quý"; "王"="Vua, quyền lực"; "瓜"="Quả dưa, bầu bí";
  "瓦"="Ngói nung lợp nhà"; "甘"="Ngọt ngào, ngon ngọt"; "生"="Sinh sôi, sống"; "用"="Sử dụng, dùng đến"; "田"="Ruộng đồng cày cấy"; "疋"="Chân đi, cuộn vải";
  "疒"="Bệnh tật ốm đau"; "癶"="Hai chân giẫm lên"; "白"="Màu trắng, sáng sủa"; "皮"="Da dẻ động vật"; "皿"="Bát đĩa đựng đồ ăn"; "目"="Mắt nhìn, thị giác";
  "矛"="Ngọn giáo dài"; "矢"="Mũi tên nhọn"; "石"="Hòn đá, tảng đá"; "示"="Thần linh mách bảo"; "礻"="Thờ cúng tổ tiên"; "禸"="Vết chân thú";
  "禾"="Cây lúa trĩu bông"; "穴"="Hang đá, hầm trú"; "立"="Đứng thẳng hiên ngang"; "竹"="Cây tre, cây trúc"; "⺮"="Đồ dùng bằng tre trúc"; "米"="Hạt gạo, ngũ cốc";
  "糸"="Sợi tơ lụa dài"; "纟"="Dây tơ, ràng buộc"; "缶"="Đồ gốm sành miệng nhỏ"; "网"="Lưới bắt cá chim"; "罒"="Lưới giăng"; "羊"="Con dê hiền lành";
  "羽"="Lông vũ cánh chim"; "老"="Người già tóc bạc"; "耂"="Người cao tuổi"; "而"="Râu cằm, mà lại"; "耒"="Cái cày bừa đất"; "耳"="Tai lắng nghe";
  "聿"="Cây bút lông viết"; "肉"="Thịt nạc động vật"; "⺼"="Cơ bắp, phủ tạng"; "臣"="Bầy tôi trung thành"; "自"="Tự mình, cái mũi"; "至"="Đến nơi, cùng cực";
  "臼"="Cái cối giã gạo"; "舌"="Cái lưỡi nếm vị"; "舛"="Sai lệch, đối ngược"; "舟"="Chiếc thuyền vượt sông"; "艮"="Quẻ Cấn, cứng cỏi"; "色"="Màu sắc, nhan sắc";
  "艸"="Cỏ cây hoa lá"; "艹"="Thảo mộc, cỏ cây"; "虍"="Vằn hổ dũng mãnh"; "虫"="Côn trùng, sâu bọ"; "血"="Máu đỏ sinh mệnh"; "行"="Đi lại, ngã tư";
  "衣"="Quần áo che thân"; "衤"="Trang phục mặc"; "襾"="Che đậy lên trên"; "見"="Trông thấy, diện kiến"; "见"="Nhìn thấy, kiến thức"; "角"="Sừng thú nhọn";
  "言"="Lời nói, ngôn ngữ"; "讠"="Lời nói, ngôn từ"; "谷"="Thung lũng sâu"; "豆"="Hạt đậu, bát cúng"; "豕"="Con lợn, con heo"; "豸"="Thú săn không sừng";
  "貝"="Vỏ sò, tiền bạc xưa"; "贝"="Tiền tài của cải"; "赤"="Màu đỏ son"; "走"="Chạy nhanh, đi"; "足"="Bàn chân bước"; "身"="Thân thể con người";
  "車"="Xe cộ kéo đi"; "车"="Phương tiện xe cộ"; "辛"="Vị cay đắng, khổ cực"; "辰"="Giờ Thìn, sớm mai"; "辵"="Bước đi rồi dừng"; "辶"="Đường đi, bước đi";
  "邑"="Vùng đất thành thị"; "阝"="Đất đai (phải) / Gò đất (trái)"; "酉"="Hũ rượu lên men"; "釆"="Phân biệt dấu vết"; "里"="Làng mạc, dặm đường"; "金"="Kim loại, vàng bạc";
  "钅"="Đồ bằng kim loại"; "長"="Dài lâu, trường cửu"; "长"="Dài, lớn lên"; "門"="Cánh cửa lớn hai cánh"; "门"="Cửa ngõ ra vào"; "阜"="Gò đất cao";
  "隹"="Con chim đuôi ngắn"; "雨"="Cơn mưa từ trời rơi"; "青"="Màu xanh lục biếc"; "非"="Sai trái, phi lý"; "面"="Khuôn mặt, bề mặt"; "革"="Da thú thuộc";
  "韋"="Da thuộc mềm"; "韦"="Dây da dẻo"; "韭"="Rau hẹ thơm"; "音"="Âm thanh, tiếng nhạc"; "頁"="Trang giấy, đầu người"; "页"="Trang sách, đầu";
  "風"="Cơn gió thổi"; "风"="Ngọn gió"; "飛"="Bay lượn trên không"; "飞"="Bay bổng"; "食"="Đồ ăn thức uống"; "饣"="Ăn uống, ẩm thực";
  "首"="Cái đầu, người đứng đầu"; "香"="Mùi hương thơm ngát"; "馬"="Con ngựa phi nhanh"; "马"="Con ngựa"; "骨"="Xương cốt nâng đỡ"; "高"="Cao lớn sừng sững";
  "髟"="Tóc dài bồng bềnh"; "鬥"="Đánh nhau, tranh đấu"; "鬯"="Rượu nghệ cúng thần"; "鬲"="Nồi đồng ba chân"; "鬼"="Hồn ma, quỷ thần"; "魚"="Con cá bơi lội";
  "鱼"="Loài cá"; "鳥"="Con chim đuôi dài"; "鸟"="Loài chim"; "鹵"="Đất mặn, muối khoáng"; "鹿"="Con hươu sao hiền lành"; "麥"="Cây lúa mạch";
  "麦"="Lúa mạch"; "麻"="Cây gai dệt vải"; "黃"="Màu vàng rực rỡ"; "黄"="Sắc vàng"; "黍"="Cây kê dính"; "黒"="Màu đen tuyền";
  "黑"="Sắc đen"; "黹"="Thêu may gấm vóc"; "黽"="Con ếch, con cóc"; "黾"="Ếch nhái"; "鼎"="Cái vạc ba chân quyền lực"; "鼓"="Cái trống da";
  "鼠"="Con chuột nhanh nhẹn"; "鼻"="Cái mũi ngửi hương"; "齊"="Đều đặn, tề chỉnh"; "齐"="Ngay ngắn, bằng phẳng"; "齒"="Hàm răng chắc khỏe"; "齿"="Răng";
  "龍"="Con rồng dũng mãnh"; "龙"="Rồng thiêng"; "龜"="Con rùa trường thọ"; "龟"="Rùa biển"; "龠"="Ống sáo ba lỗ cổ"
}

$idsMap = @{
    [char]0x2FF0 = @{ layout = "LEFT_RIGHT";          name = "Trái — Phải (⿰)";                         arity = 2 }
    [char]0x2FF1 = @{ layout = "TOP_BOTTOM";           name = "Trên — Dưới (⿱)";                         arity = 2 }
    [char]0x2FF2 = @{ layout = "THREE_PART_H";         name = "Ba phần ngang (Left + Middle + Right)";     arity = 3 }
    [char]0x2FF3 = @{ layout = "THREE_PART_V";         name = "Ba phần dọc (Top + Middle + Bottom)";       arity = 3 }
    [char]0x2FF4 = @{ layout = "SURROUND";             name = "Bao bọc toàn phần (⿴)";                   arity = 2 }
    [char]0x2FF5 = @{ layout = "SURROUND_TOP";         name = "Bao bọc trên & 2 bên (⿵)";               arity = 2 }
    [char]0x2FF6 = @{ layout = "SURROUND_BOTTOM";      name = "Bao bọc dưới hở trên (⿶)";               arity = 2 }
    [char]0x2FF7 = @{ layout = "SURROUND_LEFT";        name = "Bao bọc bên trái hở phải (⿷)";            arity = 2 }
    [char]0x2FF8 = @{ layout = "SURROUND_TOPLEFT";     name = "Nửa bao góc trên-trái (⿸)";              arity = 2 }
    [char]0x2FF9 = @{ layout = "SURROUND_TOPRIGHT";    name = "Nửa bao góc trên-phải (⿹)";              arity = 2 }
    [char]0x2FFA = @{ layout = "SURROUND_BOTTOMLEFT";  name = "Nửa bao góc dưới-trái (⿺)";              arity = 2 }
    [char]0x2FFB = @{ layout = "OVERLAID";             name = "Giao nhau / Chồng lớp (⿻)";               arity = 2 }
}

$componentsDict = [System.Collections.Generic.Dictionary[string, object]]::new()
$recipesMap = [System.Collections.Generic.Dictionary[string, object]]::new()
$charactersDb = [System.Collections.Generic.Dictionary[string, object]]::new()


# ── Official KangXi 214 Radical Stroke Counts (standard reference) ─────────
$kangXiStrokeCount = @{
  # 1 stroke
  "一"=1; "丨"=1; "丶"=1; "丿"=1; "乙"=1; "亅"=1;
  # 2 strokes
  "二"=2; "亠"=2; "人"=2; "亻"=2; "儿"=2; "入"=2; "八"=2; "冂"=2; "冖"=2; "冫"=2;
  "几"=2; "凵"=2; "刀"=2; "刂"=2; "力"=2; "勹"=2; "匕"=2; "匚"=2; "匸"=2; "十"=2;
  "卜"=2; "卩"=2; "厂"=2; "厶"=2; "又"=2;
  # 3 strokes
  "口"=3; "囗"=3; "土"=3; "士"=3; "夂"=3; "夊"=3; "夕"=3; "大"=3; "女"=3; "子"=3;
  "宀"=3; "寸"=3; "小"=3; "尢"=3; "尸"=3; "屮"=3; "山"=3; "巛"=3; "工"=3; "己"=3;
  "巾"=3; "干"=3; "幺"=3; "广"=3; "廴"=3; "廾"=3; "弋"=3; "弓"=3; "彐"=3; "彡"=3;
  "彳"=3; "心"=3; "忄"=3; "戈"=3; "戶"=3; "户"=3; "手"=3; "扌"=3; "支"=3; "攴"=3;
  "攵"=3; "飞"=3; "饣"=3; "纟"=3; "犭"=3; "艹"=3; "氵"=3; "讠"=3; "阝"=3; "门"=3;
  # 4 strokes
  "文"=4; "斗"=4; "斤"=4; "方"=4; "无"=4; "日"=4; "曰"=4; "月"=4; "木"=4; "欠"=4;
  "止"=4; "歹"=4; "殳"=4; "毋"=4; "比"=4; "毛"=4; "氏"=4; "气"=4; "水"=4; "火"=4;
  "灬"=4; "爪"=4; "父"=4; "爻"=4; "爿"=4; "片"=4; "牙"=4; "牛"=4; "牜"=4; "犬"=4;
  "玄"=4; "玉"=4; "王"=4; "瓜"=4; "瓦"=4; "甘"=4; "生"=4; "用"=4; "田"=4; "疋"=4;
  "疒"=4; "癶"=4; "白"=4; "皮"=4; "皿"=4; "目"=4; "矛"=4; "矢"=4; "石"=4; "示"=4;
  "礻"=4; "禸"=4; "禾"=4; "穴"=4; "立"=4; "见"=4; "贝"=4; "车"=4; "长"=4; "风"=4;
  "钅"=4; "韦"=4; "马"=4; "⺼"=4;
  # 5 strokes
  "竹"=6; "⺮"=6; "米"=6; "糸"=6; "缶"=6; "网"=6; "罒"=6; "羊"=6; "羽"=6; "老"=6;
  "耂"=6; "而"=6; "耒"=6; "耳"=6; "聿"=6; "肉"=6; "臣"=6; "自"=6; "至"=6; "臼"=6;
  "舌"=6; "舛"=6; "舟"=6; "艮"=6; "色"=6; "艸"=6; "虍"=6; "虫"=6; "血"=6; "行"=6;
  "衣"=6; "衤"=6; "襾"=6;
  # 7 strokes
  "見"=7; "角"=7; "言"=7; "谷"=7; "豆"=7; "豕"=7; "豸"=7; "貝"=7;
  "赤"=7; "走"=7; "足"=7; "身"=7; "車"=7; "辛"=7; "辰"=7; "辵"=7; "辶"=7; "邑"=7;
  "酉"=7; "釆"=7; "里"=7;
  # 8 strokes
  "金"=8; "長"=8; "門"=8; "阜"=8; "隹"=8; "雨"=8; "青"=8; "非"=8; "革"=8;
  # 9 strokes
  "面"=9; "韋"=9; "韭"=9; "音"=9; "頁"=9; "飛"=9; "食"=9; "首"=9; "香"=9;
  "骨"=9; "鬼"=9;
  # 10 strokes
  "馬"=10; "髟"=10; "高"=10; "鬥"=10; "鬯"=10; "鬲"=10;
  # 11+ strokes
  "魚"=11; "鳥"=11; "麻"=11; "鹿"=11; "麥"=11; "黃"=11; "黄"=11; "鹵"=11;
  "黑"=12; "黍"=12; "黹"=12; "鼎"=12;
  "鼓"=13; "鼠"=13; "黽"=13;
  "齊"=14; "鼻"=14;
  "齒"=15;
  "龍"=16;
  "龠"=17;
  "龜"=18;
  # Supplemental foundational chars — correct real stroke counts
  "从"=4; "林"=8; "古"=5; "众"=6; "森"=12;
  "品"=9; "晶"=12; "淼"=12; "焱"=12; "磊"=15;
  "垚"=9; "犇"=12; "黒"=11; "奸"=6; "姦"=9; "休"=6;
  "明"=8; "湖"=12; "这"=7; "包"=5; "起"=10;
  "问"=6; "闪"=5; "间"=7; "国"=8; "病"=10;
  "安"=6; "字"=6; "好"=6; "妈"=6; "爸"=8;
}

# Initialize with all radicals + correct stroke counts
foreach ($kv in $radicalSVNames.GetEnumerator()) {
    $svMeaning = if ($radicalMeanings.ContainsKey($kv.Key)) { $radicalMeanings[$kv.Key] } else { $kv.Value }
    $strokes = if ($kangXiStrokeCount.ContainsKey($kv.Key)) { $kangXiStrokeCount[$kv.Key] } else { 1 }
    # Only mark as is_radical=true for the 214 standard KangXi set (not supplemental chars)
    $isStdRadical = -not @("从","林","古","众","森","品","晶","淼","焱","磊","垚","犇","黒","奸","姦","休","明","湖","这","包","起","问","闪","间","国","病","安","字","好","妈","爸").Contains($kv.Key)
    $componentsDict[$kv.Key] = [ordered]@{
        character   = $kv.Key
        name        = $kv.Value
        pinyin      = ""
        meaning     = $svMeaning
        stroke_count = $strokes
        is_radical  = $isStdRadical
    }
}


function Register-Recipe($key, $char, $pinyin, $def, $layout, $layoutName, $parts, $etym, $svName) {
    $vnName = if ($svName) { $svName } elseif ($radicalSVNames.ContainsKey($char)) { $radicalSVNames[$char] } elseif ($unihanDict.ContainsKey($char)) { $unihanDict[$char] } else { $char }
    
    $recipesMap[$key] = [ordered]@{
        character = $char
        sino_vietnamese = $vnName
        pinyin = $pinyin
        meaning = $def
        layout = $layout
        layout_name = $layoutName
        parts = $parts
        mnemonic = if ($etym) { $etym } else { "Chữ「$char」[$vnName] được tạo bởi: [ $($parts -join ' + ') ]" }
    }
}

Write-Host "2. Processing $InputPath ..." -ForegroundColor Cyan
$lines = [System.IO.File]::ReadAllLines($InputPath, [System.Text.Encoding]::UTF8)
$processed = 0

foreach ($line in $lines) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    try {
        $item = $line | ConvertFrom-Json
        $char = $item.character
        if (-not $char) { continue }
        $processed++

        $pinyin = ""
        if ($item.pinyin) {
            if ($item.pinyin -is [System.Array]) {
                $pinyin = $item.pinyin -join ", "
            } else {
                $pinyin = "$($item.pinyin)"
            }
        }
        $defRaw = if ($item.definition) { "$($item.definition)" } else { "" }
        # Priority: 1. CVDICT proper Vietnamese def, 2. Keyword translation fallback
        if ($viDefDict.ContainsKey($char)) {
            $def = $viDefDict[$char]
        } else {
            $def = Translate-ToVietnamese $defRaw
        }

        $etym = ""
        if ($item.etymology) {
            if ($item.etymology.hint) { $etym = "$($item.etymology.hint)" }
            elseif ($item.etymology.type) { $etym = "$($item.etymology.type)" }
        }

        $strokeCount = if ($item.matches) { $item.matches.Count } else { 1 }

        # Resolve Sino-Vietnamese reading
        $sv = ""
        if ($radicalSVNames.ContainsKey($char)) {
            $sv = $radicalSVNames[$char]
        } elseif ($unihanDict.ContainsKey($char)) {
            $sv = $unihanDict[$char]
        }

        # Character DB entry
        $charactersDb[$char] = [ordered]@{
            character = $char
            sino_vietnamese = $sv
            pinyin = $pinyin
            meaning = $def
            meaning_en = $defRaw
            radical = if ($item.radical) { "$($item.radical)" } else { "" }
            stroke_count = $strokeCount
            mnemonic = if ($etym) { $etym } elseif ($sv) { ("Chữ「" + $char + "」 âm Hán Việt: 「" + $sv + "」" + $(if ($def) { " — " + $def } else { "" })) } else { "Chữ「" + $char + "」: " + $def }
            decomposition = if ($item.decomposition) { "$($item.decomposition)" } else { "" }
            compounds = if ($cvCompounds.ContainsKey($char)) { $cvCompounds[$char] } else { @() }
        }


        # Update component if registered
        if ($componentsDict.ContainsKey($char)) {
            $componentsDict[$char].pinyin = $pinyin
            $componentsDict[$char].stroke_count = $strokeCount
            if ($sv -and -not $componentsDict[$char].name) {
                $componentsDict[$char].name = $sv
            }
        }

        # Check crafting decomposition
        $decompStr = if ($item.decomposition) { "$($item.decomposition)".Trim() } else { "" }
        if ($decompStr.Length -ge 3) {
            $firstOp = $decompStr[0]

            # ── 1. Tri-Character Pyramid Layout (品字结构: e.g. 众, 森, 品)
            if ($decompStr.Length -ge 5 -and $firstOp -eq [char]0x2FF1 -and $decompStr[2] -eq [char]0x2FF0) {
                $partA = "$($decompStr[1])"
                $partB = "$($decompStr[3])"
                $partC = "$($decompStr[4])"

                $triKey = "TRIANGLE_PYRAMID:$partA+$partB+$partC"
                Register-Recipe $triKey $char $pinyin $def "TRIANGLE_PYRAMID" "Kim tự tháp / Phẩm tự (品)" @($partA, $partB, $partC) $etym $sv

                # 2-step compound
                if ($partB -eq $partC) {
                    $subCompound = ""
                    if ($partB -eq "人") { $subCompound = "从" }
                    elseif ($partB -eq "木") { $subCompound = "林" }
                    elseif ($partB -eq "火") { $subCompound = "炎" }
                    elseif ($partB -eq "日") { $subCompound = "昌" }

                    if ($subCompound) {
                        $tbKey = "TOP_BOTTOM:$partA+$subCompound"
                        Register-Recipe $tbKey $char $pinyin $def "TOP_BOTTOM" "Trên — Dưới (⿱)" @($partA, $subCompound) $etym $sv
                    }
                }
            }

            # ── 2. Three-Part Horizontal (⿲ A B C)
            elseif ($decompStr.Length -ge 4 -and $firstOp -eq [char]0x2FF2) {
                $p1 = "$($decompStr[1])"
                $p2 = "$($decompStr[2])"
                $p3 = "$($decompStr[3])"
                if (-not $idsMap.ContainsKey($p1[0]) -and -not $idsMap.ContainsKey($p2[0]) -and -not $idsMap.ContainsKey($p3[0])) {
                    if ($p1 -ne '？' -and $p2 -ne '？' -and $p3 -ne '？') {
                        $key = "THREE_PART_H:$p1+$p2+$p3"
                        Register-Recipe $key $char $pinyin $def "THREE_PART_H" "Ba phần ngang (Left + Middle + Right)" @($p1, $p2, $p3) $etym $sv
                    }
                }
            }

            # ── 3. Three-Part Vertical (⿳ A B C)
            elseif ($decompStr.Length -ge 4 -and $firstOp -eq [char]0x2FF3) {
                $p1 = "$($decompStr[1])"
                $p2 = "$($decompStr[2])"
                $p3 = "$($decompStr[3])"
                if (-not $idsMap.ContainsKey($p1[0]) -and -not $idsMap.ContainsKey($p2[0]) -and -not $idsMap.ContainsKey($p3[0])) {
                    if ($p1 -ne '？' -and $p2 -ne '？' -and $p3 -ne '？') {
                        $key = "THREE_PART_V:$p1+$p2+$p3"
                        Register-Recipe $key $char $pinyin $def "THREE_PART_V" "Ba phần dọc (Top + Middle + Bottom)" @($p1, $p2, $p3) $etym $sv
                    }
                }
            }

            # ── 4. Surround Bottom-Left (⿺)
            elseif ($decompStr.Length -ge 3 -and $firstOp -eq [char]0x2FFA) {
                $outer = "$($decompStr[1])"
                $inner = "$($decompStr[2])"
                if (-not $idsMap.ContainsKey($outer[0]) -and -not $idsMap.ContainsKey($inner[0])) {
                    if ($outer -ne '？' -and $inner -ne '？') {
                        $key = "SURROUND_BOTTOMLEFT:$outer+$inner"
                        Register-Recipe $key $char $pinyin $def "SURROUND_BOTTOMLEFT" "Nửa bao góc dưới-trái (⿺)" @($outer, $inner) $etym $sv
                    }
                }
            }

            # ── 5. Surround Top-Right (⿹)
            elseif ($decompStr.Length -ge 3 -and $firstOp -eq [char]0x2FF9) {
                $outer = "$($decompStr[1])"
                $inner = "$($decompStr[2])"
                if (-not $idsMap.ContainsKey($outer[0]) -and -not $idsMap.ContainsKey($inner[0])) {
                    if ($outer -ne '？' -and $inner -ne '？') {
                        $key = "SURROUND_TOPRIGHT:$outer+$inner"
                        Register-Recipe $key $char $pinyin $def "SURROUND_TOPRIGHT" "Nửa bao góc trên-phải (⿹)" @($outer, $inner) $etym $sv
                    }
                }
            }

            # ── 6. Standard binary layouts
            elseif ($idsMap.ContainsKey($firstOp)) {
                $idsInfo = $idsMap[$firstOp]
                $p1 = "$($decompStr[1])"
                $p2 = "$($decompStr[2])"

                if (-not $idsMap.ContainsKey($p1[0]) -and -not $idsMap.ContainsKey($p2[0])) {
                    if ($p1 -ne '？' -and $p2 -ne '？' -and $p1 -ne '?' -and $p2 -ne '?') {
                        $key = "$($idsInfo.layout):$p1+$p2"
                        Register-Recipe $key $char $pinyin $def $idsInfo.layout $idsInfo.name @($p1, $p2) $etym $sv

                        foreach ($p in @($p1, $p2)) {
                            if (-not $componentsDict.ContainsKey($p)) {
                                $pSv = if ($radicalSVNames.ContainsKey($p)) { $radicalSVNames[$p] } elseif ($unihanDict.ContainsKey($p)) { $unihanDict[$p] } else { $p }
                                $componentsDict[$p] = [ordered]@{
                                    character = $p
                                    name = $pSv
                                    pinyin = ""
                                    meaning = $pSv
                                    stroke_count = 1
                                    is_radical = $false
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch {
        # ignore malformed
    }
}

# ── Explicit Critical High-Frequency Recipes ──
Register-Recipe "TOP_BOTTOM:人+从" "众" "zhòng" "Đám đông, quần chúng" "TOP_BOTTOM" "Trên — Dưới (⿱)" @("人","从") "Người đứng trên đám đông là Chúng (众)." "Chúng"
Register-Recipe "TRIANGLE_PYRAMID:人+人+人" "众" "zhòng" "Đám đông, quần chúng" "TRIANGLE_PYRAMID" "Kim tự tháp / Phẩm tự (品)" @("人","人","人") "Ba người (人+人+人) tụ họp tạo nên đám đông (众)." "Chúng"
Register-Recipe "TOP_BOTTOM:木+林" "森" "sēn" "Rừng rậm, sum suê" "TOP_BOTTOM" "Trên — Dưới (⿱)" @("木","林") "Cây mọc trùm rừng nhỏ thành đại ngàn (森)." "Sâm"
Register-Recipe "TRIANGLE_PYRAMID:木+木+木" "森" "sēn" "Rừng rậm, sum suê" "TRIANGLE_PYRAMID" "Kim tự tháp / Phẩm tự (品)" @("木","木","木") "Ba cái cây (木+木+木) tạo nên rừng đại ngàn (森)." "Sâm"
Register-Recipe "LEFT_RIGHT:人+人" "从" "cóng" "Đi theo, từ, thuận theo" "LEFT_RIGHT" "Trái — Phải (⿰)" @("人","人") "Hai người đi theo nhau là Tùng (从)." "Tùng"
Register-Recipe "LEFT_RIGHT:木+木" "林" "lín" "Rừng cây" "LEFT_RIGHT" "Trái — Phải (⿰)" @("木","木") "Hai cây đứng cạnh nhau là Rừng (林)." "Lâm"
Register-Recipe "TOP_BOTTOM:十+口" "古" "gǔ" "Cổ xưa, xưa cũ" "TOP_BOTTOM" "Trên — Dưới (⿱)" @("十","口") "Mười miệng truyền nhau qua nhiều đời là Cổ (古)." "Cổ"
Register-Recipe "THREE_PART_H:氵+古+月" "湖" "hú" "Hồ nước" "THREE_PART_H" "Ba phần ngang" @("氵","古","月") "Nước (氵) hồ cổ xưa (古) soi bóng trăng (月) là Hồ (湖)." "Hồ"
Register-Recipe "SURROUND_BOTTOMLEFT:辶+文" "这" "zhè" "Cái này, đây" "SURROUND_BOTTOMLEFT" "Nửa bao góc dưới-trái (⿺)" @("辶","文") "Đi (辶) đến nơi có văn hóa (文) — chỉ nơi này, điều này." "Giá"
Register-Recipe "SURROUND_BOTTOMLEFT:走+己" "起" "qǐ" "Đứng dậy, bắt đầu" "SURROUND_BOTTOMLEFT" "Nửa bao góc dưới-trái (⿺)" @("走","己") "Chạy (走) theo chính mình (己) — Đứng dậy khởi đầu." "Khởi"
Register-Recipe "SURROUND_TOPRIGHT:勹+巳" "包" "bāo" "Gói, bao gồm" "SURROUND_TOPRIGHT" "Nửa bao góc trên-phải (⿹)" @("勹","巳") "Cái bao bọc lấy bên trong — Bao gói." "Bao"

Write-Host "Processed characters: $processed" -ForegroundColor Green
Write-Host "Extracted unique components: $($componentsDict.Count)" -ForegroundColor Green
Write-Host "Extracted craftable recipes: $($recipesMap.Count)" -ForegroundColor Green

# Export to JSON
$jsonSettings = @{ Depth = 10; Compress = $false }
$compJson = $componentsDict | ConvertTo-Json @jsonSettings
[System.IO.File]::WriteAllText($ComponentsOut, $compJson, [System.Text.Encoding]::UTF8)

$recipeJson = $recipesMap | ConvertTo-Json @jsonSettings
[System.IO.File]::WriteAllText($RecipesOut, $recipeJson, [System.Text.Encoding]::UTF8)

$charJson = $charactersDb | ConvertTo-Json @jsonSettings
[System.IO.File]::WriteAllText($CharactersOut, $charJson, [System.Text.Encoding]::UTF8)

Write-Host "Pipeline completed successfully!" -ForegroundColor Yellow
