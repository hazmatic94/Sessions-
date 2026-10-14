const SERVICES_KEY = "sessions.services";

const DEFAULT_SERVICES = [
  {
    name: "Zero fade",
    description: "",
    duration: "45 min",
    priceType: "fixed",
    price: "60.00",
  },
];

export function formatServicePrice(priceType, price) {
  if (priceType === "free") return "Free";
  const amount = `A$ ${Number(price || 0).toFixed(0)}`;
  return priceType === "from" ? `From ${amount}` : amount;
}

export function listStoredServices() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SERVICES_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && String(item.name || "").trim());
  } catch {
    return [];
  }
}

export function listServicesForBooking() {
  const stored = listStoredServices();
  return stored.length ? stored : [...DEFAULT_SERVICES];
}

export function saveServices(services) {
  try {
    localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
  } catch {
    // ponytail: storage can be blocked
  }
}

export function appendService(service) {
  const services = listStoredServices();
  services.push(service);
  saveServices(services);
  return services;
}

export function readServiceFromForm(form) {
  if (!form) return null;
  const data = new FormData(form);
  const duration = form.querySelector("[data-calendar-booking-service-duration], #add-service-duration");
  return {
    name: String(data.get("serviceName") || "").trim(),
    description: String(data.get("description") || ""),
    duration: duration?.selectedOptions?.[0]?.textContent?.trim() || "",
    priceType: String(data.get("priceType") || "fixed"),
    price: String(data.get("price") || "0.00"),
  };
}
