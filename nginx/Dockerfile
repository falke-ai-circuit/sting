FROM openresty/openresty:alpine-fat

RUN apk add --no-cache lua5.1-redis lua-resty-http curl

COPY nginx.conf /usr/local/openresty/nginx/conf/nginx.conf
COPY lua/ /usr/local/openresty/nginx/lua/

RUN mkdir -p /var/log/nginx && chown -R nobody:nobody /var/log/nginx

EXPOSE 8080

CMD ["/usr/local/openresty/bin/openresty", "-g", "daemon off;"]
