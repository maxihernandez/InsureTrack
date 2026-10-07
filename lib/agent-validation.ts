import { parseUsername } from "@/lib/validation";

export function readAgentProfile(form: FormData) {
  const firstName = String(form.get("first_name") ?? "").trim();
  const lastName = String(form.get("last_name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const username = parseUsername(form.get("username"));
  if (!firstName || firstName.length > 100 || !lastName || lastName.length > 100 ||
      !username || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return { firstName, lastName, email, username };
}

export function readAgentPassword(form: FormData) {
  const password = String(form.get("password") ?? "");
  const confirmation = String(form.get("password_confirmation") ?? "");
  // Do not trim passwords: spaces can be intentional.
  return password.length >= 12 && password.length <= 128 && password === confirmation
    ? password : null;
}
