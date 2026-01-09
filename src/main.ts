import { audit } from "@generated/audit";
import grpc, {
  ServerInterceptingCall,
  type ServerInterceptingCallInterface,
  type ServerMethodDefinition,
} from "@grpc/grpc-js";
import { products as ProtoProducts } from "../generated/proto/products";

import Client from "immudb-node";

const client = new Client({
  host: "localhost",
  port: 3322,
  database: "defaultdb",
});

await client.login({ user: "immudb", password: "immudb" });

class ImplAuditServiceService extends audit.UnimplementedAuditService {
  override Track(
    call: grpc.ServerUnaryCall<audit.TrackRequest, audit.TrackResponse>,
    callback: grpc.sendUnaryData<audit.TrackResponse>
  ): void {
    console.log("Message received: ", call.request.message);
    return callback(
      null,
      new audit.TrackResponse({
        success: true,
      })
    );
  }
}

class ImplProductProductService extends ProtoProducts.UnimplementedProductServiceService {
  override async ListAll(
    call: grpc.ServerUnaryCall<
      ProtoProducts.Empty,
      ProtoProducts.ListAllResponse
    >,
    callback: grpc.sendUnaryData<ProtoProducts.ListAllResponse>
  ): Promise<void> {
    type TProductDb = Array<{ id: number; product: string; price: string }>;
    const products = (await client.SQLQuery({
      sql: "select * from products",
    })) as unknown as TProductDb;
    return callback(
      null,
      new ProtoProducts.ListAllResponse({
        list: products.map((item) => new ProtoProducts.Product(item)),
      })
    );
  }
}

function LoggerInterceptor(
  methodDescriptor: ServerMethodDefinition<any, any>,
  call: ServerInterceptingCallInterface
): ServerInterceptingCall {
  return new ServerInterceptingCall(call, {
    start(next) {
      console.log(`Method called: ${methodDescriptor.path}`);
      next({
        onReceiveMessage(message, messageCb) {
          console.log("Request body:", message.toObject());
          messageCb(message);
        },
        onReceiveHalfClose(halfCloseCb) {
          halfCloseCb();
        },
      });
    },
  });
}

function getGRPcServer() {
  const server = new grpc.Server({
    interceptors: [LoggerInterceptor],
  });
  server.addService(audit.AuditClient.service, new ImplAuditServiceService());
  server.addService(
    ProtoProducts.ProductServiceClient.service,
    new ImplProductProductService()
  );
  return server;
}

const server = getGRPcServer();

server.bindAsync(
  "0.0.0.0:50051",
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`Application running at port ${port}`);
  }
);

async function shutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);

  // Stop accepting new connections
  server.tryShutdown(async (err) => {
    if (err) {
      console.error("Error shutting down gRPC server:", err);
    }

    try {
      // Logout and shutdown immudb client
      await client.logout();
      await client.shutdown();
      console.log("ImmuDB client disconnected");
    } catch (error) {
      console.error("Error closing immudb connection:", error);
    }

    process.exit(0);
  });
}

// Listen for termination signals
process.on("SIGINT", () => shutdown("SIGINT")); // Ctrl+C
process.on("SIGTERM", () => shutdown("SIGTERM")); // kill command

// console.log(await client.logout());
// console.log(await client.shutdown());
