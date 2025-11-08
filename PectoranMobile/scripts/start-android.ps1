# Скрипт для автоматического запуска React Native Android приложения
# Автоматически настраивает adb reverse и запускает Metro bundler

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Green
Write-Host "Запуск PectoranMobile Android приложения" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Путь к Android SDK
$AndroidSdkPath = "$env:LOCALAPPDATA\Android\Sdk"
$AdbPath = Join-Path $AndroidSdkPath "platform-tools\adb.exe"

# Проверка наличия adb
if (-not (Test-Path $AdbPath)) {
    Write-Host "[ОШИБКА] adb не найден по пути:" -ForegroundColor Red
    Write-Host "  $AdbPath" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Проверьте, что Android SDK установлен и путь правильный." -ForegroundColor Yellow
    Write-Host "Ожидаемый путь: $env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] adb найден: $AdbPath" -ForegroundColor Green

# Переход в корневую директорию проекта
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot
Write-Host "[INFO] Рабочая директория: $ProjectRoot" -ForegroundColor Cyan
Write-Host ""

# Проверка подключенных устройств
Write-Host "Проверка подключенных устройств..." -ForegroundColor Cyan
try {
    $devicesOutput = & $AdbPath devices 2>&1
    $deviceLines = $devicesOutput | Select-String "device$"
    $deviceCount = ($deviceLines | Measure-Object).Count
    
    if ($deviceCount -eq 0) {
        Write-Host "[ПРЕДУПРЕЖДЕНИЕ] Не найдено подключенных устройств или эмуляторов" -ForegroundColor Yellow
        Write-Host "Убедитесь, что эмулятор запущен или устройство подключено по USB" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Выполните команду вручную:" -ForegroundColor White
        Write-Host "  $AdbPath devices" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "[OK] Найдено устройств: $deviceCount" -ForegroundColor Green
        $deviceLines | ForEach-Object {
            Write-Host "  - $($_.Line)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "[ПРЕДУПРЕЖДЕНИЕ] Не удалось проверить устройства через adb" -ForegroundColor Yellow
    Write-Host "Ошибка: $_" -ForegroundColor Red
}
Write-Host ""

# Настройка adb reverse для порта Metro bundler
Write-Host "Настройка adb reverse (порт 8081)..." -ForegroundColor Cyan
try {
    $reverseOutput = & $AdbPath reverse tcp:8081 tcp:8081 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] adb reverse настроен успешно" -ForegroundColor Green
        Write-Host "  Порт 8081 на устройстве -> localhost:8081 на компьютере" -ForegroundColor Gray
    } else {
        Write-Host "[ПРЕДУПРЕЖДЕНИЕ] Не удалось настроить adb reverse" -ForegroundColor Yellow
        Write-Host "Возможно, устройство не подключено или эмулятор не запущен" -ForegroundColor Yellow
        Write-Host "Вывод: $reverseOutput" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Приложение может не подключиться к Metro bundler." -ForegroundColor Yellow
        Write-Host "Попробуйте запустить команду вручную:" -ForegroundColor White
        Write-Host "  $AdbPath reverse tcp:8081 tcp:8081" -ForegroundColor Gray
    }
} catch {
    Write-Host "[ОШИБКА] Исключение при настройке adb reverse: $_" -ForegroundColor Red
}
Write-Host ""

# Проверка и остановка старых процессов Metro bundler
Write-Host "Проверка запущенных процессов Metro bundler..." -ForegroundColor Cyan
try {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    $metroProcesses = @()
    
    foreach ($proc in $nodeProcesses) {
        try {
            $procInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)" -ErrorAction SilentlyContinue
            if ($procInfo -and $procInfo.CommandLine) {
                if ($procInfo.CommandLine -like "*metro*" -or $procInfo.CommandLine -like "*react-native*start*") {
                    $metroProcesses += $proc
                }
            }
        } catch {
            # Игнорируем ошибки при проверке процесса
        }
    }
    
    if ($metroProcesses.Count -gt 0) {
        Write-Host "[INFO] Найдено запущенных процессов Metro: $($metroProcesses.Count)" -ForegroundColor Yellow
        foreach ($proc in $metroProcesses) {
            Write-Host "  - Останавливаем процесс PID: $($proc.Id)" -ForegroundColor Gray
            try {
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            } catch {
                Write-Host "    Не удалось остановить процесс $($proc.Id)" -ForegroundColor Yellow
            }
        }
        Start-Sleep -Seconds 2
        Write-Host "[OK] Старые процессы Metro остановлены" -ForegroundColor Green
    } else {
        Write-Host "[OK] Запущенных процессов Metro не найдено" -ForegroundColor Green
    }
} catch {
    Write-Host "[ПРЕДУПРЕЖДЕНИЕ] Не удалось проверить процессы Metro: $_" -ForegroundColor Yellow
}
Write-Host ""

