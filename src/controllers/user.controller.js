import jwt from "jsonwebtoken";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {
  generateAccessAndRefreshToken,
  validateEmail,
} from "../utils/index.js";

const registerUser = asyncHandler(async (req, res) => {
  const { username, fullName, email, password } = req.body;

  // Basic validations
  if (
    [username, fullName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  if (!validateEmail(email)) throw new ApiError(400, "Email is invalid");

  const userExists = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (userExists)
    throw new ApiError(409, "User with username or email already exists");

  let avatarLocalPath = "";
  let coverImageLocalPath = "";

  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files.avatar[0].path;
  }
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) throw new ApiError(400, "Avatar file is required");

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser)
    throw new ApiError(500, "Something went wrong while registering the user");

  res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  if (!(username || email))
    throw new ApiError(400, "Username or Email is required");

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!existedUser) throw new ApiError(400, "User doesn't exists");

  const isPasswordValid = await existedUser.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(400, "Invalid user credentials");

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    existedUser._id
  );

  const loggedInUser = await User.findById(existedUser._id).select(
    "-password, -refreshToken"
  );

  const cookiesOption = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, cookiesOption)
    .cookie("refreshToken", refreshToken, cookiesOption)
    .json(
      new ApiResponse(
        200,
        { loggedInUser, accessToken, refreshToken },
        "User loged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    { new: true }
  );

  const cookiesOption = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", cookiesOption)
    .cookie("refreshToken", cookiesOption)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incommingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    console.log("incommingRefreshToken", incommingRefreshToken);
    if (!incommingRefreshToken) throw new ApiError(401, "Unauthorized request");

    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) throw new ApiError(400, "Invalid refresh token");

    console.log(incommingRefreshToken);
    console.log(user);
    if (incommingRefreshToken !== user?.refreshToken)
      throw new ApiError(400, "Refresh token expired or used");

    const cookieOptions = { httpOnly: true, secure: true };
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user?._id
    );

    res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req?.body;

  const user = await User.findById(req?.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) throw new ApiError(400, "Invalid password");

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req?.body;

  if (!fullName && !email)
    throw new ApiError(400, "Please provide field to update");

  const user = await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        fullName: fullName || req.user.fullName,
        email: email || req.user.email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalFilePath = req.file?.path;
  if (!avatarLocalFilePath) throw new ApiError(400, "Avatar file is missing");

  const user = await User.findById(req.user._id);
  const avatarPublicId = user.avatar?.split("/")?.at(-1)?.split(".")?.at(0);

  const avatar = await uploadOnCloudinary(avatarLocalFilePath);
  if (!avatar) throw new ApiError(400, "Error while uploading avatar");

  let updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar?.url,
      },
    },
    { new: true }
  ).select("-password");

  await deleteOnCloudinary(avatarPublicId);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedUser,
        "User avatar image updated successfully"
      )
    );
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverLocalImagePath = req.file?.path;
  if (!coverLocalImagePath)
    throw new ApiError(400, "Cover image file is missing");

  const user = await User.findById(req.user._id);
  const coverImagePublidId = user.coverImage
    ?.split("/")
    ?.at(-1)
    ?.split(".")
    ?.at(0);

  const coverImage = await uploadOnCloudinary(coverLocalImagePath);
  if (!coverImage) throw new ApiError(400, "Error while uploading cover image");

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage?.url,
      },
    },
    { new: true }
  ).select("-password");

  await deleteOnCloudinary(coverImagePublidId);

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "User cover image updated successfully")
    );
});

const getUserProfileChannel = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) throw new ApiError(400, "Username is missing");

  const channel = await User.aggregate([
    {
      $match: { username: username.toLowerCase() },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        channelSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        isSubscribed: 1,
        subscriberCount: 1,
        channelSubscribedToCount: 1,
        email: 1,
      },
    },
  ]);
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeUserPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateCoverImage,
};
