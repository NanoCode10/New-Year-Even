# -------- build ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# -------- runtime ----------
FROM nginx:1.27-alpine
# Copio el build de Vite
COPY --from=build /app/dist /usr/share/nginx/html

# Escribo el default.conf con un heredoc POSIX correcto (sin escapados)
RUN cat >/etc/nginx/conf.d/default.conf <<'NGINX'
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  # Archivos estáticos con cache
  location ~* \.(ico|css|js|gif|jpe?g|png|svg|woff2?)$ {
    expires 7d;
    add_header Cache-Control "public";
    try_files $uri =404;
  }
}
NGINX

EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
