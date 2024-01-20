import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private prisma: PrismaService) {}

  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 400, description: 'User with same credentials already exists' })
  @ApiResponse({ status: 200, description: 'User successfully registered' })
  @Post('signup')
  async signup(@Body() dto: AuthDto, @Res({ passthrough: true }) res) {
    const data = await this.authService.signup(dto);

    res.cookie('refreshToken', data.refreshToken, {
      httpOnly: true,
    });

    return {
      email: data.email,
      accessToken: data.accessToken,
    };
  }

  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 404, description: 'User with same credentials not found' })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  @ApiResponse({ status: 200, description: 'Login success' })
  @Post('signin')
  async signin(@Body() dto: AuthDto, @Res({ passthrough: true }) res) {
    const data = await this.authService.signin(dto);

    res.cookie('refreshToken', data.refreshToken, {
      httpOnly: true,
    });

    return {
      email: data.email,
      accessToken: data.accessToken,
    };
  }
  @ApiResponse({ status: 401, description: "The refreshToken doesn't provided" })
  @ApiResponse({ status: 200, description: 'Refreshed tokens success' })
  @Get('/refreshToken')
  async refreshToken(@Req() req, @Res({ passthrough: true }) res) {
    const refresh: string = req.cookies['refreshToken'];

    if (!refresh) {
      throw new UnauthorizedException('refreshToken must be provided');
    }

    const { accessToken, id } = await this.authService.generateAccess(refresh);
    const newRefresh = await this.authService.generateRefresh(id);

    const user = await this.prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    res.cookie('refreshToken', newRefresh, {
      httpOnly: true,
    });

    return {
      user: {
        email: user.email,
        id: user.id,
      },
      accessToken: accessToken,
    };
  }

  @ApiResponse({ status: 200, description: 'Logout success' })
  @ApiResponse({ status: 401, description: "refreshToken doesn't provided" })
  @HttpCode(HttpStatus.OK)
  @Get('/logout')
  async logOut(@Res({ passthrough: true }) res, @Req() req) {
    if (!req.cookies['refreshToken']) {
      return new UnauthorizedException();
    }

    res.clearCookie('refreshToken');
    return;
  }
}
