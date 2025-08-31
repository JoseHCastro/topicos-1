import { Controller, Get, Res, Param } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('queue-demo')
export class StaticController {
  @Get()
  async getDemoPage(@Res() res: Response) {
    try {
      const htmlPath = path.join(process.cwd(), 'public', 'queue-demo.html');
      const html = fs.readFileSync(htmlPath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      res.status(404).send('Demo page not found');
    }
  }

  @Get('load-test')
  async getLoadTestDemo(@Res() res: Response) {
    try {
      const htmlPath = path.join(
        process.cwd(),
        'public',
        'load-test-demo.html',
      );
      const html = fs.readFileSync(htmlPath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      res.status(404).send('Load test demo not found');
    }
  }

  @Get('client.js')
  async getClient(@Res() res: Response) {
    try {
      const jsPath = path.join(process.cwd(), 'public', 'queue-client.js');
      const js = fs.readFileSync(jsPath, 'utf8');
      res.setHeader('Content-Type', 'application/javascript');
      res.send(js);
    } catch (error) {
      res.status(404).send('Client not found');
    }
  }

  @Get('favicon.ico')
  async getFavicon(@Res() res: Response) {
    // Simple 1x1 transparent PNG para evitar error 404
    const transparentPixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64',
    );
    res.setHeader('Content-Type', 'image/png');
    res.send(transparentPixel);
  }

  @Get(':filename')
  async getStaticFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      const filePath = path.join(process.cwd(), 'public', filename);

      // Validar que el archivo existe y está en el directorio public
      if (
        !fs.existsSync(filePath) ||
        !filePath.startsWith(path.join(process.cwd(), 'public'))
      ) {
        return res.status(404).send('File not found');
      }

      const fileContent = fs.readFileSync(filePath);

      // Determinar content-type basado en extensión
      let contentType = 'text/plain';
      if (filename.endsWith('.js')) {
        contentType = 'application/javascript';
      } else if (filename.endsWith('.html')) {
        contentType = 'text/html';
      } else if (filename.endsWith('.css')) {
        contentType = 'text/css';
      }

      res.setHeader('Content-Type', contentType);
      res.send(fileContent);
    } catch (error) {
      res.status(404).send('File not found');
    }
  }
}
