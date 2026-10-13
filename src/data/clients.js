import { SHIFT_TEAM } from "/src/pages/shiftStore.js";

export const CLIENTS = [
  {
    name: "Harry Maher",
    email: "harrymaherdesign@gmail.com",
    phone: "+61 461455500",
    sales: "A$ 5040",
    createdOn: "Jun 18, 2024",
    avatarInitial: "H",
  },
  {
    name: "Larry June",
    email: "larry@sessions.com",
    phone: "+61 400112233",
    sales: "A$ 1280",
    createdOn: "Aug 2, 2024",
    avatarSrc: "/assets/demo/larry.png",
  },
  {
    name: "Marcus Bell",
    email: "marcus@sessions.com",
    phone: "+61 411223344",
    sales: "A$ 760",
    createdOn: "Mar 9, 2025",
    avatarInitial: "M",
  },
  {
    name: "Sofia Reyes",
    email: "sofia@sessions.com",
    phone: "+61 422334455",
    sales: "A$ 2140",
    createdOn: "Jan 14, 2025",
    avatarInitial: "S",
  },
  {
    name: "Wendy Smith",
    email: "wendy@sessions.com",
    phone: "+61 433445566",
    sales: "A$ 540",
    createdOn: "Sep 28, 2024",
    avatarInitial: "W",
  },
  {
    name: "Ava Nguyen",
    email: "ava@sessions.com",
    phone: "+61 444556677",
    sales: "A$ 980",
    createdOn: "Nov 3, 2024",
    avatarInitial: "A",
  },
];

const TEAM_NAMES = new Set(SHIFT_TEAM.map((person) => person.name));

/** Clients list for booking — not staff / team members. */
export function listClientsForBooking() {
  return CLIENTS.filter((client) => !TEAM_NAMES.has(client.name));
}
