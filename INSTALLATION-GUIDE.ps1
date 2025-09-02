# Script de instalación para EC2s - Proyecto Topicos-1 UAGRM
# Ejecutar en PowerShell como Administrador

Write-Host "🚀 Guía de instalación para EC2s - Proyecto Topicos-1" -ForegroundColor Green

Write-Host "`n📋 PASOS A SEGUIR:" -ForegroundColor Yellow

Write-Host "`n1️⃣ CONECTAR A CADA EC2:" -ForegroundColor Cyan
Write-Host "   Para conectarte a cada EC2 sin key pair, usa EC2 Instance Connect:"
Write-Host "   - Ve a AWS Console > EC2 > Instances"
Write-Host "   - Selecciona tu instancia"
Write-Host "   - Click en 'Connect' > 'EC2 Instance Connect'"
Write-Host "   - Username: ec2-user"
Write-Host "   - Click 'Connect'"

Write-Host "`n2️⃣ EC2 'BASE' (PostgreSQL):" -ForegroundColor Magenta
Write-Host "   Ejecuta estos comandos en el EC2 'base':"
Write-Host @"
   sudo yum update -y
   sudo yum install -y docker
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -aG docker ec2-user
   
   # Reiniciar sesión para aplicar permisos de docker
   exit
   
   # Conectarse nuevamente y ejecutar:
   docker run -d \
     --name postgres \
     --restart unless-stopped \
     -e POSTGRES_DB=topicos_db \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD \
     -p 5432:5432 \
     -v postgres_data:/var/lib/postgresql/data \
     postgres:15-alpine
"@

Write-Host "`n3️⃣ EC2 'REDIS' (Redis Cache):" -ForegroundColor Red
Write-Host "   Ejecuta estos comandos en el EC2 'redis':"
Write-Host @"
   sudo yum update -y
   sudo yum install -y docker
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -aG docker ec2-user
   
   # Reiniciar sesión para aplicar permisos de docker
   exit
   
   # Conectarse nuevamente y ejecutar:
   docker run -d \
     --name redis \
     --restart unless-stopped \
     -p 6379:6379 \
     -v redis_data:/data \
     redis:7-alpine redis-server --appendonly yes
"@

Write-Host "`n4️⃣ EC2 'NESTJS' (Aplicación):" -ForegroundColor Blue
Write-Host "   Ejecuta estos comandos en el EC2 'nestjs':"
Write-Host @"
   sudo yum update -y
   sudo yum install -y docker
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -aG docker ec2-user
   
   # Instalar k3s (Kubernetes ligero)
   curl -sfL https://get.k3s.io | sh -
   sudo chmod 644 /etc/rancher/k3s/k3s.yaml
   mkdir -p ~/.kube
   sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
   sudo chown $(id -u):$(id -g) ~/.kube/config
"@

Write-Host "`n5️⃣ OBTENER IPs PRIVADAS:" -ForegroundColor Yellow
Write-Host "   En cada EC2, ejecuta: hostname -I"
Write-Host "   Anota las IPs privadas de cada servidor:"
Write-Host "   - EC2 'base': IP_POSTGRES"
Write-Host "   - EC2 'redis': IP_REDIS"
Write-Host "   - EC2 'nestjs': IP_NESTJS"

Write-Host "`n6️⃣ CONFIGURAR IPs EN KUBERNETES:" -ForegroundColor Green
Write-Host "   Edita el archivo k8s/config.yaml y reemplaza:"
Write-Host "   - REPLACE_WITH_POSTGRES_EC2_PRIVATE_IP con la IP del EC2 'base'"
Write-Host "   - REPLACE_WITH_REDIS_EC2_PRIVATE_IP con la IP del EC2 'redis'"

Write-Host "`n7️⃣ DESPLEGAR EN KUBERNETES:" -ForegroundColor Cyan
Write-Host "   En el EC2 'nestjs', ejecuta:"
Write-Host @"
   # Descargar archivos de configuración
   wget https://raw.githubusercontent.com/JoseHCastro/topicos-1/develop/k8s/config.yaml
   wget https://raw.githubusercontent.com/JoseHCastro/topicos-1/develop/k8s/nestjs-deployment.yaml
   wget https://raw.githubusercontent.com/JoseHCastro/topicos-1/develop/k8s/ingress.yaml
   
   # Editar config.yaml con las IPs correctas
   nano config.yaml
   
   # Aplicar configuraciones
   kubectl apply -f config.yaml
   kubectl apply -f nestjs-deployment.yaml
   kubectl apply -f ingress.yaml
   
   # Verificar estado
   kubectl get pods
   kubectl get services
"@

Write-Host "`n✅ VERIFICACIÓN:" -ForegroundColor Green
Write-Host "   Para verificar que todo funciona:"
Write-Host "   kubectl get pods -o wide"
Write-Host "   kubectl logs deployment/nestjs-app"
Write-Host "   curl http://localhost:3000/health"

Write-Host "`n🔗 ACCESO EXTERNO:" -ForegroundColor Magenta
Write-Host "   Tu aplicación estará disponible en:"
Write-Host "   http://IP_PUBLICA_DEL_EC2_NESTJS:3000"

Write-Host "`n📝 NOTAS IMPORTANTES:" -ForegroundColor Red
Write-Host "   - Asegúrate de que los Security Groups permitan:"
Write-Host "     * Puerto 5432 entre EC2s (PostgreSQL)"
Write-Host "     * Puerto 6379 entre EC2s (Redis)"
Write-Host "     * Puerto 3000 desde Internet (NestJS)"
Write-Host "   - Cambia las contraseñas por defecto en producción"
Write-Host "   - Considera usar RDS y ElastiCache para mayor estabilidad"
