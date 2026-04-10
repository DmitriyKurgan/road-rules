import { IsString, Matches, MaxLength } from 'class-validator';

export class UpdateAvatarDto {
  @IsString()
  @MaxLength(500_000) // ~370KB image as base64
  @Matches(/^data:image\/(png|jpeg|jpg|webp|gif);base64,/, {
    message: 'avatarUrl must be a valid image data URL',
  })
  avatarUrl!: string;
}
