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
import { AuthService } from './auth.service';
import { AuthDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
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

  @Get('/refreshToken')
  async refreshToken(@Req() req, @Res({ passthrough: true }) res) {
    const refresh: string = req.cookies['refreshToken'];

    if (!refresh) {
      throw new UnauthorizedException('refreshToken must be provided');
    }

    const { accessToken, id } = await this.authService.generateAccess(refresh);
    const newRefresh = await this.authService.generateRefresh(id);

    res.cookie('refreshToken', newRefresh, {
      httpOnly: true,
    });

    return {
      accessToken: accessToken,
    };
  }

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
