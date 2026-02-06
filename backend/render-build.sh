# Build command
npm install
npx prisma generate
npm run build

# Start command  
npx prisma migrate deploy && npm start
