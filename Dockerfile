FROM node:20-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE=http://backend:4000
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build
EXPOSE 8080
CMD ["npm","run","start"]
