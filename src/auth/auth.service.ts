import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async signup(dto: AuthDto) {
    const existedUser = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
      },
    });

    if (existedUser) {
      throw new BadRequestException('User with same credentials already exists');
    }
    const hash = await argon.hash(dto.password);

    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        hash,
      },
    });

    const refreshToken = await this.generateRefresh(newUser.id);
    const accessToken = await this.generateAccess(refreshToken);

    return {
      email: newUser.email,
      refreshToken,
      accessToken,
    };
  }

  async signin(dto: AuthDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new NotFoundException('Invalid credentials');
    }

    const verifyPassword = await argon.verify(user.hash, dto.password);

    if (!verifyPassword) {
      throw new UnauthorizedException('Invalid password');
    }

    const refreshToken = await this.generateRefresh(user.id);
    const { accessToken } = await this.generateAccess(refreshToken);

    return {
      email: user.email,
      accessToken,
      refreshToken,
    };
  }

  async generateAccess(refreshToken: string) {
    const decodedToken = await this.jwt.verifyAsync(refreshToken, {
      secret: process.env.JWT_SECRET,
    });
    const expiration = new Date();
    expiration.setDate(expiration.getMinutes() + 30);

    const accessToken = this.jwt.sign(
      { id: decodedToken.id },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: expiration.getTime(),
      },
    );
    return {
      accessToken: accessToken,
      id: decodedToken.id,
    };
  }

  async generateRefresh(id: number) {
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 7);

    const token = this.jwt.sign(
      { id: id },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: expiration.getTime(),
      },
    );
    return token;
  }
}
