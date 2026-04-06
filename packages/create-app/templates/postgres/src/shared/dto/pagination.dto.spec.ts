import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationDto } from './pagination.dto';

async function validateDto(plain: Record<string, unknown>) {
  const dto = plainToInstance(PaginationDto, plain);
  const errors = await validate(dto);
  return { dto, errors };
}

describe('PaginationDto', () => {
  it('should have defaults: page=1, limit=20, order=asc', async () => {
    const { dto } = await validateDto({});
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
    expect(dto.order).toBe('asc');
  });

  it('should pass with valid page=2, limit=50, sort=name, order=desc', async () => {
    const { errors } = await validateDto({ page: 2, limit: 50, sort: 'name', order: 'desc' });
    expect(errors).toHaveLength(0);
  });

  it('should fail when page < 1', async () => {
    const { errors } = await validateDto({ page: 0 });
    expect(errors.length).toBeGreaterThan(0);
    const pageError = errors.find((e) => e.property === 'page');
    expect(pageError).toBeDefined();
  });

  it('should fail when limit > 100', async () => {
    const { errors } = await validateDto({ limit: 101 });
    expect(errors.length).toBeGreaterThan(0);
    const limitError = errors.find((e) => e.property === 'limit');
    expect(limitError).toBeDefined();
  });

  it('should fail when order is not asc or desc', async () => {
    const { errors } = await validateDto({ order: 'random' });
    expect(errors.length).toBeGreaterThan(0);
    const orderError = errors.find((e) => e.property === 'order');
    expect(orderError).toBeDefined();
  });

  it('should fail when limit < 1', async () => {
    const { errors } = await validateDto({ limit: 0 });
    expect(errors.length).toBeGreaterThan(0);
  });
});
