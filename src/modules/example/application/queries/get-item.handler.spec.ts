import { GetItemHandler } from './get-item.handler';
import { GetItemQuery } from './get-item.query';
import { IItemRepository } from '../../domain/item.repository.interface';
import { Item } from '../../domain/item.entity';
import { ItemName } from '../../domain/item-name.value-object';

describe('GetItemHandler', () => {
  let handler: GetItemHandler;
  let mockRepository: jest.Mocked<IItemRepository>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    handler = new GetItemHandler(mockRepository);
  });

  it('should delegate to repository.findById with the query id', async () => {
    const item = Item.create('item-1', ItemName.create('Widget'));
    mockRepository.findById.mockResolvedValue(item);

    const query = new GetItemQuery('item-1');
    await handler.execute(query);

    expect(mockRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockRepository.findById).toHaveBeenCalledWith('item-1');
  });

  it('should return the item from the repository when it exists', async () => {
    const item = Item.create('item-2', ItemName.create('Gadget'));
    mockRepository.findById.mockResolvedValue(item);

    const result = await handler.execute(new GetItemQuery('item-2'));

    expect(result).toBe(item);
  });

  it('should return null when the repository returns null', async () => {
    mockRepository.findById.mockResolvedValue(null);

    const result = await handler.execute(new GetItemQuery('nonexistent'));

    expect(result).toBeNull();
  });
});
