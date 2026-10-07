import { parseUsername } from "@/lib/validation";

export function usernameBase(firstName: string, lastName: string) {
  const normalize = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const first = normalize(firstName);
  const last = normalize(lastName);
  if (!first || !last) return null;
  // Pad exceptionally short names to satisfy the existing minimum length.
  return `${first[0]}${last}`.padEnd(3, "0").slice(0, 32);
}

export function usernameCandidate(base: string, number: number) {
  const suffix = number ? String(number) : "";
  return `${base.slice(0, 32 - suffix.length)}${suffix}`;
}

export function readAgentProfile(form: FormData, autoUsername = false) {
  const firstName = String(form.get("first_name") ?? "").trim();
  const lastName = String(form.get("last_name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const username = autoUsername ? usernameBase(firstName, lastName) : parseUsername(form.get("username"));
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
