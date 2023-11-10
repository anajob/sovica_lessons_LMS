type ValidResult = {
  isValid: true;
  validPayload: {
    email: string;
    password: string;
  };
};

type InvalidResult = {
  isValid: false;
  validationErrors: string[];
};

type ValidationResult = ValidResult | InvalidResult;

export function validateUserLoginPayload(formData: FormData): ValidationResult {
  const validationErrors = [];

  const email = formData.get("email");
  const password = formData.get("password");

  // Email validation
  if (typeof email !== "string") {
    validationErrors.push("email must be a string");
  } else {
    if (email.length < 6) {
      validationErrors.push("email must be at least 6 characters long");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    if (!isValid) {
      validationErrors.push("email is not valid");
    }
  }
  // Password validation
  if (typeof password !== "string") {
    validationErrors.push("password must be a string");
  } else {
    if (password.length < 8) {
      validationErrors.push("password must be at least 8 characters long");
    }
  }

  if (validationErrors.length > 0) {
    return {
      isValid: false,
      validationErrors,
    };
  } else {
    return {
      isValid: true,
      validPayload: {
        email: email as string,
        password: password as string,
      },
    };
  }
}
