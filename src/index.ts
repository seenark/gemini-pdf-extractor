import Elysia from "elysia";

const app = new Elysia();

app.get("/health", () => "Ok");

app.listen(3000);
console.log("server start at port:", 3000);
