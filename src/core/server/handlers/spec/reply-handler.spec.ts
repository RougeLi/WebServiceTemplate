import { FastifyReply } from 'fastify';
import { StatusCodes } from 'http-status-codes';
import { WebError } from 'src/core/utils';
import { ReplyHandler } from '../reply.handler';

describe('ReplyHandler', () => {
  let replyHandler: ReplyHandler;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    replyHandler = new ReplyHandler();

    mockReply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  it('should handle a WebError and send the correct response', () => {
    const error = new WebError(StatusCodes.BAD_REQUEST, 'Test error');
    replyHandler.handle(mockReply as FastifyReply, error);

    expect(mockReply.code).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(mockReply.send).toHaveBeenCalledWith({ message: 'Test error' });
  });

  it('should handle an internal error and send the correct response', () => {
    replyHandler.handleInternalError(mockReply as FastifyReply);

    expect(mockReply.code).toHaveBeenCalledWith(
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
    expect(mockReply.send).toHaveBeenCalledWith({
      message: 'Internal server error',
    });
  });
});
