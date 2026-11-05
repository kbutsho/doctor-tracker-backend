const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
const idParam = z.object({ id: objectId });

const listBase = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

const phone = z.string().trim().regex(/^\+?[\d\s-]{7,20}$/, 'Invalid phone number');

module.exports = { objectId, idParam, listBase, phone };
