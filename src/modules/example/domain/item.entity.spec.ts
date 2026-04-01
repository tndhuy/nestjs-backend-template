import { Item } from './item.entity';
import { ItemName } from './item-name.value-object';

describe('Item entity', () => {
  it('should create an item via static factory with correct id and name', () => {
    const name = ItemName.create('Widget');
    const item = Item.create('item-1', name);

    expect(item.id).toBe('item-1');
    expect(item.name).toBe(name);
    expect(item.name.value).toBe('Widget');
  });

  it('should expose the name value object through the name accessor', () => {
    const name = ItemName.create('Gadget');
    const item = Item.create('item-2', name);

    expect(item.name.value).toBe('Gadget');
  });

  it('should be equal to another item with the same id', () => {
    const name = ItemName.create('Widget');
    const item1 = Item.create('same-id', name);
    const item2 = Item.create('same-id', ItemName.create('DifferentName'));

    expect(item1.equals(item2)).toBe(true);
  });

  it('should not be equal to an item with a different id', () => {
    const name = ItemName.create('Widget');
    const item1 = Item.create('id-a', name);
    const item2 = Item.create('id-b', name);

    expect(item1.equals(item2)).toBe(false);
  });

  it('should be equal to itself (reference equality)', () => {
    const item = Item.create('item-ref', ItemName.create('Test'));

    expect(item.equals(item)).toBe(true);
  });

  it('should return false when compared with undefined', () => {
    const item = Item.create('item-undef', ItemName.create('Test'));

    expect(item.equals(undefined)).toBe(false);
  });
});
