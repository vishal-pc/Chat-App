import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { envConfig } from "./config/envConfig";
import session from "express-session";
import "../src/config/db";

import route from "../src/routes/routes";
import { app, server } from "./socket/socket";

const Port = envConfig.Port;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({ origin: "*", methods: "GET, POST, PUT, DELETE" }));
app.use(
  session({
    secret: envConfig.Express_Secret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use("/api/v1", route);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

server.listen(Port, () => {
  console.log(`Server is running... 🚀`);
  const error = false;
  if (error) {
    console.log("Server is not running...😴");
  }
});
