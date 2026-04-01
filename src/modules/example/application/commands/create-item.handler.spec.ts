import { CreateItemHandler } from './create-item.handler';
import { CreateItemCommand } from './create-item.command';
import { IItemRepository } from '../../domain/item.repository.interface';
import { Item } from '../../domain/item.entity';

describe('CreateItemHandler', () => {
  let handler: CreateItemHandler;
  let mockRepository: jest.Mocked<IItemRepository>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };

    handler = new CreateItemHandler(mockRepository);
  });

  it('should call repository.save with an Item constructed from the command name', async () => {
    const command = new CreateItemCommand('Widget');

    await handler.execute(command);

    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const savedItem: Item = mockRepository.save.mock.calls[0][0];
    expect(savedItem).toBeInstanceOf(Item);
    expect(savedItem.name.value).toBe('Widget');
  });

  it('should return a non-empty string id after saving', async () => {
    const command = new CreateItemCommand('Gadget');

    const result = await handler.execute(command);

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should generate a unique id for each execution', async () => {
    const command = new CreateItemCommand('Widget');

    const id1 = await handler.execute(command);
    const id2 = await handler.execute(command);

    expect(id1).not.toBe(id2);
  });
});
