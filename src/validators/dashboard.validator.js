const { z } = require('zod');

exports.dashboardQuery = z.object({
  days: z.coerce.number().int().min(7).max(365).default(30),
  top: z.coerce.number().int().min(3).max(20).default(10),
});
