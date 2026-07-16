const { createCrudService } = require('../services/baseService');

const dummyModel = {
  find: () => ({
    sort: () => ({ skip: () => ({ limit: () => Promise.resolve([]) }) }),
  }),
};

describe('base CRUD service', () => {
  it('builds a search-aware query for list operations', async () => {
    const service = createCrudService(dummyModel, { searchFields: ['name', 'email'] });
    const result = await service.list({
      query: { search: 'alex', page: 2, limit: 10, sort: '-createdAt' },
      user: { role: 'student', _id: 'user-1' },
    });

    expect(result.meta.page).toBe(2);
    expect(result.meta.limit).toBe(10);
    expect(result.meta.sort).toBe('-createdAt');
    expect(Array.isArray(result.data)).toBe(true);
  });
});
