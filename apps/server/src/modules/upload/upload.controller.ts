import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { diskStorage, type Options } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

function ensureUploadDir() {
  const uploadDir = join(process.cwd(), 'uploads', 'images');
  mkdirSync(uploadDir, { recursive: true });
  return uploadDir;
}

function sanitizeFilename(filename: string) {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

const uploadOptions: Options = {
  storage: diskStorage({
    destination: (_request, _file, callback) => {
      callback(null, ensureUploadDir());
    },
    filename: (_request, file, callback) => {
      const extension =
        extname(file.originalname || '').toLowerCase() || '.jpg';
      const baseName = sanitizeFilename(file.originalname || 'kintrace-image');
      const timestamp = Date.now();
      callback(
        null,
        `${baseName || 'kintrace-image'}-${timestamp}${extension}`,
      );
    },
  }),
  fileFilter: (_request, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new BadRequestException('仅支持图片文件上传'));
      return;
    }

    callback(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadController {
  @Post('images')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  uploadImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的图片');
    }

    return {
      fileName: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      url: `/uploads/images/${file.filename}`,
    };
  }
}
