import db from '~/actions/prisma';
import type { LoginFormInputs } from '~/types/auth';

export async function SignInValidation(inputs: LoginFormInputs) {
  if (!inputs.email_username.value) {
    inputs.email_username.error = 'email_username is required';
  } else {
    const existingEmail = await db.user.findUnique({
      where: { email: inputs.email_username.value },
    });

    const existingUsername = await db.user.findUnique({
      where: { name: inputs.email_username.value },
    });

    if (!existingEmail && !existingUsername) {
      inputs.email_username.error = 'Email or Username does not exist';
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

  return inputs;
}
