#!/bin/bash

# Script para construir y subir imagen Docker
set -e

# Configuración
DOCKER_USERNAME="nukesito"
IMAGE_NAME="topicos-1"
TAG=${1:-latest}

echo "🐳 Construyendo imagen Docker..."

# Construir la imagen
docker build -t $DOCKER_USERNAME/$IMAGE_NAME:$TAG .

# También tagear como latest si no es latest
if [ "$TAG" != "latest" ]; then
    docker tag $DOCKER_USERNAME/$IMAGE_NAME:$TAG $DOCKER_USERNAME/$IMAGE_NAME:latest
fi

echo "📊 Información de la imagen:"
docker images | grep $IMAGE_NAME

echo "📤 Subiendo imagen a Docker Hub..."

# Subir la imagen
docker push $DOCKER_USERNAME/$IMAGE_NAME:$TAG

if [ "$TAG" != "latest" ]; then
    docker push $DOCKER_USERNAME/$IMAGE_NAME:latest
fi

echo "✅ Imagen subida exitosamente!"
echo "🚀 Para desplegar, ejecuta: ./deploy.sh"

# Mostrar tamaño de la imagen
echo ""
echo "📏 Tamaño de la imagen:"
docker images $DOCKER_USERNAME/$IMAGE_NAME:$TAG --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
