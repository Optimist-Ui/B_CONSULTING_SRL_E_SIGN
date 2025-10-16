// PlanService.js
class PlanService {
  constructor({ Plan }) {
    this.Plan = Plan; // Your Plan model
  }

  async findPlanByPriceId(priceId) {
    try {
      return await this.Plan.findOne({
        $or: [{ monthlyPriceId: priceId }, { yearlyPriceId: priceId }],
      });
    } catch (error) {
      console.error("Error finding plan by price ID:", error);
      throw error;
    }
  }

  async findPlanById(planId) {
    try {
      return await this.Plan.findById(planId);
    } catch (error) {
      console.error("Error finding plan by ID:", error);
      throw error;
    }
  }

  async getAllPlans() {
    try {
      return await this.Plan.find({ isActive: true }).sort({ price: 1 });
    } catch (error) {
      console.error("Error fetching all plans:", error);
      throw error;
    }
  }
}

module.exports = PlanService;
