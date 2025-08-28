const successResponse = (res, data, message = "Success", statusCode = 200) => {
    res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  };
  
  const errorResponse = (res, error, message = "Error", statusCode = 400) => {
    // Check if error is null or undefined, and set a default message
    const errorMessage = error && error.message ? error.message : error || message;
  
    res.status(statusCode).json({
      success: false,
      message,
      error: errorMessage,
    });
  };
  
  module.exports = { successResponse, errorResponse };
  