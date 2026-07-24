import { body, query, param, validationResult } from "express-validator";

export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    res.status(400).json({
      status: "fail",
      errors: extractedErrors,
    });
  };
};

export const commanValidation = {
  pagination: [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Limit must be a positive integer"),
  ],
  email: body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  name: body("name")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Name is required"),
};

export const validateSignup = validate([
  commanValidation.email,
  commanValidation.name,
]);
