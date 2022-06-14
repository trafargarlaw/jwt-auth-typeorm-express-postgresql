import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source";
import { validate } from "class-validator";
import dotenv from "dotenv";
dotenv.config();

import { User } from "../entity/User";

class AuthController {
  static login = async (req: Request, res: Response) => {
    //Check if username and password are set
    let { email, password } = req.body;
    if (!(email && password)) {
      res.status(400).send("Invalid credentials");
      return;
    }

    //Get user from database
    const userRepository = AppDataSource.getRepository(User);
    let user: User;
    try {
      user = await userRepository.findOneOrFail({ where: { email } });
    } catch (error) {
      res.status(401).send("email not found !");
      return;
    }

    //Check if encrypted password match
    if (!user.checkIfUnencryptedPasswordIsValid(password)) {
      res.status(401).send("password is invalid");
      return;
    }

    //Sing JWT, valid for 10 minutes
    const token = jwt.sign(
      { userId: user!.id, username: user!.email },
      process.env.JWT_SECRET!,
      { expiresIn: "10m" }
    );

    // refresh token
    const refreshToken = jwt.sign(
      { userId: user!.id, username: user!.email },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: "7d" }
    );

    //send the refresh token as a cookie
    res.cookie("bull", refreshToken, {
      httpOnly: true,
    });
    //Send the jwt in the response
    res.send(token);
  };

  static changePassword = async (req: Request, res: Response) => {
    //Get ID from JWT
    const id = res.locals.jwtPayload.userId;

    //Get parameters from the body
    const { oldPassword, newPassword } = req.body;

    if (!(oldPassword && newPassword)) {
      res.status(400).send();
    }

    //Get user from the database
    const userRepository = AppDataSource.getRepository(User);

    let user: User;
    try {
      user = await userRepository.findOneOrFail({ where: { id } });
    } catch (id) {
      res.status(401).send();
    }

    //Check if old password matchs
    if (!user!.checkIfUnencryptedPasswordIsValid(oldPassword)) {
      res.status(401).send();
      return;
    }

    //Validate de model (password lenght)
    const errors = await validate(user!);

    if (errors.length > 0) {
      res.status(400).send(errors);
      return;
    }
    user!.password = await user!.setPassword(newPassword);
    userRepository.save(user!);

    res.status(204).send();
  };

  static refreshToken = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.bull;
    if (!refreshToken) {
      res.status(401).send("No refresh token");
      return;
    }
    try {
      const jwtPayload = <any>(
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!)
      );
      const { userId, username } = jwtPayload;
      const newToken = jwt.sign({ userId, username }, process.env.JWT_SECRET!, {
        expiresIn: "10m",
      });
      res.setHeader("authorization", newToken);
      res.status(200).send();
    } catch (error) {
      res.status(401).send("Invalid refresh token");
    }
  };
}
export default AuthController;
