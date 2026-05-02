/**
 * Global-friendly address checks (no country-specific postal formats).
 * Optional: add Loqate / Google Places / regional datasets for verification later.
 */

export type AddressFields = {
  street: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
};

/** Aligns with `manufacturer_profiles.postal_code` column */
export const MAX_POSTAL_CODE_LENGTH = 32;

export type AddressValidationResult = {
  ok: boolean;
  errors: Partial<Record<keyof AddressFields, string>>;
};

function hasControlChars(s: string): boolean {
  return /[\u0000-\u001F\u007F]/.test(s);
}

/**
 * Validates required core fields. Postal / ZIP is optional; when present, only sanity checks
 * so international formats (JP, US, UK, BR CEP, IN PIN, DE PLZ, etc.) are all accepted.
 */
export function validateManufacturerAddress(address: AddressFields): AddressValidationResult {
  const errors: Partial<Record<keyof AddressFields, string>> = {};

  const street = address.street.trim();
  const city = address.city.trim();
  const country = address.country.trim();
  const postal = address.postalCode.trim();

  if (!street) errors.street = "Enter a street address.";
  if (!city) errors.city = "Enter a city.";
  if (!country) errors.country = "Enter a country.";

  if (postal) {
    if (postal.length > MAX_POSTAL_CODE_LENGTH) {
      errors.postalCode = `Postal or ZIP code must be ${MAX_POSTAL_CODE_LENGTH} characters or fewer.`;
    } else if (hasControlChars(postal)) {
      errors.postalCode = "Remove invalid characters from the postal code.";
    } else if (!/[\p{L}\p{N}]/u.test(postal)) {
      errors.postalCode = "Postal code should include at least one letter or number.";
    }
  }

  const region = address.region.trim();
  if (region.length > 120) {
    errors.region = "State / region is too long.";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  };
}
