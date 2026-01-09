#!/bin/sh

PROTOC_GEN_TS_PATH="./node_modules/.bin/protoc-gen-ts"
PROTOC_GEN_JS_PATH="./node_modules/.bin/grpc_tools_node_protoc_plugin"
OUT_DIR="./generated"

mkdir -p ${OUT_DIR}

protoc \
    --plugin="protoc-gen-ts=${PROTOC_GEN_TS_PATH}" \
    --plugin="protoc-gen-js=${PROTOC_GEN_JS_PATH}" \
    --js_out="import_style=commonjs,binary:${OUT_DIR}" \
    --ts_out="${OUT_DIR}" \
    ./proto/audit.proto \
    ./proto/products.proto
