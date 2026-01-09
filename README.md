# gRPC Audit API

A gRPC server application that integrates with ImmuDB for tamper-evident audit tracking and product management.

## Overview

This project provides a high-performance gRPC API with two main services:

- **Audit Service**: Track and log audit events with tamper-evidence using ImmuDB
- **Product Service**: Retrieve product information from the ImmuDB ledger database

Built with [Bun](https://bun.com) for fast server-side JavaScript/TypeScript execution, [@grpc/grpc-js](https://www.npmjs.com/package/@grpc/grpc-js) for gRPC protocol implementation, and ImmuDB for cryptographically-verified data integrity.

## Prerequisites

- [Bun](https://bun.sh) (or Node.js v18+)
- ImmuDB instance running on `localhost:3322`
  - Default credentials: `immudb`/`immudb`
  - Default database: `defaultdb`

## Quick Start

### Installation

```bash
bun install
```

### Running the Server

```bash
bun run src/main.ts
```

The gRPC server will start on `0.0.0.0:50051`.

### Docker Setup (ImmuDB)

If you don't have ImmuDB running, use the included docker-compose file:

```bash
docker-compose up -d
```

This starts an ImmuDB instance with the default credentials configured.

## Architecture

### Project Structure

```
├── src/main.ts              # gRPC server implementation
├── proto/                   # Protocol buffer definitions
│   ├── audit.proto         # Audit service definition
│   └── products.proto      # Product service definition
├── generated/              # Generated code from .proto files
├── index.ts                # Entry point
└── docker-compose.yml      # ImmuDB container setup
```

### Services

#### Audit Service

Logs audit events to ImmuDB with cryptographic verification.

- `Track(TrackRequest) -> TrackResponse`: Record an audit event

#### Product Service

Manages and queries products stored in ImmuDB.

- `ListAll(Empty) -> ListAllResponse`: Retrieve all products with id, product name, and price

### Interceptors

The server includes a logging interceptor that logs:
- Method name for each gRPC call
- Full request body for debugging and monitoring

## Configuration

Connection settings for ImmuDB are hardcoded in `src/main.ts`:

```typescript
const client = new Client({
  host: "localhost",
  port: 3322,
  database: "defaultdb",
});
```

Credentials:
- User: `immudb`
- Password: `immudb`

## Development

### Generate Protocol Buffers

To regenerate the TypeScript code from `.proto` files:

```bash
bunx grpc-tools protoc \
  --js_out=import_style=commonjs,binary:./generated \
  --grpc_out=grpc_js:./generated \
  --plugin=protoc-gen-grpc=./node_modules/.bin/grpc_tools_node_protoc_plugin \
  proto/*.proto
```

### Dependencies

- `@grpc/grpc-js` - gRPC implementation for JavaScript
- `@grpc/proto-loader` - Protocol buffer loader
- `@codenotary/immudb-node` - ImmuDB client library
- `google-protobuf` - Protocol buffer library
- `grpc-tools` - Protocol buffer compiler utilities

## API Testing

You can test the gRPC API using tools like:

- [Evans](https://github.com/ktr0731/evans) - gRPC CLI client
- [grpcurl](https://github.com/fullstorydev/grpcurl) - gRPC command-line tool
- Postman (with gRPC support)

Example with grpcurl:

```bash
grpcurl -plaintext -d '{"message": "test"}' localhost:50051 audit.AuditService/Track
```

## Shutdown

The server gracefully handles termination signals (SIGINT and SIGTERM) by:
1. Stopping acceptance of new connections
2. Waiting for in-flight requests to complete
3. Closing the ImmuDB client connection
4. Exiting cleanly
