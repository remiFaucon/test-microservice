# -*- mode: ruby -*-
# vi: set ft=ruby :

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.
Vagrant.configure("2") do |config|
    config.vm.define "auth" do |auth|
        auth.vm.box = "bento/ubuntu-22.04"
        auth.vm.network "forwarded_port", guest: 3002, host: 3002, host_ip: "127.0.0.1"
        auth.vm.network "private_network", ip: "192.168.33.10"
        auth.vm.synced_folder "./auth", "/home/vagrant/service/"
        auth.vm.provision "shell", inline: <<-SHELL
            apt-get install snap
            snap install go --classic
            go get /home/vagrant/service/...
            ro run /home/vagrant/service/server.go
        SHELL
    end
    config.vm.define "face" do |face|
        face.vm.box = "bento/ubuntu-22.04"
        face.vm.network "forwarded_port", guest: 5000, host: 5000, host_ip: "127.0.0.1"
        face.vm.network "private_network", ip: "192.168.33.11"
        face.vm.synced_folder "./faceReconnation", "/home/vagrant/service/"
        face.vm.provision "shell", inline: <<-SHELL
            apt install software-properties-common
            add-apt-repository ppa:deadsnakes/ppa
            apt update
            apt install python3
            apt install python3-pip
            pip install -r /home/vagrant/service/requirements.txt
            python3 /home/vagrant/service/faceReconnation.py
        SHELL
    end
    config.vm.define "app" do |app|
        app.vm.box = "bento/ubuntu-22.04"
        app.vm.network "forwarded_port", guest: 3001, host: 3001, host_ip: "127.0.0.1"
        app.vm.network "private_network", ip: "192.168.33.12"
        app.vm.synced_folder "./expressApp", "/home/vagrant/service/"
        app.vm.provision "shell", inline: <<-SHELL
            apt-get install
            curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash - &&\
            apt-get install nodejs
            node /home/vagrant/service/dist/server.js
        SHELL
    end
    config.vm.provision "shell", inline: <<-SHELL
         apt-get update
         apt-get install curl
    SHELL
end