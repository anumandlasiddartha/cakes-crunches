/**
 * Pagination, Filtering, and Sorting Helpers
 */

/**
 * Parse pagination params from query string.
 * @returns {{ skip: number, take: number, page: number, limit: number }}
 */
export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
}

/**
 * Build Prisma orderBy from query string.
 * @param {string} sortBy - Field name to sort by
 * @param {string} sortOrder - "asc" or "desc"
 * @returns {object}
 */
export function parseSorting(sortBy = "createdAt", sortOrder = "desc") {
  const validOrders = ["asc", "desc"];
  const order = validOrders.includes(sortOrder?.toLowerCase()) ? sortOrder.toLowerCase() : "desc";
  return { [sortBy]: order };
}

/**
 * Build paginated response envelope.
 */
export function paginatedResponse(data, total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Build search filter for Prisma (case-insensitive contains).
 */
export function buildSearchFilter(search, fields) {
  if (!search || !fields.length) return undefined;
  return {
    OR: fields.map((field) => ({
      [field]: { contains: search },
    })),
  };
}
