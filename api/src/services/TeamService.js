// services/TeamService.js
class TeamService {
    constructor({ Team, User }) {
        this.Team = Team;
        this.User = User;
    }

    /**
     * Creates a new team and sets the creator as the owner.
     * @param {string} userId - The user creating the team.
     * @param {string} teamName - The name of the new team.
     * @returns {Promise<object>} - The new team document.
     */
    async createTeam(userId, teamName) {
        // Ensure user is not already in a team
        const user = await this.User.findById(userId);
        if (user.teamId) {
            throw new Error("User is already part of a team.");
        }

        const newTeam = new this.Team({
            name: teamName,
            ownerId: userId,
            members: [userId] // The owner is automatically a member
        });
        await newTeam.save();

        // Update the user's document to link them to the new team
        user.teamId = newTeam._id;
        await user.save();
        
        return newTeam;
    }

    /**
     * Adds a member to a team.
     * @param {string} ownerId - The ID of the user initiating the request (must be the team owner).
     * @param {string} teamId - The ID of the team.
     * @param {string} memberEmail - The email of the user to add.
     * @returns {Promise<object>} - The updated team document.
     */
    async addMemberToTeam(ownerId, teamId, memberEmail) {
        const team = await this.Team.findById(teamId);
        if (!team) {
            throw new Error("Team not found.");
        }
        if (team.ownerId.toString() !== ownerId) {
            throw new Error("Only the team owner can add new members.");
        }
        
        const memberToAdd = await this.User.findOne({ email: memberEmail });
        if (!memberToAdd) {
            throw new Error(`User with email ${memberEmail} not found.`);
        }
        if (memberToAdd.teamId) {
            throw new Error("This user is already in a team.");
        }
        
        // Add member if not already in the list
        if (team.members.includes(memberToAdd._id)) {
            throw new Error("This user is already a member of the team.");
        }

        team.members.push(memberToAdd._id);
        memberToAdd.teamId = team._id;
        
        await team.save();
        await memberToAdd.save();

        return team;
    }

    /**
     * Retrieves team details.
     * @param {string} userId - ID of the user requesting info.
     * @param {string} teamId - ID of the team.
     * @returns 
     */
    async getTeamDetails(userId, teamId) {
        const team = await this.Team.findById(teamId).populate('members', 'firstName lastName email');
        if(!team){
            throw new Error("Team not found");
        }
        
        const isUserMember = team.members.some(member => member._id.toString() === userId);
        if (!isUserMember) {
            throw new Error("You are not a member of this team.");
        }

        return team;
    }
}

module.exports = TeamService;