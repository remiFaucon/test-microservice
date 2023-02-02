sudo apt-get install docker.io docker-compose nginx
echo "server{
    listen 443 ssl;
    server_name sitealacon.fr;

    ssl_certificate /etc/cert/localhost-face.crt;
    ssl_certificate_key /etc/cert/localhost-face.key;

    location / {
        proxy_pass http://localhost:4200;
    }
}" > /etc/nginx/conf.d/microservice-angular.conf
echo "127.0.0.1 face-detector.test" >> /etc/hosts
sudo openssl req -new -x509 -newkey rsa:2048 -sha256 -nodes -keyout /etc/cert/localhost-face.key -days 3560 -out /etc/cert/localhost-face.crt -config ssl.conf
sudo docker-compose up -d
pm2 start gateway/dist/server.js
echo "client started on url face-detector.test"