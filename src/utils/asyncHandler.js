
// Method 1: Using Promises
const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch(error => next(error))
  }
}

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

export {asyncHandler}