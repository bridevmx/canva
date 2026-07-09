FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN echo "build $(date +%s%N)" > /tmp/.cache_bust
COPY . /usr/share/nginx/html
EXPOSE 80
