import { setServers } from "node:dns";

import mongoose from "mongoose";

type MongoDatabaseConfig = {
  databaseName: string;
  dnsServers?: string[];
  uri: string;
};

export const connectToDatabase = async ({
  databaseName,
  dnsServers = [],
  uri,
}: MongoDatabaseConfig): Promise<void> => {
  if (dnsServers.length > 0) {
    setServers(dnsServers);
  }

  await mongoose.connect(uri, {
    dbName: databaseName,
    serverSelectionTimeoutMS: 10_000,
  });
};

export const disconnectFromDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};
