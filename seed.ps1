param(
  [Parameter(Mandatory=$true)]
  [string]$Token
)

$API = "http://localhost:8080/api"
$Headers = @{
  "Content-Type" = "application/json; charset=utf-8"
  "Authorization" = "Bearer $Token"
}

function Post-Json {
  param([string]$Path, [hashtable]$Body, [string]$BizId)
  $h = $Headers.Clone()
  if ($BizId) { $h["X-Business-Id"] = $BizId }

  $json = $Body | ConvertTo-Json -Depth 10 -Compress
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)

  return Invoke-RestMethod -Uri "$API$Path" -Method POST -Headers $h -Body $bytes
}

function Get-Json {
  param([string]$Path, [string]$BizId)
  $h = $Headers.Clone()
  if ($BizId) { $h["X-Business-Id"] = $BizId }
  return Invoke-RestMethod -Uri "$API$Path" -Method GET -Headers $h
}

# ===== 1. Tạo businesses =====
Write-Host "=== Creating businesses ===" -ForegroundColor Cyan

$existing = Get-Json "/businesses/me"

function Ensure-Business {
  param([string]$Name, [string]$Industry, $Existing)
  $found = $Existing | Where-Object { $_.name -eq $Name }
  if ($found) {
    Write-Host "  $Name already exists: $($found.id)"
    return $found.id
  }
  $b = Post-Json "/businesses" @{ name = $Name; industry = $Industry }
  Write-Host "  Created $Name : $($b.id)"
  return $b.id
}

$coffeeId = Ensure-Business "Mộc Coffee" "coffee" $existing
$gymId    = Ensure-Business "ABC Gym"    "gym"    $existing
$spaId    = Ensure-Business "Beauty Spa" "spa"    $existing

Write-Host "Coffee ID: $coffeeId"
Write-Host "Gym ID:    $gymId"
Write-Host "Spa ID:    $spaId"

# ===== 2. COFFEE =====
Write-Host "`n=== Seeding Mộc Coffee ===" -ForegroundColor Cyan

Post-Json "/business-knowledge/business-name" @{ businessName = "Mộc Coffee" } $coffeeId | Out-Null
Post-Json "/business-knowledge/address" @{ address = "123 Nguyễn Huệ, Quy Nhơn" } $coffeeId | Out-Null
Post-Json "/business-knowledge/opening-hours" @{ openingHours = "07:00 - 22:00" } $coffeeId | Out-Null
Post-Json "/business-knowledge/phone" @{ phone = "0901 111 111" } $coffeeId | Out-Null
Post-Json "/business-knowledge/wifi-name" @{ wifiName = "MocCoffee_5G" } $coffeeId | Out-Null
Post-Json "/business-knowledge/wifi-password" @{ wifiPassword = "moc2026" } $coffeeId | Out-Null
Post-Json "/business-knowledge/business-profile" @{
  industry = "coffee"
  terminology = @{
    businessTerm = "quán"
    customerTerm = "khách hàng"
    productTerm = "món"
  }
} $coffeeId | Out-Null
Post-Json "/business-knowledge/ai-config" @{
  name = "Linh"
  role = "consultant"
  style = "friendly"
  permissions = @{ canAdvise = $true; canPlaceOrder = $true; canHandleIssue = $true }
} $coffeeId | Out-Null

$coffeeProducts = @(
  @{
    name = "Cà phê sữa"
    price = 30000
    description = "Cà phê rang xay pha phin kết hợp sữa đặc, vị đậm đà và béo nhẹ."
    category = "Cà phê"
    status = "active"
    attributes = @{
      sweetness = "vừa"
      coffeeLevel = "đậm"
      milkLevel = "cao"
      suitableFor = @("cà phê", "béo")
      notSuitableFor = @("không cà phê")
    }
  },
  @{
    name = "Bạc xỉu"
    price = 35000
    description = "Sữa đặc và sữa tươi kết hợp cà phê nhẹ, vị ngọt béo."
    category = "Cà phê"
    status = "active"
    attributes = @{
      sweetness = "ngọt"
      coffeeLevel = "nhẹ"
      milkLevel = "cao"
      suitableFor = @("ngọt", "sữa", "không đắng")
      notSuitableFor = @("cà phê đậm")
    }
  },
  @{
    name = "Trà đào"
    price = 35000
    description = "Trà kết hợp đào ngâm, vị thanh mát và thơm hương đào."
    category = "Trà"
    status = "active"
    attributes = @{
      suitableFor = @("trà", "trái cây", "thanh mát")
      notSuitableFor = @("cà phê")
    }
  }
)

