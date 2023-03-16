import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import * as bcyptjs from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Request, response, Response } from 'express';
import { TokenService } from './token.service';
import { MoreThanOrEqual } from 'typeorm';

@Controller()
export class UserController {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private tokenService: TokenService,
  ) {}

  @Post('register')
  async register(@Body() body: any) {
    if (body.password !== body.password_confirm) {
      throw new BadRequestException('passwords do not match!');
    }
    return this.userService.save({
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      password: await bcyptjs.hash(body.password, 12),
    });
  }

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.userService.findOne({ email });
    if (!user) {
      throw new UnauthorizedException(' invalid credentials');
    }
    if (!(await bcyptjs.compare(password, user.password))) {
      throw new BadRequestException('password or email is incorrect');
    }

    const accessToken = await this.jwtService.sign(
      {
        id: user.id,
      },
      { expiresIn: '60s' },
    );

    const refreshToken = await this.jwtService.sign({
      id: user.id,
    });

    const expired_at = new Date();
    expired_at.setDate(expired_at.getDate() + 7);

    await this.tokenService.save({
      user_id: user.id,
      token: refreshToken,
      expired_at: expired_at,
    });
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1week
    });
    return {
      token: accessToken,
    };
  }

  @Get('user')
  async user(@Req() request: Request) {
    try {
      const accessToken = request.headers.authorization.replace('Bearer ', '');

      const { id } = await this.jwtService.verifyAsync(accessToken);
      const { password, ...data } = await this.userService.findOne({ id });
      return data;
    } catch (error) {
      throw new UnauthorizedException('');
    }
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const refresh_token = request.cookies['refresh_token'];
        console.log(refresh_token);
        
      const { id } = await this.jwtService.verifyAsync(refresh_token);

      const tokenEntity = await this.tokenService.findOne({
        user_id: id,
        expired_at: MoreThanOrEqual(new Date()),
      });

      if (!tokenEntity) {
        throw new UnauthorizedException();
      }

     
      return { tokenEntity };
      return refresh_token;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {

    await this.tokenService.delete({token: request.cookies['refresh_token']})
    response.clearCookie('refresh_token');
    return {
      meesage: 'success',
    };
  }
}
