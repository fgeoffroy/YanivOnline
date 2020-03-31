FROM debian:stable-slim

LABEL maintainer="julien@fouret.me"

LABEL Description="Image container with necessary tools to run django" 

RUN apt-get -y update \
    && apt-get -y upgrade \
    && apt-get -y install python3-pip
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3 3
RUN update-alternatives --install /usr/bin/pip pip /usr/bin/pip3 3
RUN pip install --upgrade pip
RUN pip install django
RUN pip install -U channels
RUN apt-get -y install python3-dev
RUN apt-get -y install default-libmysqlclient-dev
RUN pip install mysqlclient
RUN python -m pip install channels_redis

RUN mkdir /var/www
COPY yaniv /var/www/yaniv

WORKDIR /var/www/yaniv

EXPOSE 8080

#Test conflict
