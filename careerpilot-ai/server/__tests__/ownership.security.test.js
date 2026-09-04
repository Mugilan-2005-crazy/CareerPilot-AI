jest.mock('../services/baseService', () => ({
  createCrudService: jest.fn(),
}));

const { createCrudService } = require('../services/baseService');
const createResourceController = require('../controllers/resourceController');

function response() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe('resource ownership and mass assignment security', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = {
      create: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
    };
    createCrudService.mockReturnValue(service);
  });

  test('student cannot update another user\'s resource', async () => {
    const controller = createResourceController({}, { ownerField: 'user' });
    service.get.mockResolvedValue({ user: 'user-b' });
    const res = response();

    await controller.update(
      { params: { id: 'resource-1' }, body: { title: 'changed' }, user: { role: 'student', _id: 'user-a' } },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(service.update).not.toHaveBeenCalled();
  });

  test('client cannot assign protected fields during create', async () => {
    const controller = createResourceController({}, { ownerField: 'user' });
    const res = response();
    const next = jest.fn();

    await controller.create(
      { body: { title: 'test', user: 'user-b', role: 'admin' }, user: { role: 'student', _id: 'user-a' } },
      res,
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(service.create).not.toHaveBeenCalled();
  });
});