type ValidResult = {
  isValid: true;
  validPayload: {
    email: string;
  };
};

type InvalidResult = {
  isValid: false;
  validationErrors: string[];
};

type ValidationResult = ValidResult | InvalidResult;

function validateEmail(emailFromInput: any): ValidationResult {
  const validationErrors = [];
  if (typeof emailFromInput !== "string") {
    validationErrors.push("email must be a string");
  }
  if (emailFromInput.length < 6) {
    validationErrors.push("email must be at least 6 characters long");
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(emailFromInput);
  if (!isValid) {
    validationErrors.push("email is not valid");
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
        email: emailFromInput,
      },
    };
  }
}

export { validateEmail };