# Запуск Metro bundler в отдельном окне
Write-Host "Запуск Metro bundler в отдельном окне..." -ForegroundColor Cyan
try {
    $metroScript = "cd '$ProjectRoot'; npm start -- --reset-cache"
    $metroProcess = Start-Process -FilePath "powershell" `
        -ArgumentList "-NoExit", "-Command", $metroScript `
        -PassThru -WindowStyle Normal `
        -ErrorAction Stop
    
    Start-Sleep -Seconds 5
    
    if ($metroProcess -and -not $metroProcess.HasExited) {
        Write-Host "[OK] Metro bundler запущен" -ForegroundColor Green
        Write-Host "  PID: $($metroProcess.Id)" -ForegroundColor Gray
        Write-Host "  Окно Metro bundler открыто отдельно" -ForegroundColor Gray
    } else {
        Write-Host "[ПРЕДУПРЕЖДЕНИЕ] Metro bundler может не запуститься корректно" -ForegroundColor Yellow
        Write-Host "Проверьте окно Metro bundler вручную" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ОШИБКА] Не удалось запустить Metro bundler: $_" -ForegroundColor Red
    Write-Host "Попробуйте запустить вручную: npm start" -ForegroundColor Yellow
    $metroProcess = $null
}
Write-Host ""

# Настройка переменных окружения для React Native CLI
Write-Host "Настройка переменных окружения..." -ForegroundColor Cyan
$platformToolsPath = Split-Path -Parent $AdbPath

# Установка переменных окружения в текущей сессии
$env:ANDROID_HOME = $AndroidSdkPath
$env:ANDROID_SDK_ROOT = $AndroidSdkPath
$env:ANDROID_SDK = $AndroidSdkPath

# Добавление platform-tools в начало PATH
$currentPath = $env:Path
if ($currentPath -notlike "*$platformToolsPath*") {
    $env:Path = "$platformToolsPath;$currentPath"
    Write-Host "[OK] Добавлен путь к adb в PATH: $platformToolsPath" -ForegroundColor Green
} else {
    Write-Host "[OK] Путь к adb уже присутствует в PATH" -ForegroundColor Green
}

Write-Host "[OK] ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Green
Write-Host "[OK] ANDROID_SDK_ROOT: $env:ANDROID_SDK_ROOT" -ForegroundColor Green

# Обновление local.properties для Gradle
$localPropertiesPath = Join-Path $ProjectRoot "android\local.properties"
$localPropertiesContent = "sdk.dir=$($AndroidSdkPath -replace '\\', '/')"
try {
    [System.IO.File]::WriteAllText($localPropertiesPath, $localPropertiesContent, [System.Text.Encoding]::UTF8)
    Write-Host "[OK] Обновлен android\local.properties" -ForegroundColor Green
} catch {
    Write-Host "[ПРЕДУПРЕЖДЕНИЕ] Не удалось обновить local.properties: $_" -ForegroundColor Yellow
}
Write-Host ""

# Проверка, что adb доступен
Write-Host "Проверка доступности adb..." -ForegroundColor Cyan
$adbCheck = & $AdbPath version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] adb работает корректно" -ForegroundColor Green
    $adbVersion = ($adbCheck | Select-Object -First 1)
    Write-Host "  Версия: $adbVersion" -ForegroundColor Gray
} else {
    Write-Host "[ПРЕДУПРЕЖДЕНИЕ] Не удалось проверить версию adb" -ForegroundColor Yellow
}
Write-Host ""

# Запуск Android приложения
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Сборка и запуск Android приложения" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Это может занять несколько минут при первой сборке..." -ForegroundColor Yellow
Write-Host ""

# Запуск react-native run-android с установленными переменными окружения
try {
    # Убеждаемся, что мы в правильной директории
    Set-Location $ProjectRoot
    
    # Дополнительная проверка PATH перед запуском
    $env:Path = "$platformToolsPath;$env:Path"
    
    Write-Host "[INFO] Запуск: npm run android" -ForegroundColor Gray
    Write-Host "[INFO] ANDROID_HOME установлен: $env:ANDROID_HOME" -ForegroundColor Gray
    Write-Host "[INFO] PATH содержит platform-tools: $(if ($env:Path -like "*$platformToolsPath*") { 'Да' } else { 'Нет' })" -ForegroundColor Gray
    Write-Host ""
    
    # Создаем временный batch файл для запуска с правильными переменными окружения
    # Это необходимо, так как React Native CLI может не видеть переменные окружения PowerShell
    $tempBatFile = Join-Path $env:TEMP "react-native-run-android-$(Get-Random).bat"
    $batContent = @"
@echo off
set ANDROID_HOME=$AndroidSdkPath
set ANDROID_SDK_ROOT=$AndroidSdkPath
set ANDROID_SDK=$AndroidSdkPath
set PATH=$platformToolsPath;%PATH%
cd /d "$ProjectRoot"
call npm run android
set EXIT_CODE=%ERRORLEVEL%
exit /b %EXIT_CODE%
"@
    
    try {
        [System.IO.File]::WriteAllText($tempBatFile, $batContent, [System.Text.Encoding]::ASCII)
        
        # Запуск через cmd.exe для лучшей совместимости
        $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "`"$tempBatFile`"" -Wait -NoNewWindow -PassThru
        $exitCode = $process.ExitCode
        
        # Удаляем временный файл, если он еще существует
        if (Test-Path $tempBatFile) {
            Remove-Item $tempBatFile -Force -ErrorAction SilentlyContinue
        }
        
        # Устанавливаем LASTEXITCODE для проверки ниже
        $global:LASTEXITCODE = $exitCode
    } catch {
        Write-Host "[ОШИБКА] Не удалось создать временный batch файл: $_" -ForegroundColor Red
        Write-Host "Попытка запуска напрямую через npm..." -ForegroundColor Yellow
        # Fallback: попытка запуска напрямую
        npm run android
        $global:LASTEXITCODE = $LASTEXITCODE
    }
    
    if ($global:LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "[УСПЕХ] Приложение успешно запущено!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Полезные команды:" -ForegroundColor Cyan
        Write-Host "  - Перезагрузка приложения: нажмите 'R' два раза на устройстве" -ForegroundColor White
        Write-Host "  - Меню разработчика: нажмите 'M' на устройстве" -ForegroundColor White
        Write-Host "  - Перезагрузка с очисткой: нажмите 'Shift+R' на устройстве" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "[ОШИБКА] Ошибка при запуске приложения" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "Проверьте логи выше для деталей" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Возможные решения:" -ForegroundColor Cyan
        Write-Host "  1. Убедитесь, что эмулятор запущен: $AdbPath devices" -ForegroundColor White
        Write-Host "  2. Проверьте, что Metro bundler запущен и доступен" -ForegroundColor White
        Write-Host "  3. Попробуйте очистить кеш: cd android && gradlew clean" -ForegroundColor White
        Write-Host ""
    }
} catch {
    Write-Host ""
    Write-Host "[ОШИБКА] Исключение при запуске приложения: $_" -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Информация" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Metro bundler работает в отдельном окне PowerShell" -ForegroundColor White
if ($metroProcess) {
    Write-Host "Для остановки Metro выполните:" -ForegroundColor White
    Write-Host "  Stop-Process -Id $($metroProcess.Id) -Force" -ForegroundColor Gray
} else {
    Write-Host "Или просто закройте окно Metro bundler" -ForegroundColor White
}
Write-Host ""
