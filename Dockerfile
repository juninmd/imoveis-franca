# Build stage
FROM node:20-slim AS builder
WORKDIR /app
COPY . .
RUN cd client && npm install && npm run build

# Final stage
FROM nginx:alpine
COPY --from=builder /app/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
