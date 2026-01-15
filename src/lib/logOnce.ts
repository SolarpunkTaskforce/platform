const loggedKeys = new Set<string>();

export const logOnce = (key: string, message: string, error?: unknown) => {
  if (loggedKeys.has(key)) return;
  loggedKeys.add(key);
  if (error) {
    console.error(message, error);
    return;
  }
  console.error(message);
};
