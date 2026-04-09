import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { AdminImagesController } from './admin-images.controller';

@Module({
  controllers: [AdminImagesController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}
