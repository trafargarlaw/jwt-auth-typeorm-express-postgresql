import { AppDataSource } from "./data-source";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

import routes from "./routes";

AppDataSource.initialize()
  .then(async () => {
    const app = express();
    app.use(bodyParser.json());
    app.use(cookieParser());

    app.use("/", routes);

    app.listen(5000);
    console.log("Server started on port 5000");
  })
  .catch((error) => console.log(error));
