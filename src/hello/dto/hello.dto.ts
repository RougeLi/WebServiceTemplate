import { Type } from '@sinclair/typebox';
import { StatusCodes } from 'http-status-codes';
import { CommonSchema } from 'src/server/dto/common.dto';

export const SayHelloQuery = Type.Object({
  name: Type.Optional(
    Type.String({
      description: '問候對象的姓名，將用於個性化問候消息。',
      examples: ['YueYue'],
    }),
  ),
  age: Type.Optional(
    Type.Number({
      description:
        '對象的年齡，雖然不會直接出現在問候消息中，但可以記錄或進行處理。',
      examples: [18],
    }),
  ),
});

export const SayHelloResponse = Type.String({
  description: '根據提供的查詢參數生成的個性化問候消息。',
  examples: ['Hello YueYue!'],
});

export const SayHelloSchema = {
  schema: {
    querystring: SayHelloQuery,
    response: {
      ...CommonSchema,
      [StatusCodes.OK]: SayHelloResponse,
    },
    description:
      '該端點根據提供的姓名和年齡生成問候消息。如果未提供姓名，將返回默認消息。',
    summary: '生成個性化的問候消息。',
    tags: ['hello'],
  },
};
