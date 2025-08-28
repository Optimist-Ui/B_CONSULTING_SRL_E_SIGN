// controllers/TeamController.js
const { successResponse, errorResponse } = require("../utils/responseHandler");

class TeamController {
    constructor({ teamService }) {
        this.teamService = teamService;
    }

    async createTeam(req, res) {
        try {
            const ownerId = req.user.id;
            const { name } = req.body;
            if (!name) {
                return errorResponse(res, new Error("Team name is required."), "Validation Error", 400);
            }
            const team = await this.teamService.createTeam(ownerId, name);
            successResponse(res, team, "Team created successfully", 201);
        } catch (error) {
            errorResponse(res, error, "Failed to create team");
        }
    }
    
    async addMember(req, res) {
        try {
            const ownerId = req.user.id;
            const { teamId } = req.params;
            const { email } = req.body;
            if (!email) {
                return errorResponse(res, new Error("Member email is required."), "Validation Error", 400);
            }
            const team = await this.teamService.addMemberToTeam(ownerId, teamId, email);
            successResponse(res, team, "Member added successfully");
        } catch (error) {
            errorResponse(res, error, "Failed to add member");
        }
    }
    
    async getTeam(req, res) {
        try {
            const userId = req.user.id;
            const { teamId } = req.params;
            const team = await this.teamService.getTeamDetails(userId, teamId);
            successResponse(res, team, "Team details fetched successfully");
        } catch (error) {
            errorResponse(res, error, "Failed to fetch team details");
        }
    }
}
module.exports = TeamController;