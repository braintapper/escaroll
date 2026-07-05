#!/usr/bin/env bash
# Build the Escaroll Docker image and push it to the registry.
#
# Usage:
#   ./build-push.sh [tag]
#
# Examples:
#   ./build-push.sh            # builds and pushes :latest
#   ./build-push.sh v1.2.0     # builds and pushes :v1.2.0 (and :latest)
set -euo pipefail

REGISTRY="unraid.slantyyz.com:5000"
IMAGE="escaroll"
TAG="${1:-latest}"

REF="${REGISTRY}/${IMAGE}:${TAG}"
LATEST_REF="${REGISTRY}/${IMAGE}:latest"

echo "Building ${REF}..."
docker build -t "${REF}" -t "${LATEST_REF}" .

echo "Pushing ${REF}..."
docker push "${REF}"

if [ "${TAG}" != "latest" ]; then
  echo "Pushing ${LATEST_REF}..."
  docker push "${LATEST_REF}"
fi

echo "Done: ${REF}"
