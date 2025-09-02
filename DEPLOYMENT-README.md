# 📋 DEPLOYMENT SIMPLIFICADO - Proyecto Topicos-1 UAGRM

## ✅ IMAGEN DOCKER LISTA
Tu imagen Docker ya está lista y disponible en:
- **Docker Hub**: `nukesito/topicos-1:latest`
- **Tamaño**: 384MB (optimizada) 
- **Estado**: ✅ Funcionando con Docker directo

## 🏗️ ARQUITECTURA DE 3 EC2s

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   EC2 "base"    │    │   EC2 "redis"   │    │  EC2 "nestjs"   │
│                 │    │                 │    │                 │
│  📊 PostgreSQL  │    │  🔴 Redis Cache │    │  🚀 NestJS App  │
│   Puerto: 5432  │    │   Puerto: 6379  │    │   Puerto: 3000  │
│                 │    │                 │    │  + Kubernetes   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 COMANDOS PARA CADA EC2

### 1. EC2 "base" (PostgreSQL)
```bash
# Actualizar sistema
sudo yum update -y

# Instalar Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# IMPORTANTE: Salir y volver a conectar para aplicar permisos
exit

# Después de reconectar:
docker run -d \
  --name postgres \
  --restart unless-stopped \
  -e POSTGRES_DB=topicos_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine
```

### 2. EC2 "redis" (Redis Cache)
```bash
# Actualizar sistema
sudo yum update -y

# Instalar Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# IMPORTANTE: Salir y volver a conectar para aplicar permisos
exit

# Después de reconectar:
docker run -d \
  --name redis \
  --restart unless-stopped \
  -p 6379:6379 \
  -v redis_data:/data \
  redis:7-alpine redis-server --appendonly yes
```

### 3. EC2 "nestjs" (Aplicación + Kubernetes)
```bash
# Actualizar sistema
sudo yum update -y

# Instalar Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Instalar k3s (Kubernetes ligero)
curl -sfL https://get.k3s.io | sh -

# Configurar kubectl
sudo chmod 644 /etc/rancher/k3s/k3s.yaml
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
```

## 📝 OBTENER IPs PRIVADAS

En cada EC2, ejecuta:
```bash
hostname -I
```

Anota las IPs:
- **EC2 "base"**: `___.___.___.___ ` (PostgreSQL)
- **EC2 "redis"**: `___.___.___.___ ` (Redis)
- **EC2 "nestjs"**: `___.___.___.___ ` (NestJS)

## ⚙️ CONFIGURAR KUBERNETES

1. **Descargar archivos** (en EC2 "nestjs"):
```bash
# Crear directorio
mkdir -p ~/k8s
cd ~/k8s

# Descargar configuraciones
curl -O https://raw.githubusercontent.com/JoseHCastro/topicos-1/develop/k8s/config.yaml
curl -O https://raw.githubusercontent.com/JoseHCastro/topicos-1/develop/k8s/nestjs-deployment.yaml
curl -O https://raw.githubusercontent.com/JoseHCastro/topicos-1/develop/k8s/ingress.yaml
```

2. **Editar IPs** en `config.yaml`:
```bash
nano config.yaml
```
Reemplazar:
- `REPLACE_WITH_POSTGRES_EC2_PRIVATE_IP` → IP del EC2 "base"
- `REPLACE_WITH_REDIS_EC2_PRIVATE_IP` → IP del EC2 "redis"

3. **Desplegar aplicación**:
```bash
# Aplicar configuraciones
kubectl apply -f config.yaml
kubectl apply -f nestjs-deployment.yaml
kubectl apply -f ingress.yaml

# Verificar estado
kubectl get pods
kubectl get services
```

## 🔍 VERIFICACIÓN

```bash
# Ver pods en ejecución
kubectl get pods -o wide

# Ver logs de la aplicación
kubectl logs deployment/nestjs-app -f

# Probar la aplicación
curl http://localhost:3000/api-docs
```

## 🌐 ACCESO EXTERNO

Tu aplicación estará disponible en:
- **Swagger API**: `http://IP_PUBLICA_EC2_NESTJS:3000/api-docs`
- **API**: `http://IP_PUBLICA_EC2_NESTJS:3000/api/`

## 🔒 SECURITY GROUPS

Asegúrate de que tus Security Groups permitan:
- **Puerto 5432**: Entre EC2s (PostgreSQL)
- **Puerto 6379**: Entre EC2s (Redis)  
- **Puerto 3000**: Desde Internet (NestJS)
- **Puerto 22**: Para SSH/Instance Connect

## ⚠️ NOTAS IMPORTANTES

1. **Contraseñas**: Cambia las contraseñas por valores seguros
2. **Persistencia**: Los datos se mantienen en volúmenes Docker
3. **Monitoreo**: Usa `kubectl logs` para ver logs
4. **Escalabilidad**: Kubernetes puede escalar automáticamente

## 🆘 RESOLUCIÓN DE PROBLEMAS

```bash
# Si los pods no inician
kubectl describe pod <pod-name>

# Si hay errores de conexión
kubectl exec -it <pod-name> -- nslookup <service-name>

# Verificar conectividad
kubectl exec -it <pod-name> -- ping <ip-address>
```

¡Tu aplicación está lista para producción! 🎉
