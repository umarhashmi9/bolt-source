type InputField = {
  value: string;
  error?: string;
};

export type FormInputs = {
  email: InputField;
  username: InputField;
  password: InputField;
  confirmPassword: InputField;
};

export type userTypes = {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
};

export type AuthError =
  | 'passwords-do-not-match'
  | 'user-already-exists'
  | 'user-not-found'
  | 'unknown-error'
  | 'invalid-credentials'
  | 'invalid-username'
  | 'invalid-email'
  | 'invalid-password';
