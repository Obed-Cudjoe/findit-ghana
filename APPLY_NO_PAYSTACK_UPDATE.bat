@echo off
setlocal
cd /d "%~dp0"
if not exist "package.json" (
  echo Open this script only from the root of the FindIt Ghana project.
  pause
  exit /b 1
)

echo Removing old Paystack-only files from the previous ZIP...
if exist "lib\paystack.ts" del /q "lib\paystack.ts"
if exist "components\paystack-checkout-button.tsx" del /q "components\paystack-checkout-button.tsx"
if exist "app\api\payments" rmdir /s /q "app\api\payments"
if exist "app\payment" rmdir /s /q "app\payment"
if exist "supabase\migrations\010_paystack_vendor_payments.sql" del /q "supabase\migrations\010_paystack_vendor_payments.sql"
if exist "supabase\migrations\011_community_market.sql" del /q "supabase\migrations\011_community_market.sql"
echo Cleanup complete. Keep the new supabase\migrations\010_community_market.sql file.
echo If this helper remains in GitHub Desktop Changes, do not commit it; delete it after it runs.
pause
