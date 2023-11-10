import { prisma } from "~/db.server";

type UserCreatePayload = {
  email: any;
  password: any;
  nickName: any;
};

type ValidResult = {
  isValid: true;
  validPayload: {
    email: string;
    password: string;
    nickName: string;
  };
};

type InvalidResult = {
  isValid: false;
  validationErrors: string[];
};

type ValidationResult = ValidResult | InvalidResult;

export function validateUserCreatePayload(
  payload: UserCreatePayload
): ValidationResult {
  const validationErrors = [];

  // Email validation
  if (typeof payload.email !== "string") {
    validationErrors.push("email must be a string");
  } else {
    if (payload.email.length < 6) {
      validationErrors.push("email must be at least 6 characters long");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(payload.email);
    if (!isValid) {
      validationErrors.push("email is not valid");
    }
  }

  // Password validation
  if (typeof payload.password !== "string") {
    validationErrors.push("password must be a string");
  } else {
    if (payload.password.length < 8) {
      validationErrors.push("password must be at least 8 characters long");
    }
  }

  // Validate nick name
  if (typeof payload.nickName !== "string") {
    validationErrors.push("nickname must be a string");
  } else {
    if (payload.nickName.length < 3) {
      validationErrors.push("nickname must be at least 3 characters long");
    }
  }

  if (validationErrors.length > 0) {
    return {
      isValid: false,
      validationErrors: validationErrors,
    };
  } else {
    return {
      isValid: true,
      validPayload: {
        email: payload.email as string,
        password: payload.password,
        nickName: payload.nickName as string,
      },
    };
  }
}
