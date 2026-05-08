#!/bin/bash

# 🌱 Seeders Setup Script
# Este script verifica que todo está bien configurado para ejecutar los seeders

set -e

echo "════════════════════════════════════════════════════════════"
echo "🌱 Verificador de Seeders - ms-logica"
echo "════════════════════════════════════════════════════════════"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar archivos
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1"
        return 1
    fi
}

# Función para verificar directorios
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        return 0
    else
        echo -e "${RED}✗${NC} $1/"
        return 1
    fi
}

echo "1️⃣  Verificando directorios..."
echo "─────────────────────────────"

check_dir "src/seeders"
check_dir "src/seeders/factories"
check_dir "src/seeders/seeds"

echo ""
echo "2️⃣  Verificando factories..."
echo "─────────────────────────────"

check_file "src/seeders/factories/faker.factory.ts"
check_file "src/seeders/factories/direccion.factory.ts"
check_file "src/seeders/factories/ciudadano.factory.ts"
check_file "src/seeders/factories/nodo.factory.ts"
check_file "src/seeders/factories/paradero.factory.ts"
check_file "src/seeders/factories/ruta.factory.ts"
check_file "src/seeders/factories/historial.factory.ts"
check_file "src/seeders/factories/persona.factory.ts"
check_file "src/seeders/factories/grupo.factory.ts"
check_file "src/seeders/factories/mensaje.factory.ts"

echo ""
echo "3️⃣  Verificando seeders..."
echo "─────────────────────────────"

check_file "src/seeders/seeds/01-direccion.seeder.ts"
check_file "src/seeders/seeds/02-ciudadano.seeder.ts"
check_file "src/seeders/seeds/03-nodo.seeder.ts"
check_file "src/seeders/seeds/04-paradero.seeder.ts"
check_file "src/seeders/seeds/05-ruta.seeder.ts"
check_file "src/seeders/seeds/06-historial.seeder.ts"
check_file "src/seeders/seeds/07-persona.seeder.ts"
check_file "src/seeders/seeds/08-grupo.seeder.ts"
check_file "src/seeders/seeds/09-grupo-persona.seeder.ts"
check_file "src/seeders/seeds/10-mensaje.seeder.ts"
check_file "src/seeders/seeds/11-destinatario.seeder.ts"
check_file "src/seeders/seeds/12-epayco.seeder.ts"

echo ""
echo "4️⃣  Verificando servicios..."
echo "─────────────────────────────"

check_file "src/seeders/seeder.service.ts"
check_file "src/seeders/seeder.module.ts"
check_file "src/seeders/seed.runner.ts"
check_file "src/seeders/index.ts"

echo ""
echo "5️⃣  Verificando documentación..."
echo "─────────────────────────────"

check_file "src/seeders/README.md"
check_file "src/seeders/SETUP.md"
check_file "src/seeders/DEPENDENCIES.md"
check_file "src/seeders/EXAMPLE.controller.ts"
check_file "src/seeders/CHECKLIST.md"

echo ""
echo "6️⃣  Verificando configuración..."
echo "─────────────────────────────"

if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    
    if grep -q "DB_HOST" .env; then
        echo -e "${GREEN}✓${NC} DB_HOST configured"
    else
        echo -e "${YELLOW}⚠${NC} DB_HOST not found in .env"
    fi
    
    if grep -q "DB_NAME" .env; then
        echo -e "${GREEN}✓${NC} DB_NAME configured"
    else
        echo -e "${YELLOW}⚠${NC} DB_NAME not found in .env"
    fi
else
    echo -e "${RED}✗${NC} .env file missing"
fi

echo ""
echo "7️⃣  Verificando package.json scripts..."
echo "─────────────────────────────"

if grep -q '"seed":' package.json; then
    echo -e "${GREEN}✓${NC} npm run seed"
else
    echo -e "${RED}✗${NC} npm run seed not found"
fi

if grep -q '"seed:clear":' package.json; then
    echo -e "${GREEN}✓${NC} npm run seed:clear"
else
    echo -e "${RED}✗${NC} npm run seed:clear not found"
fi

if grep -q '"seed:reseed":' package.json; then
    echo -e "${GREEN}✓${NC} npm run seed:reseed"
else
    echo -e "${RED}✗${NC} npm run seed:reseed not found"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ Verificación completada"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📚 Próximos pasos:"
echo "  1. Verificar la conexión a MySQL: mysql -u root -p"
echo "  2. Ejecutar seeders: npm run seed"
echo "  3. Verificar datos: SELECT COUNT(*) FROM direcciones;"
echo ""
echo "📖 Documentación:"
echo "  - README.md      → Uso detallado"
echo "  - SETUP.md       → Configuración"
echo "  - CHECKLIST.md   → Verificación manual"
echo "  - DEPENDENCIES.md → Mapa de dependencias"
echo ""
