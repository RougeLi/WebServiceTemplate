import PrismaService from 'src/core/services/prisma.service';

export class HelloModel {
  constructor(private readonly prisma: PrismaService) {}

  async saveUser(Name: string, Age: number): Promise<void> {
    const data = { Name, Age };
    await this.prisma.user.create({
      data,
    });
  }
}
