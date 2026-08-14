FROM nginx:1.29-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
COPY assets /usr/share/nginx/html/assets
COPY offer /usr/share/nginx/html/offer
COPY privacy /usr/share/nginx/html/privacy
COPY personal-data-consent /usr/share/nginx/html/personal-data-consent
COPY success /usr/share/nginx/html/success
COPY error /usr/share/nginx/html/error

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1
