import db from '~/actions/prisma';
import type { FormInputs } from '~/types/auth';

export async function SignUpValidation(inputs: FormInputs) {
  if (!inputs.email.value) {
    inputs.email.error = 'Email is required';
  } else {
    const existingEmail = await db.user.findUnique({
      where: { email: inputs.email.value },
    });

    if (existingEmail) {
      inputs.email.error = 'Email already exists';
    }
  }
  if (!inputs.username.value) {
    inputs.username.error = 'Username is required';
  } else {
    const existingUsername = await db.user.findUnique({
      where: { name: inputs.username.value },
    });

    if (existingUsername) {
      inputs.username.error = 'Username already exists';
    }
  }
  if (!inputs.password.value) {
    inputs.password.error = 'Password is required';
  } else {
    const password = inputs.password.value;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasDigitOrSymbol = /[\d\W]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasDigitOrSymbol) {
      inputs.password.error = 'Password must contain at least 1 uppercase, 1 lowercase, and 1 digit or symbol';
    }
  }
  if (inputs.password.value !== inputs.confirmPassword.value) {
    inputs.confirmPassword.error = 'Passwords do not match';
  }

  return inputs;
}
