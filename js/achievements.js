// Achievement definitions and management system for pizza shop POS

export const ACHIEVEMENTS = [
  // Volume Milestones
  {
    id: "first_slice",
    name: "First Slice",
    description: "Cook your first pizza",
    icon: "🍕",
    category: "volume",
    target: 1,
    criteria: { type: "count", metric: "pizza_items" },
    tier: 1
  },
  {
    id: "centurion",
    name: "Centurion",
    description: "Cook 100 pizzas",
    icon: "💯",
    category: "volume",
    target: 100,
    criteria: { type: "count", metric: "pizza_items" },
    tier: 2
  },
  {
    id: "pizzaiolo",
    name: "Pizzaiolo",
    description: "Cook 200 pizzas - You're a true pizza maker!",
    icon: "👨‍🍳",
    category: "volume",
    target: 200,
    criteria: { type: "count", metric: "pizza_items" },
    tier: 3
  },
  {
    id: "master_chef",
    name: "Master Chef",
    description: "Cook 500 pizzas - Master of the oven!",
    icon: "⭐",
    category: "volume",
    target: 500,
    criteria: { type: "count", metric: "pizza_items" },
    tier: 4
  },
  {
    id: "legend",
    name: "Legend",
    description: "Cook 1000 pizzas - You're a legend!",
    icon: "🏆",
    category: "volume",
    target: 1000,
    criteria: { type: "count", metric: "pizza_items" },
    tier: 5
  },
  {
    id: "quesadilla_starter",
    name: "Quesadilla Starter",
    description: "Cook your first quesadilla",
    icon: "🌮",
    category: "volume",
    target: 1,
    criteria: { type: "count", metric: "quesadilla_items" },
    tier: 1
  },
  {
    id: "quesadilla_master",
    name: "Quesadilla Master",
    description: "Cook 100 quesadillas",
    icon: "🔥",
    category: "volume",
    target: 100,
    criteria: { type: "count", metric: "quesadilla_items" },
    tier: 3
  },

  // Revenue Milestones
  {
    id: "first_baht",
    name: "First Baht",
    description: "Earn your first revenue",
    icon: "💰",
    category: "revenue",
    target: 1,
    criteria: { type: "revenue", metric: "total_revenue" },
    tier: 1
  },
  {
    id: "10k_club",
    name: "10K Club",
    description: "Earn 10,000 THB in total revenue",
    icon: "💵",
    category: "revenue",
    target: 10000,
    criteria: { type: "revenue", metric: "total_revenue" },
    tier: 2
  },
  {
    id: "50k_milestone",
    name: "50K Milestone",
    description: "Earn 50,000 THB - Growing strong!",
    icon: "💸",
    category: "revenue",
    target: 50000,
    criteria: { type: "revenue", metric: "total_revenue" },
    tier: 3
  },
  {
    id: "six_figures",
    name: "Six Figures",
    description: "Earn 100,000 THB - Incredible!",
    icon: "💎",
    category: "revenue",
    target: 100000,
    criteria: { type: "revenue", metric: "total_revenue" },
    tier: 4
  },
  {
    id: "quarter_million",
    name: "Quarter Million",
    description: "Earn 250,000 THB - Outstanding!",
    icon: "🌟",
    category: "revenue",
    target: 250000,
    criteria: { type: "revenue", metric: "total_revenue" },
    tier: 5
  },

  // Order Frequency
  {
    id: "grand_opening",
    name: "Grand Opening",
    description: "Complete your first order",
    icon: "🎊",
    category: "orders",
    target: 1,
    criteria: { type: "count", metric: "total_orders" },
    tier: 1
  },
  {
    id: "busy_day",
    name: "Busy Day",
    description: "Complete 50 orders total",
    icon: "📈",
    category: "orders",
    target: 50,
    criteria: { type: "count", metric: "total_orders" },
    tier: 2
  },
  {
    id: "century_of_service",
    name: "Century of Service",
    description: "Complete 100 orders - Excellent!",
    icon: "🎯",
    category: "orders",
    target: 100,
    criteria: { type: "count", metric: "total_orders" },
    tier: 3
  },
  {
    id: "marathon_runner",
    name: "Marathon Runner",
    description: "Complete 500 orders - Non-stop!",
    icon: "🏃",
    category: "orders",
    target: 500,
    criteria: { type: "count", metric: "total_orders" },
    tier: 4
  },

  // Speed & Efficiency
  {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Serve an order in under 5 minutes",
    icon: "⚡",
    category: "speed",
    target: 1,
    criteria: { type: "count", metric: "fast_orders" },
    tier: 2
  },
  {
    id: "lightning_fast",
    name: "Lightning Fast",
    description: "Serve 10 orders in under 5 minutes each",
    icon: "🚀",
    category: "speed",
    target: 10,
    criteria: { type: "count", metric: "fast_orders" },
    tier: 3
  },

  // Special Achievements
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Complete an order after 10 PM",
    icon: "🦉",
    category: "special",
    target: 1,
    criteria: { type: "count", metric: "night_orders" },
    tier: 2
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Complete an order before 10 AM",
    icon: "🌅",
    category: "special",
    target: 1,
    criteria: { type: "count", metric: "morning_orders" },
    tier: 2
  }
];

