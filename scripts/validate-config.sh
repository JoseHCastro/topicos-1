#!/bin/bash
# 🧪 Script de Validación de Configuración
# Valida que todas las variables de entorno estén funcionando correctamente

echo "🔍 VALIDANDO CONFIGURACIÓN DEL SISTEMA DE COLAS..."
echo "================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para validar endpoint
validate_endpoint() {
    local url=$1
    local description=$2
    
    echo -n "🔍 Validando $description... "
    
    if curl -f -s "$url" > /dev/null; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

# Función para validar variables de entorno
validate_env_vars() {
    echo "📋 Validando variables de entorno críticas..."
    
    local required_vars=(
        "REDIS_HOST"
        "REDIS_PORT"
        "DB_HOST"
        "DB_PORT"
        "QUEUE_CRITICAL_TIMEOUT"
        "WORKER_MAX_HEAP_MB"
    )
    
    local missing_vars=0
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "${RED}❌ Variable $var no definida${NC}"
            ((missing_vars++))
        else
            echo -e "${GREEN}✅ $var=${!var}${NC}"
        fi
    done
    
    if [ $missing_vars -eq 0 ]; then
        echo -e "${GREEN}✅ Todas las variables críticas están definidas${NC}"
        return 0
    else
        echo -e "${RED}❌ $missing_vars variables críticas faltantes${NC}"
        return 1
    fi
}

# Función para validar la configuración activa
validate_system_config() {
    echo "🎯 Validando configuración del sistema..."
    
    local config_response=$(curl -s http://localhost:3000/monitoring/config 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Endpoint de configuración accesible${NC}"
        
        # Validar que la respuesta contiene configuración válida
        if echo "$config_response" | grep -q "environment"; then
            echo -e "${GREEN}✅ Configuración válida encontrada${NC}"
            
            # Mostrar configuración actual
            echo "📊 Configuración actual:"
            echo "$config_response" | jq . 2>/dev/null || echo "$config_response"
        else
            echo -e "${YELLOW}⚠️  Respuesta de configuración inesperada${NC}"
        fi
    else
        echo -e "${RED}❌ No se puede acceder al endpoint de configuración${NC}"
        echo "   Asegúrate de que el servidor esté ejecutándose en localhost:3000"
        return 1
    fi
}

# Función para validar el sistema de colas
validate_queue_system() {
    echo "🔄 Validando sistema de colas..."
    
    # Verificar estado de las colas
    local queue_status=$(curl -s http://localhost:3000/queue-control/status 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Sistema de colas accesible${NC}"
        
        # Verificar que las tres colas estén configuradas
        if echo "$queue_status" | grep -q "critical\|standard\|background"; then
            echo -e "${GREEN}✅ Colas especializadas detectadas${NC}"
        else
            echo -e "${YELLOW}⚠️  Configuración de colas inesperada${NC}"
        fi
    else
        echo -e "${RED}❌ Sistema de colas no accesible${NC}"
        return 1
    fi
}

# Función para validar Redis
validate_redis_connection() {
    echo "📡 Validando conexión a Redis..."
    
    if command -v redis-cli &> /dev/null; then
        if redis-cli -h "${REDIS_HOST:-localhost}" -p "${REDIS_PORT:-6379}" ping > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Redis accesible${NC}"
        else
            echo -e "${RED}❌ Redis no accesible${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  redis-cli no encontrado, saltando validación directa${NC}"
    fi
}

# Función para validar Docker Compose
validate_docker_services() {
    echo "🐳 Validando servicios Docker..."
    
    if command -v docker-compose &> /dev/null; then
        local running_services=$(docker-compose ps --services --filter "status=running" 2>/dev/null)
        
        if echo "$running_services" | grep -q "redis\|postgres"; then
            echo -e "${GREEN}✅ Servicios Docker ejecutándose${NC}"
        else
            echo -e "${YELLOW}⚠️  Servicios Docker no detectados (¿docker-compose up?)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  docker-compose no encontrado${NC}"
    fi
}

# Función para test de carga básico
run_basic_load_test() {
    echo "⚡ Ejecutando test de carga básico..."
    
    # Crear algunos jobs de prueba
    for i in {1..5}; do
        curl -s -X POST http://localhost:3000/queue-control/test-load \
             -H "Content-Type: application/json" \
             -d '{"testJobs": 1}' > /dev/null
        
        if [ $? -eq 0 ]; then
            echo -n "."
        else
            echo -n "x"
        fi
    done
    
    echo ""
    echo -e "${GREEN}✅ Test de carga básico completado${NC}"
}

# Función principal
main() {
    echo "🚀 INICIANDO VALIDACIÓN COMPLETA..."
    echo "Fecha: $(date)"
    echo ""
    
    local errors=0
    
    # Validar variables de entorno
    validate_env_vars || ((errors++))
    echo ""
    
    # Validar servicios Docker
    validate_docker_services
    echo ""
    
    # Validar Redis
    validate_redis_connection || ((errors++))
    echo ""
    
    # Validar endpoints del sistema
    validate_endpoint "http://localhost:3000/health" "Health Check" || ((errors++))
    validate_endpoint "http://localhost:3000/monitoring/resources" "Monitoreo de Recursos" || ((errors++))
    validate_endpoint "http://localhost:3000/queue-control/status" "Estado de Colas" || ((errors++))
    echo ""
    
    # Validar configuración del sistema
    validate_system_config || ((errors++))
    echo ""
    
    # Validar sistema de colas
    validate_queue_system || ((errors++))
    echo ""
    
    # Test de carga básico
    if [ $errors -eq 0 ]; then
        run_basic_load_test
    else
        echo -e "${YELLOW}⚠️  Saltando test de carga debido a errores previos${NC}"
    fi
    
    echo ""
    echo "================================================="
    
    if [ $errors -eq 0 ]; then
        echo -e "${GREEN}🎉 ¡VALIDACIÓN COMPLETADA EXITOSAMENTE!${NC}"
        echo -e "${GREEN}✅ Todas las configuraciones están funcionando correctamente${NC}"
        echo ""
        echo "📋 Para consultar la configuración actual:"
        echo "   curl http://localhost:3000/monitoring/config | jq"
        echo ""
        echo "🔄 Para monitorear las colas:"
        echo "   curl http://localhost:3000/queue-control/status | jq"
        return 0
    else
        echo -e "${RED}❌ VALIDACIÓN FALLÓ CON $errors ERRORES${NC}"
        echo ""
        echo "🔧 Pasos para resolver:"
        echo "1. Verifica que docker-compose esté ejecutándose: docker-compose up -d"
        echo "2. Verifica que el servidor NestJS esté ejecutándose: npm run start:dev"
        echo "3. Revisa las variables de entorno en tu archivo .env"
        echo "4. Consulta los logs: docker-compose logs"
        return 1
    fi
}

# Ejecutar validación
main "$@"