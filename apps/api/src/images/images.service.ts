import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TicketImageRole } from '@prisma/client';
import axios from 'axios';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

const ALLOWED_LICENSES = [
  'cc0',
  'cc-zero',
  'public domain',
  'pd',
  'cc-by',
  'cc-by-sa',
  'cc-by-4.0',
  'cc-by-sa-4.0',
  'cc-by-3.0',
  'cc-by-sa-3.0',
];

export interface WikimediaCandidate {
  pageUrl: string;
  fileUrl: string;
  title: string;
  author: string;
  license: string;
  width: number;
  height: number;
  attributionHtml: string;
}

@Injectable()
export class ImagesService {
  private uploadsDir: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.uploadsDir = path.resolve(
      this.config.get<string>('UPLOADS_DIR', 'uploads/images'),
    );
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async searchWikimedia(query: string): Promise<WikimediaCandidate[]> {
    const resp = await axios.get('https://commons.wikimedia.org/w/api.php', {
      params: {
        action: 'query',
        format: 'json',
        generator: 'search',
        gsrsearch: query,
        gsrnamespace: 6,
        gsrlimit: 10,
        prop: 'imageinfo',
        iiprop: 'url|extmetadata|size',
        origin: '*',
      },
      timeout: 30000,
      headers: {
        'User-Agent':
          'RoadRulesTrainer/1.0 (https://github.com/road-rules; admin@road-rules.local)',
      },
    });

    const pages = resp.data?.query?.pages;
    if (!pages) return [];

    const candidates: WikimediaCandidate[] = [];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const pageList: any[] = Object.values(pages);

    for (const page of pageList) {
      const info = page.imageinfo?.[0];
      if (!info) continue;

      const ext = info.extmetadata || {};
      const licenseRaw = ext.LicenseShortName?.value || '';
      const author = ext.Artist?.value?.replace(/<[^>]+>/g, '') || 'Unknown';
      const title = page.title?.replace('File:', '') || '';

      // Filter by allowed licenses
      const licenseNorm = licenseRaw.toLowerCase();
      const isAllowed = ALLOWED_LICENSES.some((l) => licenseNorm.includes(l));
      if (!isAllowed) continue;

      // Filter out non-image files (PDFs, DjVu, etc.)
      const titleLower = title.toLowerCase();
      if (
        titleLower.endsWith('.pdf') ||
        titleLower.endsWith('.djvu') ||
        titleLower.endsWith('.ogg') ||
        titleLower.endsWith('.ogv') ||
        titleLower.endsWith('.webm') ||
        titleLower.endsWith('.mp3') ||
        titleLower.endsWith('.wav')
      )
        continue;

      const pageUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title as string)}`;
      const attribution = `${title} by ${author}, ${licenseRaw}, via Wikimedia Commons`;

      candidates.push({
        pageUrl,
        fileUrl: info.url,
        title,
        author,
        license: licenseRaw,
        width: info.width,
        height: info.height,
        attributionHtml: attribution,
      });
    }

    return candidates;
  }

  async attachImage(
    ticketId: string,
    imageData: {
      sourceUrl: string;
      license: string;
      author: string;
      title: string;
      attributionHtml: string;
      role?: TicketImageRole;
    },
  ) {
    // Verify ticket exists
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    // Download image
    const imageResp = await axios.get(imageData.sourceUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent':
          'RoadRulesTrainer/1.0 (https://github.com/road-rules; admin@road-rules.local)',
      },
    });
    const buffer = Buffer.from(imageResp.data);

    // Compute sha256
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    // Check for duplicate
    const existing = await this.prisma.imageAsset.findUnique({
      where: { sha256 },
    });

    let imageAsset;
    if (existing) {
      imageAsset = existing;
    } else {
      // Determine file extension from content type or URL
      const contentType = imageResp.headers['content-type'] || '';
      let ext = 'bin';
      if (contentType.includes('svg')) ext = 'svg';
      else if (contentType.includes('png')) ext = 'png';
      else if (contentType.includes('jpeg') || contentType.includes('jpg'))
        ext = 'jpg';
      else if (contentType.includes('webp')) ext = 'webp';

      const storedKey = `${sha256}.${ext}`;
      const filePath = path.join(this.uploadsDir, storedKey);

      // Save file
      fs.writeFileSync(filePath, buffer);

      // Create ImageAsset record
      imageAsset = await this.prisma.imageAsset.create({
        data: {
          sourceUrl: imageData.sourceUrl,
          storedKey,
          license: imageData.license,
          author: imageData.author,
          title: imageData.title,
          attributionHtml: imageData.attributionHtml,
          sha256,
          width: null,
          height: null,
        },
      });
    }

    // Check if ticket already has an image with this role
    const role = imageData.role || TicketImageRole.PRIMARY;
    const existingLink = await this.prisma.ticketImage.findUnique({
      where: { ticketId_role: { ticketId, role } },
    });

    if (existingLink) {
      // Update existing link
      await this.prisma.ticketImage.update({
        where: { id: existingLink.id },
        data: { imageId: imageAsset.id },
      });
    } else {
      // Create new link
      await this.prisma.ticketImage.create({
        data: {
          ticketId,
          imageId: imageAsset.id,
          role,
        },
      });
    }

    return {
      imageId: imageAsset.id,
      storedKey: imageAsset.storedKey,
      sha256: imageAsset.sha256,
      license: imageAsset.license,
      attributionHtml: imageAsset.attributionHtml,
    };
  }
}
