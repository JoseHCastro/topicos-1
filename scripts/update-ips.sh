#!/bin/bash

# Script para actualizar IPs en la configuración de Kubernetes
# Proyecto: Topicos-1 UAGRM

echo "🔧 Actualizando configuración de Kubernetes con IPs privadas..."

# Variables - REEMPLAZAR CON LAS IPs PRIVADAS REALES
POSTGRES_PRIVATE_IP="REPLACE_WITH_POSTGRES_PRIVATE_IP"  # IP privada del EC2 "base"
REDIS_PRIVATE_IP="REPLACE_WITH_REDIS_PRIVATE_IP"        # IP privada del EC2 "redis"

echo "📝 Configurando:"
echo "   PostgreSQL: $POSTGRES_PRIVATE_IP:5432"
echo "   Redis: $REDIS_PRIVATE_IP:6379"

# Crear archivo de configuración actualizado
cat > k8s/config-updated.yaml << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  # Base de datos - IP privada del EC2 "base"
  DB_HOST: "$POSTGRES_PRIVATE_IP"
  DB_PORT: "5432"
  DB_NAME: "topicos_db"
  # Redis - IP privada del EC2 "redis"  
  REDIS_HOST: "$REDIS_PRIVATE_IP"
  REDIS_PORT: "6379"
  PORT: "3000"
  NODE_ENV: "production"
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  # Los valores deben estar en base64
  # Para generar: echo -n "tu_valor" | base64
  DB_USER: cG9zdGdyZXM=  # postgres
  DB_PASSWORD: WU9VUl9TRUNVX01FX1BSFRD9SRE==  # YOUR_SECURE_PASSWORD - CAMBIAR EN PRODUCCIÓN
  JWT_SECRET: eW91cl9zdXBlcl9zZWNyZXRfand0X2tleV9oZXJlX21ha2VfaXRfbG9uZ19hbmRfc2VjdXJl  # JWT secret
EOF

echo "✅ Archivo k8s/config-updated.yaml creado"
echo "🔄 Para aplicar: kubectl apply -f k8s/config-updated.yaml"