const CATEGORY_NAMES = {
  volume: "📦 Volume Milestones",
  revenue: "💰 Revenue Milestones",
  orders: "🎯 Order Frequency",
  speed: "⚡ Speed & Efficiency",
  special: "🎁 Special Achievements"
};

export class AchievementsManager {
  constructor(orderService) {
    this.orderService = orderService;
    this.achievements = ACHIEVEMENTS.map(a => ({ ...a }));
    this.progress = {};
    this.loadProgress();
    // Calculate and save initial progress
    this.calculateProgress();
    this.saveProgress();
  }

  /**
   * Load achievement progress from localStorage
   */
  loadProgress() {
    try {
      const saved = localStorage.getItem("pizzaShopAchievements");
      if (saved) {
        this.progress = JSON.parse(saved);
      }
    } catch (error) {
      console.error("Error loading achievements:", error);
      this.progress = {};
    }
  }

  /**
   * Save achievement progress to localStorage
   */
  saveProgress() {
    try {
      localStorage.setItem("pizzaShopAchievements", JSON.stringify(this.progress));
    } catch (error) {
      console.error("Error saving achievements:", error);
    }
  }

  /**
   * Calculate current progress for all achievements based on order data
   */
  calculateProgress() {
    // Use .orders getter to get ALL orders (not just ongoing)
    const orders = this.orderService.orders;
    const completedOrders = orders.filter(o => o.served && o.paid);

    // Calculate all metrics
    const metrics = {
      pizza_items: this._countPizzas(completedOrders),
      quesadilla_items: this._countQuesadillas(completedOrders),
      total_revenue: this._calculateRevenue(completedOrders),
      total_orders: completedOrders.length,
      fast_orders: this._countFastOrders(completedOrders),
      night_orders: this._countNightOrders(completedOrders),
      morning_orders: this._countMorningOrders(completedOrders)
    };

    // Update each achievement
    this.achievements.forEach(achievement => {
      const metric = achievement.criteria.metric;
      const currentValue = metrics[metric] || 0;
      const progress = Math.min(currentValue, achievement.target);
      const unlocked = currentValue >= achievement.target;

      // Initialize if not exists
      if (!this.progress[achievement.id]) {
        this.progress[achievement.id] = {
          unlocked: false,
          unlockedAt: null,
          progress: 0
        };
      }

      // Update progress
      this.progress[achievement.id].progress = currentValue;

      // Check if newly unlocked
      if (unlocked && !this.progress[achievement.id].unlocked) {
        this.progress[achievement.id].unlocked = true;
        this.progress[achievement.id].unlockedAt = Date.now();
      }

      // Add runtime state to achievement object
      achievement.unlocked = this.progress[achievement.id].unlocked;
      achievement.unlockedAt = this.progress[achievement.id].unlockedAt;
      achievement.currentProgress = currentValue;
    });
  }

