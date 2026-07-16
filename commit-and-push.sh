#!/bin/bash
cd "D:\Work\Web\demo\QR Ordering"
git add .gitignore .env.production
git commit -m "Add .env.production template for Vercel deployment"
git push origin master
