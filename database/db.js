import mongoose from "mongoose";

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000;

class DatabaseConnection {
  constructor() {
    this.retryCount = 0;
    this.isConnected = false;

    mongoose.set("strictQuery", true);

    mongoose.connection.on("connected", () => {
      console.log("Database connected");
      this.isConnected = true;
    });

    mongoose.connection.on("error", (err) => {
      console.error("Database connection error:", err);
      this.isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.log("Database disconnected");
      this.isConnected = false;
      this.handleDisconnection()
    });

    process.on('SIGTERM' , this.handleApplicationTermination.bind(this));
  }

  async connect() {
    try {
      if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not defined in environment variables");
      }

      const connectionOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4, change to 6 for IPv6
      };

      if (process.env.NODE_ENV === "development") {
        mongoose.set("debug", true);
      }

      await mongoose.connect(process.env.MONGO_URI, connectionOptions);
      this.isConnected = true;
      this.retryCount = 0;
    } catch (err) {
      console.error("Error connecting to the database:", err);
      await this.handleConnectionError();
    }
  }

  async handleConnectionError() {
    if (this.retryCount < MAX_RETRIES) {
      this.retryCount++;
      console.log(
        `Retrying database connection (${this.retryCount}/${MAX_RETRIES})...`,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
      await this.connect();
    } else {
      console.error(
        "Max retries reached. Could not connect to the database. Exiting...",
      );
      process.exit(1);
    }
  }

  async handleDisconnection() {
    try {
      if (!this.isConnected) {
        console.log("Database is not connected. No need to disconnect.");
        return;
      }
      await mongoose.disconnect();
      this.isConnected = false;
      console.log("Database disconnected");
    } catch (err) {
      console.error("Error disconnecting from the database:", err);
    }
  }

  async handleApplicationTermination() {
    try {
      await mongoose.connection.close();
      console.log("Database connection closed due to application termination");
      process.exit(0); 
    } catch (error) {
      console.error(
        "Error closing database connection during application termination:",
        error,
      );
      process.exit(1);
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      retryCount: this.retryCount,
      readyState: mongoose.connection.readyState,
      host : mongoose.connection.host,
      name : mongoose.connection.name,
    }

  }
}
