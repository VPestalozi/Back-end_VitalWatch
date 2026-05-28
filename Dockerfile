FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# Fornece uma URL mock apenas para que o `prisma generate` e `prisma.config.ts` não deem erro
ENV DATABASE_URL="postgresql://mock:mock@localhost:5432/mock"
RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
