FROM nginx:alpine
# Remove o arquivo de configuração padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf
# Copia todos os arquivos do projeto para o diretório correto
COPY . /usr/share/nginx/html/
# Configuração do nginx
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location ~* \.(?:js|css)$ { \
        expires -1; \
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"; \
    } \
}' > /etc/nginx/conf.d/default.conf