foreach ($p in $coffeeProducts) {
  Post-Json "/products-services" $p $coffeeId | Out-Null
}
Write-Host "  Seeded $($coffeeProducts.Count) products"

Post-Json "/faqs" @{
  question = "Quán có máy lạnh không?"
  answer = "Dạ có ạ, quán có máy lạnh."
  status = "active"
} $coffeeId | Out-Null
Post-Json "/faqs" @{
  question = "Quán có giao hàng không?"
  answer = "Có, giao trong bán kính 5km."
  status = "active"
} $coffeeId | Out-Null
Write-Host "  Seeded 2 FAQs"

Post-Json "/policies" @{
  title = "Chính sách hoàn tiền"
  content = "Hoàn tiền trong 24h nếu món bị lỗi."
  status = "active"
} $coffeeId | Out-Null
Post-Json "/policies" @{
  title = "Chính sách hủy đơn"
  content = "Hủy trong 5 phút sau khi đặt."
  status = "active"
} $coffeeId | Out-Null
Write-Host "  Seeded 2 policies"

Post-Json "/promotions" @{
  name = "Sinh nhật giảm 20%"
  description = "Giảm cho khách có sinh nhật trong tháng"
  keywords = @("sinh nhật")
  condition = "Áp dụng trong tháng sinh nhật"
  discount = "20%"
  scope = "all"
  productIds = @()
  status = "active"
} $coffeeId | Out-Null
Write-Host "  Seeded 1 promotion"

# ===== 3. GYM =====
Write-Host "`n=== Seeding ABC Gym ===" -ForegroundColor Cyan

Post-Json "/business-knowledge/business-name" @{ businessName = "ABC Gym" } $gymId | Out-Null
Post-Json "/business-knowledge/address" @{ address = "456 Lê Lợi, Quy Nhơn" } $gymId | Out-Null
Post-Json "/business-knowledge/opening-hours" @{ openingHours = "06:00 - 21:00" } $gymId | Out-Null
Post-Json "/business-knowledge/phone" @{ phone = "0902 222 222" } $gymId | Out-Null
Post-Json "/business-knowledge/wifi-name" @{ wifiName = "ABCGym_5G" } $gymId | Out-Null
Post-Json "/business-knowledge/wifi-password" @{ wifiPassword = "gym2026" } $gymId | Out-Null
Post-Json "/business-knowledge/business-profile" @{
  industry = "gym"
  terminology = @{
    businessTerm = "phòng tập"
    customerTerm = "học viên"
    productTerm = "gói tập"
  }
} $gymId | Out-Null
Post-Json "/business-knowledge/ai-config" @{
  name = "Hùng"
  role = "consultant"
  style = "playful"
  permissions = @{ canAdvise = $true; canPlaceOrder = $true; canHandleIssue = $true }
} $gymId | Out-Null

$gymProducts = @(
  @{
    name = "Gói 1 tháng"
    price = 500000
    description = "Tập không giới hạn 1 tháng."
    category = "Gói tập"
    status = "active"
    attributes = @{
      duration = "1 tháng"
      level = "cơ bản"
      suitableFor = @("người mới", "tập cơ bản")
      notSuitableFor = @("tập chuyên sâu")
    }
  },
  @{
    name = "Gói giảm cân 3 tháng"
    price = 2000000
    description = "Lộ trình giảm cân 3 tháng."
    category = "Gói tập"
    status = "active"
    attributes = @{
      duration = "3 tháng"
      goal = "giảm cân"
      suitableFor = @("giảm cân", "đốt mỡ")
      notSuitableFor = @("tăng cơ")
    }
  },
  @{
    name = "PT 1-1"
    price = 500000
    description = "Huấn luyện cá nhân 1-1."
    category = "PT"
    status = "active"
    attributes = @{
      duration = "1 buổi"
      goal = "tăng cơ"
      suitableFor = @("tăng cơ", "cá nhân hóa")
      notSuitableFor = @("tập nhóm")
    }
  }
)

foreach ($p in $gymProducts) {
  Post-Json "/products-services" $p $gymId | Out-Null
}
Write-Host "  Seeded $($gymProducts.Count) products"

Post-Json "/faqs" @{
  question = "Phòng tập có PT không?"
  answer = "Có, PT 1-1 với huấn luyện viên."
  status = "active"
} $gymId | Out-Null
Write-Host "  Seeded 1 FAQ"

