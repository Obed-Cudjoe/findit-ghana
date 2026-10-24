@echo off
setlocal
cd /d "%~dp0"
if not exist "package.json" (
  echo Run this helper from the root of the FindIt Ghana repository.
  pause
  exit /b 1
)

echo Removing the unused Paystack-only runtime files so the current MoMo flow and site assistant can build...
if exist "lib\paystack.ts" del /q "lib\paystack.ts"
if exist "components\paystack-checkout-button.tsx" del /q "components\paystack-checkout-button.tsx"
if exist "app\api\payments" rmdir /s /q "app\api\payments"
if exist "app\payment" rmdir /s /q "app\payment"
echo Done. Keep the assistant and existing Community Market files.
echo If this helper appears in GitHub Desktop Changes, delete the helper before committing.
pause
