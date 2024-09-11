import { Type } from '@sinclair/typebox';

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
