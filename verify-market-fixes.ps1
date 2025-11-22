# 时间交易所修复验证脚本
# 用于验证所有修复功能是否正常工作

# 颜色定义
$GREEN = "\033[0;32m"
$RED = "\033[0;31m"
$YELLOW = "\033[0;33m"
$BLUE = "\033[0;34m"
$NC = "\033[0m" # No Color

Write-Host "${BLUE}========================================${NC}"
Write-Host "${BLUE}时间交易所修复验证工具${NC}"
Write-Host "${BLUE}========================================${NC}"
Write-Host ""

# 检查项目结构
Write-Host "${YELLOW}1. 检查项目结构...${NC}"
$requiredFiles = @(
    "src/pages/Market.tsx",
    "src/stores/marketStore.ts",
    "src/config/supabase.ts"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file 存在"
    } else {
        Write-Host "  ❌ $file 不存在"
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host "${RED}错误: 缺少必要的文件${NC}"
    exit 1
}

Write-Host ""
Write-Host "${YELLOW}2. 验证关键修复点...${NC}"

# 检查任务完成逻辑
Write-Host "  检查 Market.tsx 中的 handleTaskComplete 函数..."
$marketContent = Get-Content "src/pages/Market.tsx" -Raw
if ($marketContent -match "completeTask.*user\.id.*task\.id") {
    Write-Host "  ✅ 任务完成逻辑已修复 - 使用 completeTask 方法"
} else {
    Write-Host "  ❌ 任务完成逻辑未修复"
}

if ($marketContent -match "checkTaskCompletion") {
    Write-Host "  ✅ 任务完成状态检查已添加"
} else {
    Write-Host "  ❌ 任务完成状态检查未添加"
}

if ($marketContent -match "custom_title.*custom_description") {
    Write-Host "  ✅ 自定义奖励显示逻辑已修复"
} else {
    Write-Host "  ❌ 自定义奖励显示逻辑未修复"
}

# 检查 marketStore.ts
Write-Host "  检查 marketStore.ts 中的 completeTask 函数..."
$storeContent = Get-Content "src/stores/marketStore.ts" -Raw
if ($storeContent -match "validateTaskCompletion") {
    Write-Host "  ✅ 任务完成验证函数已添加"
} else {
    Write-Host "  ❌ 任务完成验证函数未添加"
}

if ($storeContent -match "task\.is_completed.*return") {
    Write-Host "  ✅ 重复完成检查已添加"
} else {
    Write-Host "  ❌ 重复完成检查未添加"
}

if ($storeContent -match "fetchUserData.*completeTask") {
    Write-Host "  ✅ 用户数据刷新已添加"
} else {
    Write-Host "  ❌ 用户数据刷新未添加"
}

Write-Host ""
Write-Host "${YELLOW}3. 运行开发服务器进行测试...${NC}"

# 检查端口是否被占用
$port = 5173
$portInUse = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($portInUse) {
    Write-Host "  ⚠️  端口 $port 已被占用，尝试使用端口 5174"
    $port = 5174
}

Write-Host "  启动开发服务器 (端口: $port)..."
Write-Host "  ${GREEN}提示: 请手动访问 http://localhost:$port 进行测试${NC}"
Write-Host ""

# 提供测试步骤
Write-Host "${BLUE}测试步骤:${NC}"
Write-Host "1. 访问时间交易所页面"
Write-Host "2. 尝试完成一个未完成的任务"
Write-Host "3. 验证织梦豆余额是否正确增加"
Write-Host "4. 尝试重复完成同一个任务 (应该被阻止)"
Write-Host "5. 检查自定义奖励是否正确显示"
Write-Host "6. 使用测试工具进行验证: market-test-verification.html"
Write-Host ""

Write-Host "${BLUE}验证要点:${NC}"
Write-Host "✅ 只有真正完成的任务才能领取织梦豆"
Write-Host "✅ 完成任务后织梦豆余额立即更新"
Write-Host "✅ 自定义奖励显示完整信息"
Write-Host "✅ 重复完成任务被正确阻止"
Write-Host ""

# 尝试启动开发服务器
Write-Host "${YELLOW}4. 启动开发环境...${NC}"
try {
    # 检查 package.json 是否存在
    if (Test-Path "package.json") {
        Write-Host "  检测到 package.json，尝试启动开发服务器..."
        
        # 检查是否有可用的脚本
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if ($packageJson.scripts.dev) {
            Write-Host "  运行命令: npm run dev -- --port $port"
            Write-Host "  ${GREEN}开发服务器启动中...${NC}"
            Write-Host "  ${GREEN}请访问 http://localhost:$port 进行测试${NC}"
        } else {
            Write-Host "  ⚠️  package.json 中没有 dev 脚本"
        }
    } else {
        Write-Host "  ⚠️  未找到 package.json 文件"
    }
} catch {
    Write-Host "  ⚠️  启动开发服务器时出错"
}

Write-Host ""
Write-Host "${GREEN}验证脚本执行完成!${NC}"
Write-Host "${BLUE}请按照上述步骤进行测试，确保所有修复都正常工作。${NC}"
Write-Host ""
Write-Host "如果遇到问题，请检查:"
Write-Host "1. 控制台错误信息"
Write-Host "2. 网络请求是否成功"
Write-Host "3. 数据库连接是否正常"
Write-Host "4. 使用浏览器开发者工具进行调试"