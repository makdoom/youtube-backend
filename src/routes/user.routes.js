import { Router } from "express";

import {
  changeUserPassword,
  getCurrentUser,
  getUserProfileChannel,
  getUserWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateCoverImage,
  updateUserAvatar,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Regitser user route
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
router.route("/login").post(loginUser);

// Secured routes
router.route("/getme").get(verifyJWT, getCurrentUser);
router.route("/update-details").patch(verifyJWT, updateAccountDetails);
router.route("/change-password").post(verifyJWT, changeUserPassword);
router
  .route("/update-avatar")
  .post(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
  .route("/update-cover-image")
  .post(verifyJWT, upload.single("coverImage"), updateCoverImage);
router.route("/channel/:username").get(verifyJWT, getUserProfileChannel);
router.route("/watch-history").get(verifyJWT, getUserWatchHistory);
router.route("/refresh-token").post(refreshAccessToken);

router.route("/logout").post(verifyJWT, logoutUser);

export default router;
