cd /home/ubuntu

# install Docker
apt-get remove docker docker-engine docker.io containerd runc
apt-get update
apt-get install apt-transport-https ca-certificates curl gnupg-agent software-properties-common -y
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
apt-key fingerprint 0EBFCD88
add-apt-repository    "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) \
    stable"
apt-get update
apt-get install docker-ce docker-ce-cli containerd.io -y

# pull dseqr
docker pull alexvpickering/dseqr
docker network create sp-example-net

# get Dockerfile for ShinyProxy image
mkdir dseqr.sp
cd dseqr.sp
wget https://raw.githubusercontent.com/hms-dbmi/dseqr.sp/master/Dockerfile

# customize application.yml before building based on the name of your app/authentication/etc.
# app.html fixes mobile bootstrap breakpoints (shinyproxy#96)
wget https://raw.githubusercontent.com/hms-dbmi/dseqr.sp/master/application.yml
wget https://raw.githubusercontent.com/hms-dbmi/dseqr.sp/master/app.html
wget https://raw.githubusercontent.com/hms-dbmi/dseqr.sp/master/login.html
wget https://raw.githubusercontent.com/hms-dbmi/dseqr.sp/master/index.html

# replacement variables set in user data of DseqrAsgStack
if [ "$USE_COGNITO" = true ]
then
  # modify application.yml to use cognito and serve shinyproxy on port 80
  SHINYPROXY_PORT=80
  sed -i "s/authentication: none/authentication: openid/" application.yml
  sed -i "s/{region}/$REGION/" application.yml
  sed -i "s/{user_pool_id}/$USER_POOL_ID/" application.yml
  sed -i "s/{auth_domain}/$AUTH_DOMAIN/" application.yml
  sed -i "s/{client_id}/$CLIENT_ID/" application.yml
  sed -i "s/{host_url}/$HOST_URL/" application.yml
  sed -i "s/client-id:/client-id: $CLIENT_ID/" application.yml
  sed -i "s/client-secret:/client-secret: $CLIENT_SECRET/" application.yml
else
  # serve shinyproxy behind nginx
  SHINYPROXY_PORT=8080
  # install nginx
  apt install nginx -y
  ufw allow ssh
  ufw allow 'Nginx Full'
  ufw --force enable
  # setup nginx
  cd /etc/nginx/sites-available
  wget -O $HOST_URL https://raw.githubusercontent.com/hms-dbmi/dseqr.sp/master/nginx.conf
  # change server name
  sed -i "s/localhost/$HOST_URL www.$HOST_URL/" $HOST_URL
  # enable site and restart nginx
  ln -s /etc/nginx/sites-available/$HOST_URL /etc/nginx/sites-enabled/
  rm /etc/nginx/sites-enabled/default
  systemctl restart nginx
  cd /home/ubuntu/dseqr.sp
fi

docker build -t dseqr.sp .

# setup ssl
if [ "$GET_CERT" = true ]; then
  apt-get install certbot -y
  apt-get install python-certbot-nginx -y
  certbot --non-interactive --nginx \
  -d $HOST_URL -d www.$HOST_URL \
  --agree-tos -m alexvpickering@gmail.com
fi

# get data for example app
cd /srv/dseqr/
if [ "$EXAMPLE_DATA" = true ] && [ ! -f "example_data.tar.gz" ]; then
  wget https://dseqr.s3.us-east-2.amazonaws.com/example_data.tar.gz
  tar -xzvf example_data.tar.gz
  rm example_data.tar.gz
  touch example_data.tar.gz # so that don't re-download
fi

if ! ls /srv/dseqr/.indices_dir/kallisto_* > /dev/null 2>&1
then
  mkdir -p /srv/dseqr/.indices_dir
  docker run --rm -v /srv/dseqr:/srv/dseqr alexvpickering/dseqr R -e "rkal::build_kallisto_index('/srv/dseqr/.indices_dir')"
fi

# every minute enable scale-in protection if existing dseqr containers
apt-get install awscli jq -y
mkdir /home/ubuntu/protect && cd /home/ubuntu/protect
wget https://raw.githubusercontent.com/hms-dbmi/dseqr.deploy/master/docker/dseqr-asg/lib/protect.sh
chmod +x ./protect.sh
(crontab -l ; echo "* * * * * /home/ubuntu/protect/protect.sh") | crontab -

# run app
docker run -d --restart always \
 -v /var/run/docker.sock:/var/run/docker.sock \
 --net sp-example-net \
  -p $SHINYPROXY_PORT:8080 \
   dseqr.sp