import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated, isAuthDisabled } from "./replitAuth";

// Mock user for when auth is disabled (for local development)
const MOCK_USER = {
  id: 'dev-user-001',
  email: 'dev@localhost',
  firstName: 'Dev',
  lastName: 'User',
  profileImageUrl: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  subscriptionStatus: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Endpoint to check if auth is disabled
  app.get("/api/auth/status", (req, res) => {
    res.json({ 
      authDisabled: isAuthDisabled(),
      message: isAuthDisabled() ? 'Auth is disabled for development' : 'Auth is enabled'
    });
  });

  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      // If auth is disabled, return mock user
      if (isAuthDisabled()) {
        return res.json(MOCK_USER);
      }

      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
