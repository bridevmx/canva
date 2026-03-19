# Build final image
FROM nginx:alpine

# Copy local files to the public folder
# Using a glob or selective copy if needed, but for now copying everything
COPY . /usr/share/nginx/html

# Replace default configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Clean up any potential junk (optional)
# RUN rm /usr/share/nginx/html/Dockerfile /usr/share/nginx/html/nginx.conf /usr/share/nginx/html/CODEBASE_GUIDE.md

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
