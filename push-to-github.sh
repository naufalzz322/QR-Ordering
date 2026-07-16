#!/bin/bash
cd "D:\Work\Web\demo\QR Ordering"
git remote add origin https://github.com/naufalzz322/QR-Ordering.git 2>&1 || git remote set-url origin https://github.com/naufalzz322/QR-Ordering.git
git branch -M main
git push -u origin main 2>&1
