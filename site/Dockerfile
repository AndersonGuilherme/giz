# The landing page (gizzycera.com) as a tiny static server. Build with this folder as the context: docker build site/
FROM nginx:1.28.0-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html
# The server's own config is not a page.
RUN rm /usr/share/nginx/html/nginx.conf

EXPOSE 80
