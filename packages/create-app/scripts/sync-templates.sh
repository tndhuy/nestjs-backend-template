#!/usr/bin/env bash
# sync-templates.sh — Copy current template source into packages/create-app/templates/
#
# Usage:
#   bash packages/create-app/scripts/sync-templates.sh
#
# Run this script after any changes to the main template source to keep
# the bundled template snapshots up to date. Run from the repo root.
#
# IMPORTANT: Commit the updated templates/ directory after running this script.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
TEMPLATES_DIR="${SCRIPT_DIR}/../templates"

echo "==> Syncing PostgreSQL template snapshot..."

POSTGRES_DIR="${TEMPLATES_DIR}/postgres"

# Clear existing postgres template
rm -rf "${POSTGRES_DIR}"
mkdir -p "${POSTGRES_DIR}"

# Copy src/ — full DDD template source
cp -r "${REPO_ROOT}/src" "${POSTGRES_DIR}/src"

# Copy prisma/ schema directory
if [ -d "${REPO_ROOT}/prisma" ]; then
  cp -r "${REPO_ROOT}/prisma" "${POSTGRES_DIR}/prisma"
  # Remove CLAUDE.md files from templates (not needed in scaffolded projects)
  find "${POSTGRES_DIR}/prisma" -name "CLAUDE.md" -delete
fi

# Copy prisma.config.ts if it exists
if [ -f "${REPO_ROOT}/prisma.config.ts" ]; then
  cp "${REPO_ROOT}/prisma.config.ts" "${POSTGRES_DIR}/prisma.config.ts"
fi

# Copy root config files (NOT root package.json — use template's own package.json)
cp "${REPO_ROOT}/tsconfig.json" "${POSTGRES_DIR}/tsconfig.json"
cp "${REPO_ROOT}/tsconfig.build.json" "${POSTGRES_DIR}/tsconfig.build.json"
cp "${REPO_ROOT}/nest-cli.json" "${POSTGRES_DIR}/nest-cli.json"

# Copy gitignore
if [ -f "${REPO_ROOT}/.gitignore" ]; then
  cp "${REPO_ROOT}/.gitignore" "${POSTGRES_DIR}/.gitignore"
fi

# Copy env example
if [ -f "${REPO_ROOT}/.env.example" ]; then
  cp "${REPO_ROOT}/.env.example" "${POSTGRES_DIR}/.env.example"
fi

# Copy README
if [ -f "${REPO_ROOT}/README.md" ]; then
  cp "${REPO_ROOT}/README.md" "${POSTGRES_DIR}/README.md"
fi

# Copy docker-compose
if [ -f "${REPO_ROOT}/docker-compose.yml" ]; then
  cp "${REPO_ROOT}/docker-compose.yml" "${POSTGRES_DIR}/docker-compose.yml"
fi

# Copy prometheus.yml
if [ -f "${REPO_ROOT}/prometheus.yml" ]; then
  cp "${REPO_ROOT}/prometheus.yml" "${POSTGRES_DIR}/prometheus.yml"
fi

# Copy eslint config (whichever exists)
if [ -f "${REPO_ROOT}/eslint.config.mjs" ]; then
  cp "${REPO_ROOT}/eslint.config.mjs" "${POSTGRES_DIR}/eslint.config.mjs"
elif [ -f "${REPO_ROOT}/.eslintrc.js" ]; then
  cp "${REPO_ROOT}/.eslintrc.js" "${POSTGRES_DIR}/.eslintrc.js"
fi

# Copy Dockerfile if exists
if [ -f "${REPO_ROOT}/Dockerfile" ]; then
  cp "${REPO_ROOT}/Dockerfile" "${POSTGRES_DIR}/Dockerfile"
fi

# Copy package.json (template's own — not monorepo root)
# This is the template package.json (nestjs-backend-template), not the CLI package.json
cp "${REPO_ROOT}/package.json" "${POSTGRES_DIR}/package.json"

# Remove CLAUDE.md files from templates (not needed in scaffolded projects)
find "${POSTGRES_DIR}/src" -name "CLAUDE.md" -delete

echo "    PostgreSQL snapshot ready at: ${POSTGRES_DIR}"

echo "==> Syncing MongoDB template snapshot..."

MONGO_DIR="${TEMPLATES_DIR}/mongo"

# Start from postgres snapshot as base
rm -rf "${MONGO_DIR}"
cp -r "${POSTGRES_DIR}" "${MONGO_DIR}"

# Remove prisma/ directory (MongoDB doesn't use Prisma)
rm -rf "${MONGO_DIR}/prisma"

# Remove prisma.config.ts if it exists
rm -f "${MONGO_DIR}/prisma.config.ts"

# Overlay mongo-compatible branch files using git show
GIT_MONGO_BRANCH="mongo-compatible"

echo "    Extracting MongoDB-specific files from ${GIT_MONGO_BRANCH} branch..."

# Copy dynamic templates from root (since they use IF blocks now)
cp "${REPO_ROOT}/docker-compose.yml" "${MONGO_DIR}/docker-compose.yml"
cp "${REPO_ROOT}/prometheus.yml" "${MONGO_DIR}/prometheus.yml"

# Function to extract a file from the mongo-compatible branch
extract_mongo_file() {
  local file_path="$1"
  local dest_path="${MONGO_DIR}/${file_path}"
  mkdir -p "$(dirname "${dest_path}")"
  if git show "${GIT_MONGO_BRANCH}:${file_path}" > "${dest_path}" 2>/dev/null; then
    echo "      + ${file_path}"
  else
    echo "      ! Could not extract ${file_path} — creating placeholder"
    cat > "${dest_path}" << 'PLACEHOLDER_EOF'
// TODO: This file should be sourced from the mongo-compatible git branch.
// Run: git show mongo-compatible:<path> > <dest>
// See: packages/create-app/scripts/sync-templates.sh
PLACEHOLDER_EOF
  fi
}

# Remove postgres-specific database files
rm -f "${MONGO_DIR}/src/infrastructure/database/prisma.module.ts"
rm -f "${MONGO_DIR}/src/infrastructure/database/prisma.service.ts"
rm -f "${MONGO_DIR}/src/infrastructure/database/inject-prisma.decorator.ts"
rm -f "${MONGO_DIR}/src/infrastructure/health/prisma.health-indicator.ts"
rm -f "${MONGO_DIR}/src/modules/example/infrastructure/persistence/prisma-item.repository.ts"

# Extract MongoDB-specific files from mongo-compatible branch
extract_mongo_file "src/infrastructure/database/mongodb.module.ts"
extract_mongo_file "src/infrastructure/config/environment.validation.spec.ts"
extract_mongo_file "src/modules/example/infrastructure/persistence/mongoose-item.repository.ts"
extract_mongo_file "src/modules/example/infrastructure/persistence/schemas/item.schema.ts"
extract_mongo_file "src/modules/example/example.module.ts"
extract_mongo_file "src/app.module.ts"
extract_mongo_file "package.json"
extract_mongo_file ".env.example"
extract_mongo_file ".gitignore"
extract_mongo_file "README.md"

echo "    MongoDB snapshot ready at: ${MONGO_DIR}"

echo "==> Template sync complete!"
echo ""
echo "  Next: Review the changes with 'git diff packages/create-app/templates/' and commit."
