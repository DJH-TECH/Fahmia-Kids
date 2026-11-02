import "./env";
import path from "node:path";
import express from "express";
import { asyncGuard, mountApi, mountAuth, publicAddressAdd, publicAddressRemove, publicCartAdd, publicCartRemove, publicCartSet, publicCatalog, publicFavoriteAdd, publicFavoriteRemove, publicProduct, publicShop, publicSpace, publicSpaceLogout, publicSpaceUpdate, upload, uploadsDir } from "./routes";
import { requireUser } from "./session";

const app = express();
const files = upload();

app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadsDir));

const auth = express.Router();
mountAuth(auth);
app.use("/api/auth", auth);

app.get("/api/shop", (req, res, next) => {
  Promise.resolve(publicShop(req, res)).catch(next);
});
app.get("/api/catalog", (req, res, next) => {
  Promise.resolve(publicCatalog(req, res)).catch(next);
});
app.get("/api/catalog/:id", (req, res, next) => {
  Promise.resolve(publicProduct(req, res)).catch(next);
});
app.get("/api/space", (req, res, next) => {
  Promise.resolve(publicSpace(req, res)).catch(next);
});
app.patch("/api/space", (req, res, next) => {
  Promise.resolve(publicSpaceUpdate(req, res)).catch(next);
});
app.post("/api/space/logout", (req, res, next) => {
  Promise.resolve(publicSpaceLogout(req, res)).catch(next);
});
app.post("/api/space/cart", (req, res, next) => {
  Promise.resolve(publicCartAdd(req, res)).catch(next);
});
app.patch("/api/space/cart/:productId", (req, res, next) => {
  Promise.resolve(publicCartSet(req, res)).catch(next);
});
app.delete("/api/space/cart/:productId", (req, res, next) => {
  Promise.resolve(publicCartRemove(req, res)).catch(next);
});
app.post("/api/space/favorites", (req, res, next) => {
  Promise.resolve(publicFavoriteAdd(req, res)).catch(next);
});
app.delete("/api/space/favorites/:productId", (req, res, next) => {
  Promise.resolve(publicFavoriteRemove(req, res)).catch(next);
});
app.post("/api/space/addresses", (req, res, next) => {
  Promise.resolve(publicAddressAdd(req, res)).catch(next);
});
app.delete("/api/space/addresses/:id", (req, res, next) => {
  Promise.resolve(publicAddressRemove(req, res)).catch(next);
});

const api = express.Router();
api.use(requireUser);
mountApi(api, files);
app.use("/api", api);

app.use(asyncGuard);

const port = Number(process.env.PORT || 4000);
app.listen(port, "127.0.0.1", () => {
  console.log(`API Fahmia Kids sur http://127.0.0.1:${port}`);
});
