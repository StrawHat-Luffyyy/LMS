import { getDBStatus } from "../database/db.js";

export const checkHealth = async (req, res) => {
  try {
    const dbStatus = getDBStatus();

    const healthStatus = {
      status: "ok",
      timestamp: new Date().toISOString(),
      database: {
        isConnected: dbStatus.isConnected ? "Healthy" : "Unhealthy",
        details: {
          ...dbStatus,
          readyState: getReadyStateText(dbStatus.readyState),
        },
        server: {
          status: dbStatus.isConnected ? "Healthy" : "Unhealthy",
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
        },
      },
    };

    const httpStatusCode =
      healthStatus.database.isConnected === "Healthy" ? 200 : 503;

    res.status(httpStatusCode).json(healthStatus);
  } catch (error) {
    console.error("Error checking health:", error);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
      timestamp: new Date().toISOString(),
    });
  }
};

function getReadyStateText(state) {
  switch (state) {
    case 0:
      return "Disconnected";
    case 1:
      return "Connected";
    case 2:
      return "Connecting";
    case 3:
      return "Disconnecting";
    default:
      return "Unknown";
  }
}
