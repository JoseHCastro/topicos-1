import { Injectable, Logger } from '@nestjs/common';
import { JobData } from '../interceptors/interfaces/job-data.interface';

@Injectable()
export class JobSimulatorService {
  private readonly logger = new Logger(JobSimulatorService.name);

  async executeRequest(jobData: JobData): Promise<any> {
    this.logger.debug(`🔧 Executing request: ${jobData.method} ${jobData.url}`);

    // Route to specific simulation based on URL
    if (jobData.url.includes('/auth/register')) {
      return this.simulateUserRegistration(jobData);
    }

    if (jobData.url.includes('/auth/login')) {
      return this.simulateUserLogin(jobData);
    }

    if (jobData.url.includes('/courses')) {
      return this.simulateCourseQuery(jobData);
    }

    // Generic response for unknown endpoints
    return this.simulateGenericResponse(jobData);
  }

  private async simulateUserRegistration(jobData: JobData): Promise<any> {
    this.logger.log(`👤 Simulating user registration for: ${jobData.data?.email}`);
    await this.delay(1000);

    return {
      success: true,
      message: 'User registered successfully',
      user: {
        id: `user_${Date.now()}`,
        email: jobData.data?.email,
        firstName: jobData.data?.firstName,
        lastName: jobData.data?.lastName,
        role: jobData.data?.role,
        createdAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async simulateUserLogin(jobData: JobData): Promise<any> {
    this.logger.log(`🔐 Simulating user login for: ${jobData.data?.email}`);
    await this.delay(500);

    return {
      success: true,
      message: 'Login successful',
      token: `jwt_token_${Date.now()}`,
      user: {
        email: jobData.data?.email,
        loginAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async simulateCourseQuery(jobData: JobData): Promise<any> {
    this.logger.log(`📚 Simulating course query`);
    await this.delay(200);

    return {
      success: true,
      message: 'Courses retrieved successfully',
      courses: [
        { id: 1, name: 'Matemáticas I', code: 'MAT101' },
        { id: 2, name: 'Programación I', code: 'PRG101' },
        { id: 3, name: 'Base de Datos', code: 'BDD201' },
      ],
      total: 3,
      timestamp: new Date().toISOString(),
    };
  }

  private async simulateGenericResponse(jobData: JobData): Promise<any> {
    await this.delay(100);

    return {
      success: true,
      message: `Request processed successfully: ${jobData.method} ${jobData.url}`,
      timestamp: new Date().toISOString(),
      data: jobData.data || null,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}