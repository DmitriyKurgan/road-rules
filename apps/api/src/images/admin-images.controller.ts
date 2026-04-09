import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ResolveImageDto } from './dto/resolve-image.dto';
import { AttachImageDto } from './dto/attach-image.dto';
import { RolesGuard, Roles } from '../common/guards/roles.guard';

@Controller('admin/images')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class AdminImagesController {
  constructor(private imagesService: ImagesService) {}

  @Post('resolve')
  resolve(@Body() dto: ResolveImageDto) {
    return this.imagesService.searchWikimedia(dto.query);
  }

  @Post('attach')
  attach(@Body() dto: AttachImageDto) {
    return this.imagesService.attachImage(dto.ticketId, {
      sourceUrl: dto.sourceUrl,
      license: dto.license,
      author: dto.author,
      title: dto.title,
      attributionHtml: dto.attributionHtml,
      role: dto.role,
    });
  }
}
