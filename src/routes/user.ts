import { Router } from "express";
import UserController from "../controllers/UserController";
import { checkJwt } from "../middlewares/checkJwt";

const router = Router();

//Get all users
router.get("/", UserController.listAll);

// Get one user
router.get("/:id([0-9]+)", [checkJwt], UserController.getOneById); //profile

//Create a new user
router.post("/register", UserController.newUser);

//Edit one user
router.patch("/:id([0-9]+)", [checkJwt], UserController.editUser);

//Delete one user
// !!!!!!!!!! admin role middleware needed or anybody can delete anyone !!!!!!!!!!!!!!!!!!!!
//router.delete("/:id([0-9]+)", [checkJwt], UserController.deleteUser);

export default router;
