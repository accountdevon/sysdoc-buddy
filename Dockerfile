FROM node:20-alpine AS builder
 
WORKDIR /app
 
# Copy package files
COPY package.json bun.lockb ./
 
# Install dependencies
RUN npm install
 
COPY . .
 
# --- ADD THESE LINES ---
# Declare that these arguments will be passed during build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
 
# Set them as environment variables so Vite can see them
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
# -----------------------
 
# Build the app
RUN npm run build
 
# Serve with nginx
FROM node:20-alpine
 
WORKDIR /app
 
# Install serve to run the production build
RUN npm install -g serve
 
# (Rest of your file remains the same)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
# Ensure nginx.conf exists in your project, or remove this line if using default
# COPY nginx.conf /etc/nginx/conf.d/default.conf
 
EXPOSE 3000
 
# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"]
