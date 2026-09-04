const { createCrudService } = require('../services/baseService');

const protectedFields = new Set(['role', 'isAdmin', 'permissions', 'verified', 'userId', 'ownerId', 'createdBy', 'accountId']);

const sanitizeWritePayload = (req, payload, ownerField) => {
  const blockedFields = Object.keys(payload).filter((field) => protectedFields.has(field) || field === ownerField);
  if (blockedFields.length) {
    const error = new Error(`Protected fields cannot be modified: ${blockedFields.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
  return payload;
};

const createResourceController = (Model, options = {}) => {
  const service = createCrudService(Model, options);
  const ownerField = options.ownerField || 'user';

  const buildFilters = (req) => {
    const filters = { ...(options.defaultFilters || {}) };
    const ignoredKeys = new Set(['page', 'limit', 'search', 'sort']);

    Object.entries(req.query).forEach(([key, value]) => {
      if (!ignoredKeys.has(key) && value !== undefined && value !== '') {
        filters[key] = value;
      }
    });

    if (req.user?.role === 'student' && options.ownedByCurrentUser !== false) {
      filters[ownerField] = req.user._id;
    }

    return filters;
  };

  const ensureOwnership = async (req, item) => {
    if (!item) return null;
    if (req.user?.role === 'admin') return item;
    if (req.user?.role === 'student' && item[ownerField]?.toString() === req.user._id.toString()) {
      return item;
    }
    return null;
  };

  return {
    list: async (req, res, next) => {
      try {
        const result = await service.list({
          query: req.query,
          user: req.user,
          filters: buildFilters(req),
        });

        res.json({ success: true, ...result });
      } catch (error) {
        next(error);
      }
    },

    get: async (req, res, next) => {
      try {
        const item = await service.get({ id: req.params.id });
        if (!item) return res.status(404).json({ success: false, message: 'Not found' });

        const authorizedItem = await ensureOwnership(req, item);
        if (!authorizedItem) {
          return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        res.json({ success: true, data: authorizedItem });
      } catch (error) {
        next(error);
      }
    },

    create: async (req, res, next) => {
      try {
        const payload = sanitizeWritePayload(req, { ...req.body }, ownerField);
        if (req.user?.role === 'student' && ownerField && payload[ownerField] === undefined) {
          payload[ownerField] = req.user._id;
        }

        const item = await service.create({ payload });
        res.status(201).json({ success: true, data: item });
      } catch (error) {
        next(error);
      }
    },

    update: async (req, res, next) => {
      try {
        const existing = await service.get({ id: req.params.id });
        if (!existing) return res.status(404).json({ success: false, message: 'Not found' });

        const authorizedItem = await ensureOwnership(req, existing);
        if (!authorizedItem) {
          return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const payload = sanitizeWritePayload(req, { ...req.body }, ownerField);
        const item = await service.update({ id: req.params.id, payload });
        res.json({ success: true, data: item });
      } catch (error) {
        next(error);
      }
    },

    remove: async (req, res, next) => {
      try {
        const existing = await service.get({ id: req.params.id });
        if (!existing) return res.status(404).json({ success: false, message: 'Not found' });

        const authorizedItem = await ensureOwnership(req, existing);
        if (!authorizedItem) {
          return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        await service.remove({ id: req.params.id });
        res.json({ success: true, message: 'Deleted' });
      } catch (error) {
        next(error);
      }
    },
  };
};

module.exports = createResourceController;
