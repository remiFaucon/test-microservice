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
        auth.vm.network "private_network", ip: "192.168.56.10"
        auth.vm.synced_folder "./auth", "/home/vagrant/service/"
        auth.vm.provision "shell", inline: <<-SHELL
            apt-get install snap -y
            snap install go --classic
            cd /home/vagrant/service && go get ./...
            go build /home/vagrant/service/server.go
            nohup /home/vagrant/service/server &
        SHELL
    end
    config.vm.define "face" do |face|
        face.vm.box = "bento/ubuntu-22.04"
        face.vm.network "forwarded_port", guest: 5000, host: 5000, host_ip: "127.0.0.1"
        face.vm.network "private_network", ip: "192.168.56.11"
        face.vm.synced_folder "./faceReconnation", "/home/vagrant/service/"
        face.vm.provision "shell", inline: <<-SHELL
            apt install software-properties-common -y
            add-apt-repository ppa:deadsnakes/ppa
            apt update -y
            apt install python3 python3-pip -y
            pip3 install -r /home/vagrant/service/requirement.txt
            python3 /home/vagrant/service/faceReconnation.py
        SHELL
    end
    config.vm.define "app" do |app|
        app.vm.box = "bento/ubuntu-22.04"
        app.vm.network "forwarded_port", guest: 3001, host: 3001, host_ip: "127.0.0.1"
        app.vm.network "private_network", ip: "192.168.56.12"
        app.vm.synced_folder "./expressApp", "/home/vagrant/service/"
        app.vm.provision "shell", inline: <<-SHELL
            curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash - &&\
            apt-get install nodejs -y
            node /home/vagrant/service/dist/server.js
        SHELL
    end
    config.vm.define "gateway" do |gateway|
        gateway.vm.box = "bento/ubuntu-22.04"
        gateway.vm.network "forwarded_port", guest: 4000, host: 4000, host_ip: "127.0.0.1"
        gateway.vm.network "private_network", ip: "192.168.56.13"
        gateway.vm.synced_folder "./gateway", "/home/vagrant/service/"
        gateway.vm.provision "shell", inline: <<-SHELL
            curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash - &&\
            apt-get install nodejs -y
            node /home/vagrant/service/dist/server.js
        SHELL
    end
    config.vm.define "view" do |view|
        view.vm.box = "bento/ubuntu-22.04"
        view.vm.network "forwarded_port", guest: 4200, host: 4200, host_ip: "127.0.0.1"
        view.vm.network "private_network", ip: "192.168.56.14"
        view.vm.synced_folder "./render", "/home/vagrant/service/"
        view.vm.provision "shell", inline: <<-SHELL
            curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash - &&\
            apt-get install nodejs -y
            cd /home/vagrant/service && npm run ng serve
        SHELL
    end

    config.vm.provision "shell", inline: <<-SHELL
         apt-get update -y
         apt-get install curl -y
    SHELL
end