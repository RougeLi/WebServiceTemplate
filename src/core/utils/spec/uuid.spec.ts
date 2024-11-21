import { randomUUID } from 'node:crypto';
import { generateRequestId } from '../uuid';

jest.mock('node:crypto', () => ({
  randomUUID: jest.fn(),
}));

describe('generateRequestId', () => {
  it('should generate a UUID', () => {
    const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
    (randomUUID as jest.Mock).mockReturnValue(mockUUID);

    const requestId = generateRequestId();

    expect(randomUUID).toHaveBeenCalled();
    expect(requestId).toBe(mockUUID);
  });
});
