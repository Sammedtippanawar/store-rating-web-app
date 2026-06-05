export const validateName = (name) => {
  if (name.length < 20 || name.length > 60) {
    return 'Name must be between 20 and 60 characters';
  }
  return null;
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const validatePassword = (password) => {
  if (password.length < 8 || password.length > 16) {
    return 'Password must be between 8 and 16 characters';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least one special character (!@#$%^&*)';
  }
  return null;
};

export const validateAddress = (address) => {
  if (address.length < 5 || address.length > 400) {
    return 'Address must be between 5 and 400 characters';
  }
  return null;
};

export const validateRating = (rating) => {
  if (rating < 1 || rating > 5) {
    return 'Rating must be between 1 and 5';
  }
  return null;
};