  /**
   * Check for newly unlocked achievements
   * Returns array of newly unlocked achievements
   */
  checkNewUnlocks() {
    const previousStates = {};
    this.achievements.forEach(a => {
      previousStates[a.id] = this.progress[a.id]?.unlocked || false;
    });

    this.calculateProgress();

    const newUnlocks = [];
    this.achievements.forEach(achievement => {
      const wasUnlocked = previousStates[achievement.id];
      const isNowUnlocked = this.progress[achievement.id]?.unlocked;

      if (!wasUnlocked && isNowUnlocked) {
        newUnlocks.push(achievement);
      }
    });

    if (newUnlocks.length > 0) {
      this.saveProgress();
    }

    return newUnlocks;
  }

  /**
   * Group achievements by category
   * Returns object with category names as keys
   */
  getAchievementsByCategory() {
    const grouped = {};

    this.achievements.forEach(achievement => {
      const categoryKey = achievement.category;
      const categoryName = CATEGORY_NAMES[categoryKey] || categoryKey;

      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }

      grouped[categoryName].push(achievement);
    });

    return grouped;
  }

  /**
   * Get summary statistics
   */
  getStats() {
    const total = this.achievements.length;
    const unlocked = this.achievements.filter(a => a.unlocked).length;
    const percentage = Math.round((unlocked / total) * 100);

    return {
      total,
      unlocked,
      percentage
    };
  }

  // Metric calculation helpers

  /**
   * Count pizza items from completed orders
   */
  _countPizzas(orders) {
    return orders.reduce((sum, order) => {
      const pizzaItems = order.items.filter(item => {
        // Check if item is a pizza by image path or category
        return item.image?.includes('pizza') ||
               item.category === 'pizza' ||
               this._isPizzaByName(item.name);
      });
      return sum + pizzaItems.length;
    }, 0);
  }

  /**
   * Count quesadilla items from completed orders
   */
  _countQuesadillas(orders) {
    return orders.reduce((sum, order) => {
      const quesadillaItems = order.items.filter(item => {
        // Check if item is a quesadilla by image path or category
        return item.image?.includes('quesadilla') ||
               item.category === 'quesadilla' ||
               this._isQuesadillaByName(item.name);
      });
      return sum + quesadillaItems.length;
    }, 0);
  }

  /**
   * Calculate total revenue from completed orders
   */
  _calculateRevenue(orders) {
    return orders.reduce((sum, order) => {
      return sum + (order.price || 0);
    }, 0);
  }

  /**
   * Count orders served in under 5 minutes
   */
  _countFastOrders(orders) {
    return orders.filter(order => {
      if (!order.served || !order.servedAt || !order.timestamp) {
        return false;
      }
      const duration = order.servedAt - order.timestamp;
      return duration < 300000; // 5 minutes in milliseconds
    }).length;
  }

  /**
   * Count orders completed after 10 PM
   */
  _countNightOrders(orders) {
    return orders.filter(order => {
      const hour = new Date(order.timestamp).getHours();
      return hour >= 22; // 10 PM or later
    }).length;
  }

  /**
   * Count orders completed before 10 AM
   */
  _countMorningOrders(orders) {
    return orders.filter(order => {
      const hour = new Date(order.timestamp).getHours();
      return hour < 10; // Before 10 AM
    }).length;
  }

  /**
   * Check if item name indicates it's a pizza
   */
  _isPizzaByName(name) {
    const pizzaKeywords = ['margherita', 'prosciutto', 'salame', 'formaggi', 'vegetariana',
                           'funghi', 'capricciosa', 'bianca', 'chicken', 'sausage',
                           'tuna', 'hawaiian', 'custom', 'pizza'];
    const lowerName = name.toLowerCase();
    return pizzaKeywords.some(keyword => lowerName.includes(keyword));
  }

  /**
   * Check if item name indicates it's a quesadilla
   */
  _isQuesadillaByName(name) {
    const lowerName = name.toLowerCase();
    return lowerName.includes('quesadilla');
  }
}
