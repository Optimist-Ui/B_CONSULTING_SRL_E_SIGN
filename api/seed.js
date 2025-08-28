const container = require("./config/container");
const User = container.resolve("User");
const Team = container.resolve("Team");
(async () => {
  const admin = await User.create({ email: "admin@example.com", password: "Admin123!", name: "Admin" });
  const team = await Team.create({ name: "Alpha", members: [admin._id] });
  console.log("Seeded!");
  process.exit(0);
})();