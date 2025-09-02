#!/bin/bash

# Script para configurar EC2s para el proyecto Topicos-1
# Autor: UAGRM System

set -e

echo "🚀 Configurando EC2s para proyecto Topicos-1..."

# Función para configurar Docker en un EC2
install_docker() {
    echo "📦 Instalando Docker..."
    sudo yum update -y
    sudo yum install -y docker
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker ec2-user
    echo "✅ Docker instalado correctamente"
}

# Función para configurar Kubernetes
install_kubernetes() {
    echo "🏗️ Instalando Kubernetes (k3s)..."
    curl -sfL https://get.k3s.io | sh -
    sudo chmod 644 /etc/rancher/k3s/k3s.yaml
    mkdir -p ~/.kube
    sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
    sudo chown $(id -u):$(id -g) ~/.kube/config
    echo "✅ Kubernetes instalado correctamente"
}

# Función para configurar PostgreSQL
setup_postgres() {
    echo "🐘 Configurando PostgreSQL..."
    sudo yum install -y docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Ejecutar PostgreSQL en Docker
    docker run -d \
        --name postgres \
        --restart unless-stopped \
        -e POSTGRES_DB=topicos_db \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD \
        -p 5432:5432 \
        -v postgres_data:/var/lib/postgresql/data \
        postgres:15-alpine
    
    echo "✅ PostgreSQL configurado en puerto 5432"
}

# Función para configurar Redis
setup_redis() {
    echo "🔴 Configurando Redis..."
    sudo yum install -y docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Ejecutar Redis en Docker
    docker run -d \
        --name redis \
        --restart unless-stopped \
        -p 6379:6379 \
        -v redis_data:/data \
        redis:7-alpine redis-server --appendonly yes
    
    echo "✅ Redis configurado en puerto 6379"
}

# Verificar argumentos
case "$1" in
    "postgres")
        echo "🐘 Configurando EC2 como servidor PostgreSQL..."
        install_docker
        setup_postgres
        ;;
    "redis")
        echo "🔴 Configurando EC2 como servidor Redis..."
        install_docker
        setup_redis
        ;;
    "nestjs")
        echo "🏗️ Configurando EC2 como servidor Kubernetes para NestJS..."
        install_docker
        install_kubernetes
        ;;
    *)
        echo "❌ Uso: $0 {postgres|redis|nestjs}"
        echo "  postgres - Configura EC2 para PostgreSQL"
        echo "  redis    - Configura EC2 para Redis"
        echo "  nestjs   - Configura EC2 para aplicación NestJS con Kubernetes"
        exit 1
        ;;
esac

echo "🎉 Configuración completada exitosamente!"
echo "📝 Recuerda anotar la IP privada de este EC2 para la configuración de Kubernetes"
