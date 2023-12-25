// Method 1: Using Promises
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) => {
      // console.log(error);
      // throw new ApiError(500, hello);
      // res.json(new ApiError(500, "hello"));
      next(error);
    });
  };
};

// Method 2: Using try-catch
// const asyncHandler = (requestHandler) => (req, res, next) => {
//   try {
//     requestHandler(req, res, next)
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message
//     })
//   }
// }

export { asyncHandler };
