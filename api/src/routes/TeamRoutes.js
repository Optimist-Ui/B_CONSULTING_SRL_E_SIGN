// routes/TeamRoutes.js
const express = require("express");
const authenticateUser = require("../middlewares/authenticate");

module.exports = (container) => {
    const router = express.Router();
    const teamController = container.resolve("teamController");

    router.use(authenticateUser);

    // Create a new team
    router.post('/', teamController.createTeam.bind(teamController));

    // Get details of a team
    router.get('/:teamId', teamController.getTeam.bind(teamController));
    
    // Add a new member to a team
    router.post('/:teamId/members', teamController.addMember.bind(teamController));

    return router;
};