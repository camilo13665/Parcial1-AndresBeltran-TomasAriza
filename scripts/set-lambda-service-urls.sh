#!/usr/bin/env bash
# Completa DISPATCH_SERVICE_URL / NOTIFICATION_SERVICE_URL / INTAKE_SERVICE_URL
# en las funciones Lambda que llaman a otro servicio, una vez que el stack ya
# está desplegado y el API Gateway tiene una URL real.
#
# No se puede hacer desde template.yaml: una función referenciando la URL
# del mismo Gateway que la invoca es una dependencia circular para
# CloudFormation (ver el comentario en template.yaml). Este script corre
# DESPUÉS de `sam deploy`, lee la URL real del stack y actualiza cada
# función por separado — mergeando, no reemplazando, sus variables de
# entorno existentes (PORT, AWS_LWA_PORT, STAGE).
#
# Con AutoPublishAlias activo, el Gateway enruta al alias "prod", no a
# $LATEST — así que además de corregir la config, este script publica una
# versión nueva y mueve el alias "prod" a esa versión de una. No pasa por
# el canary gradual (es una corrección de configuración, no un cambio de
# código a validar de a poco); el próximo `sam deploy` con código nuevo sí
# vuelve a hacer el corrimiento gradual normal desde esta versión.
#
# Uso: STACK_NAME=emergencias AWS_REGION=us-east-1 ./scripts/set-lambda-service-urls.sh

set -euo pipefail

STACK_NAME="${STACK_NAME:?Falta STACK_NAME}"
REGION="${AWS_REGION:?Falta AWS_REGION}"

API_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)

if [ -z "$API_URL" ] || [ "$API_URL" = "None" ]; then
  echo "No se pudo obtener el output ApiUrl del stack $STACK_NAME" >&2
  exit 1
fi
echo "API Gateway URL: $API_URL"

set_env() {
  local function_name="$1"
  local extra_json="$2" # ej: '{"DISPATCH_SERVICE_URL":"https://..."}'

  local current merged
  current=$(aws lambda get-function-configuration --function-name "$function_name" --region "$REGION" \
    --query "Environment.Variables" --output json)
  merged=$(jq -c --argjson extra "$extra_json" '{Variables: (. + $extra)}' <<<"$current")

  aws lambda update-function-configuration --function-name "$function_name" --region "$REGION" \
    --environment "$merged" >/dev/null
  aws lambda wait function-updated --function-name "$function_name" --region "$REGION"

  local new_version
  new_version=$(aws lambda publish-version --function-name "$function_name" --region "$REGION" \
    --query "Version" --output text)
  aws lambda update-alias --function-name "$function_name" --name prod \
    --function-version "$new_version" --region "$REGION" >/dev/null

  echo "  $function_name actualizado (versión $new_version, alias prod movido)."
}

echo "Actualizando emergencias-intake-triage..."
set_env "emergencias-intake-triage" "$(jq -nc --arg u "$API_URL" '{DISPATCH_SERVICE_URL:$u, NOTIFICATION_SERVICE_URL:$u}')"

echo "Actualizando emergencias-dispatch..."
set_env "emergencias-dispatch" "$(jq -nc --arg u "$API_URL" '{INTAKE_SERVICE_URL:$u}')"

echo "Actualizando emergencias-geospatial..."
set_env "emergencias-geospatial" "$(jq -nc --arg u "$API_URL" '{INTAKE_SERVICE_URL:$u}')"

echo "Listo. Las 3 funciones ahora se llaman entre sí a través de $API_URL."
