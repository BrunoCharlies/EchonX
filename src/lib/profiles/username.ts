/** Native profile @handle — stored without leading @. */

export const USERNAME_REGEX = /^[a-z0-9]{3,24}$/;

export const USERNAME_VALIDATION_MESSAGE =
  "Please use only lowercase letters and numbers in your username (3 to 24 characters).";

export const USERNAME_HINT =
  "Lowercase letters and numbers only (a–z, 0–9), 3 to 24 characters. Do not type @ — it is added automatically.";

/** Trim, lowercase, strip a leading @ (users often type @handle). */
export function normalizeUsernameInput(raw: string): string {
  return raw.trim().replace(/^@+/, "").toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(username);
}
