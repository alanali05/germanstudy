export const levels = [
  { id: "a1", title: "A1", color: "#4ade80" },
  { id: "a2", title: "A2", color: "#38bdf8" },
  { id: "b1", title: "B1", color: "#facc15" },
  { id: "b2", title: "B2", color: "#fb923c" },
];

export const getLevel = (id) => levels.find((l) => l.id === id) || levels[0];
