FROM openresty/openresty:alpine-fat

# Install required Lua modules
RUN apk add --no-cache \
    lua5.1-redis \
    lua-resty-http \
    curl

# Copy nginx configuration
COPY nginx.conf /usr/local/openresty/nginx/conf/nginx.conf

# Copy Lua scripts
COPY lua/ /usr/local/openresty/nginx/lua/

# Create log directories
RUN mkdir -p /var/log/nginx && \
    chown -R nobody:nobody /var/log/nginx

EXPOSE 8080

CMD ["/usr/local/openresty/bin/openresty", "-g", "daemon off;"]
