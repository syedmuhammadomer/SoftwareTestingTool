import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get health check' })
  @ApiResponse({ status: 200, description: 'API is running' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Server health status' })
  health() {
    return {
      status: 'ok',
      timestamp: new Date(),
      uptime: process.uptime(),
    };
  }
}
