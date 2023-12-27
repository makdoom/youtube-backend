import dotenv from "dotenv";

import connectDB from "./db/index.js";
import app from "./app.js";

// dotenv configuration in module type
dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    // Connection Listner
    app.listen(process.env.PORT || 5000, () => {
      console.log(`✅ Server up and running at ${process.env.PORT}`);
    });

    // Error Listner
    app.on("error", (error) => {
      console.log(`❌ Connection Error ${error}`);
    });
  })
  .catch((error) => {
    console.log(`MongoDB connection failed ${error}`);
  });
