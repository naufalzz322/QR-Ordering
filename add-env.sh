#!/bin/bash
cd "D:\Work\Web\demo\QR Ordering"
echo 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nZXF5YWZ4enlpdW54eWh2cGlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzk4NjY5MiwiZXhwIjoyMDk5NTYyNjkyfQ.pNZrbr-7x5frV5y8Ni40ovQVkJuOSTaYwCZv_vaMMJY' | vercel env add SUPABASE_SERVICE_ROLE_KEY production --yes
echo 'https://qr-ordering-pwhwb248b-zuhdis-projects-b924b3c5.vercel.app' | vercel env add NEXT_PUBLIC_APP_URL production --yes
echo 'warung-nusantara-sby' | vercel env add NEXT_PUBLIC_OUTLET_SLUG production --yes
echo 'admin@warungnusantara.com' | vercel env add ADMIN_EMAIL production --yes
echo 'admin123' | vercel env add ADMIN_PASSWORD production --yes
echo '8fb4b08cf1adb0f124297fc105089ed83d34f87dc095d3b8412120a9230b6a19' | vercel env add CRON_SECRET production --yes
echo 'https://qr-ordering-pwhwb248b-zuhdis-projects-b924b3c5.vercel.app' | vercel env add NEXTAUTH_URL production --yes
vercel env ls production