Post-Json "/policies" @{
  title = "Chính sách hủy gói"
  content = "Hủy trước 7 ngày, không hoàn tiền tháng đã dùng."
  status = "active"
} $gymId | Out-Null
Write-Host "  Seeded 1 policy"

Post-Json "/promotions" @{
  name = "Giảm 10% học viên mới"
  description = "Giảm cho học viên đăng ký lần đầu"
  keywords = @("học viên mới")
  condition = "Đăng ký lần đầu"
  discount = "10%"
  scope = "all"
  productIds = @()
  status = "active"
} $gymId | Out-Null
Write-Host "  Seeded 1 promotion"

# ===== 4. SPA =====
Write-Host "`n=== Seeding Beauty Spa ===" -ForegroundColor Cyan

Post-Json "/business-knowledge/business-name" @{ businessName = "Beauty Spa" } $spaId | Out-Null
Post-Json "/business-knowledge/address" @{ address = "789 Trần Hưng Đạo, Quy Nhơn" } $spaId | Out-Null
Post-Json "/business-knowledge/opening-hours" @{ openingHours = "09:00 - 20:00" } $spaId | Out-Null
Post-Json "/business-knowledge/phone" @{ phone = "0903 333 333" } $spaId | Out-Null
Post-Json "/business-knowledge/wifi-name" @{ wifiName = "BeautySpa_5G" } $spaId | Out-Null
Post-Json "/business-knowledge/wifi-password" @{ wifiPassword = "spa2026" } $spaId | Out-Null
Post-Json "/business-knowledge/business-profile" @{
  industry = "spa"
  terminology = @{
    businessTerm = "cơ sở"
    customerTerm = "khách hàng"
    productTerm = "dịch vụ"
  }
} $spaId | Out-Null
Post-Json "/business-knowledge/ai-config" @{
  name = "Mai"
  role = "consultant"
  style = "professional"
  permissions = @{ canAdvise = $true; canPlaceOrder = $true; canHandleIssue = $true }
} $spaId | Out-Null

$spaProducts = @(
  @{
    name = "Massage đá nóng"
    price = 400000
    description = "Massage đá nóng thư giãn 90 phút."
    category = "Massage"
    status = "active"
    attributes = @{
      duration = "90 phút"
      suitableFor = @("thư giãn", "đau mỏi")
      notSuitableFor = @("dị ứng nhiệt")
    }
  },
  @{
    name = "Chăm sóc da mụn"
    price = 500000
    description = "Liệu trình chăm sóc da mụn 60 phút."
    category = "Facial"
    status = "active"
    attributes = @{
      duration = "60 phút"
      skinType = "da dầu"
      concern = "mụn"
      suitableFor = @("da dầu", "mụn")
      notSuitableFor = @("da khô")
    }
  },
  @{
    name = "Facial trẻ hóa"
    price = 800000
    description = "Facial trẻ hóa da 75 phút."
    category = "Facial"
    status = "active"
    attributes = @{
      duration = "75 phút"
      suitableFor = @("chống lão hóa", "trẻ hóa")
      notSuitableFor = @("da nhạy cảm")
    }
  }
)

foreach ($p in $spaProducts) {
  Post-Json "/products-services" $p $spaId | Out-Null
}
Write-Host "  Seeded $($spaProducts.Count) products"

Post-Json "/faqs" @{
  question = "Cơ sở có nhận khách walk-in không?"
  answer = "Có, nhưng nên đặt trước để được phục vụ tốt nhất."
  status = "active"
} $spaId | Out-Null
Write-Host "  Seeded 1 FAQ"

Post-Json "/policies" @{
  title = "Chính sách hủy liệu trình"
  content = "Hủy trước 24h, không mất phí."
  status = "active"
} $spaId | Out-Null
Write-Host "  Seeded 1 policy"

Post-Json "/promotions" @{
  name = "Combo 3 buổi giảm 15%"
  description = "Giảm 15% khi đặt 3 buổi"
  keywords = @("combo")
  condition = "Đặt 3 buổi trở lên"
  discount = "15%"
  scope = "all"
  productIds = @()
  status = "active"
} $spaId | Out-Null
Write-Host "  Seeded 1 promotion"

Write-Host "`n✅ Seed completed!" -ForegroundColor Green
Write-Host "Coffee ID: $coffeeId"
Write-Host "Gym ID:    $gymId"
Write-Host "Spa ID:    $spaId"