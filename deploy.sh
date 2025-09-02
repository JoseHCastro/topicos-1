#!/bin/bash

# Script para desplegar en Kubernetes
set -e

echo "🚀 Desplegando Sistema de Inscripciones UAGRM en Kubernetes"

# Aplicar configuraciones
echo "📝 Aplicando configuraciones..."
kubectl apply -f k8s/config.yaml

# Desplegar base de datos
echo "🗄️ Desplegando PostgreSQL..."
kubectl apply -f k8s/postgres-deployment.yaml

# Desplegar Redis
echo "📊 Desplegando Redis..."
kubectl apply -f k8s/redis-deployment.yaml

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que PostgreSQL esté listo..."
kubectl wait --for=condition=ready pod -l app=postgres --timeout=300s

echo "⏳ Esperando a que Redis esté listo..."
kubectl wait --for=condition=ready pod -l app=redis --timeout=300s

# Desplegar aplicación NestJS
echo "🚀 Desplegando aplicación NestJS..."
kubectl apply -f k8s/nestjs-deployment.yaml

# Desplegar Ingress
echo "🌐 Configurando Ingress..."
kubectl apply -f k8s/ingress.yaml

# Esperar a que la aplicación esté lista
echo "⏳ Esperando a que la aplicación esté lista..."
kubectl wait --for=condition=ready pod -l app=nestjs-app --timeout=300s

echo "✅ Despliegue completado!"
echo ""
echo "📋 Comandos útiles:"
echo "  kubectl get pods                    # Ver estado de los pods"
echo "  kubectl get services                # Ver servicios"
echo "  kubectl logs -l app=nestjs-app      # Ver logs de la aplicación"
echo "  kubectl describe pod <pod-name>     # Ver detalles de un pod"
echo ""
echo "🌐 La aplicación estará disponible en:"
echo "  http://uagrm-inscripciones.tu-dominio.com"
