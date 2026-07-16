const buildQuery = ({ Model, searchFields = [], filters = {}, user, query = {} }) => {
  const filter = {};
  const search = query.search || '';

  if (search && searchFields.length) {
    filter.$or = searchFields.map((field) => ({ [field]: { $regex: search, $options: 'i' } }));
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      filter[key] = value;
    }
  });

  if (query.role) filter.role = query.role;
  if (user && user.role === 'student') {
    filter.user = user._id;
  }

  return filter;
};

const createCrudService = (Model, options = {}) => ({
  list: async ({ query = {}, user, filters = {} } = {}) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;
    const sort = query.sort || '-createdAt';
    const filter = buildQuery({ Model, searchFields: options.searchFields || [], filters, user, query });

    const items = await Model.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = typeof Model.countDocuments === 'function'
      ? await Model.countDocuments(filter)
      : await Promise.resolve(0);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        sort,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  get: async ({ id }) => {
    return Model.findById(id);
  },

  create: async ({ payload }) => {
    return Model.create(payload);
  },

  update: async ({ id, payload }) => {
    return Model.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  },

  remove: async ({ id }) => {
    return Model.findByIdAndDelete(id);
  },
});

module.exports = { createCrudService, buildQuery };
