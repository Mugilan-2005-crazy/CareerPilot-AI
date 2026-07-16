// small helper to build CRUD controllers for a model
module.exports = function genericController(Model) {
  return {
    create: async (req, res, next) => {
      try {
        const rec = await Model.create(req.body);
        res.status(201).json({ success: true, data: rec });
      } catch (err) {
        next(err);
      }
    },
    list: async (req, res, next) => {
      try {
        const items = await Model.find().limit(200);
        res.json({ success: true, data: items });
      } catch (err) {
        next(err);
      }
    },
    get: async (req, res, next) => {
      try {
        const item = await Model.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: item });
      } catch (err) {
        next(err);
      }
    },
    update: async (req, res, next) => {
      try {
        const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: item });
      } catch (err) {
        next(err);
      }
    },
    remove: async (req, res, next) => {
      try {
        await Model.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Deleted' });
      } catch (err) {
        next(err);
      }
    },
  };
};
