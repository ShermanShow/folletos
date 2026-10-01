FROM node:22-alpine
WORKDIR /app
COPY vps/server.mjs /app/server.mjs
COPY vps/create-auth.mjs /app/create-auth.mjs
COPY src/ /app/public/
RUN addgroup -g 10001 -S folletos && adduser -u 10001 -S folletos -G folletos && mkdir -p /app/data && chown -R folletos:folletos /app/data
USER folletos
EXPOSE 3000
CMD ["node", "/app/server.mjs"]
