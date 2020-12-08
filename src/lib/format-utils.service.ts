import FORMATS from './formats.json';
import { UtilsService } from './functions/utils.service';

const audioEncodingRanks = [
  'mp4a',
  'mp3',
  'vorbis',
  'aac',
  'opus',
  'flac',
];
const videoEncodingRanks = [
  'mp4v',
  'avc1',
  'Sorenson H.283',
  'MPEG-4 Visual',
  'VP8',
  'VP9',
  'H.264',
];


export class FormatUtilsService {

  /**
   * @param {Object} format
   * @returns {Object}
   */
  addFormatMeta(format: any){
    const utilsService = new UtilsService();
    // @ts-ignore
    format = Object.assign({}, FORMATS[format.itag], format);
    format.hasVideo = !!format.qualityLabel;
    format.hasAudio = !!format.audioBitrate;
    format.container = format.mimeType ?
      format.mimeType.split(';')[0].split('/')[1] : null;
    format.codecs = format.mimeType ?
      utilsService.between(format.mimeType, 'codecs="', '"') : null;
    format.videoCodec = format.hasVideo && format.codecs ?
      format.codecs.split(', ')[0] : null;
    format.audioCodec = format.hasAudio && format.codecs ?
      format.codecs.split(', ').slice(-1)[0] : null;
    format.isLive = /\bsource[/=]yt_live_broadcast\b/.test(format.url);
    format.isHLS = /\/manifest\/hls_(variant|playlist)\//.test(format.url);
    format.isDashMPD = /\/manifest\/dash\//.test(format.url);
    return format;
  }

  /**
   * Sort formats by a list of functions.
   *
   * @param {Object} a
   * @param {Object} b
   * @param {Array.<Function>} sortBy
   * @returns {number}
   */
  sortFormatsBy(a: any, b: any, sortBy: any){
    let res = 0;
    for (const fn of sortBy) {
      res = fn(b) - fn(a);
      if (res !== 0) {
        break;
      }
    }
    return res;
  }

  /**
   * Sort formats from highest quality to lowest.
   *
   * @param {Object} a
   * @param {Object} b
   * @returns {number}
   */
  sortFormatsByVideo(a: any, b: any){
    const sortBy = [
      (format: any) => +(format.hasVideo && format.hasAudio),
      (format: any) => {
        return +(format.contentLength > 0);
      },
      (format: any) => {
        // tslint:disable-next-line:radix
        return parseInt(format.qualityLabel);
      },
      (format: any) => {
        return format.bitrate || 0
      },
      (format: any) => {
        return videoEncodingRanks.findIndex(enc => format.codecs && format.codecs.includes(enc));
      },
    ];

    let res = 0;
    for (const fn of sortBy) {
      res = fn(b) - fn(a);
      if (res !== 0) {
        break;
      }
    }
    return res;
  }

  sortFormatsByAudio(a: any, b: any){
    const sortBy = [
      (format: any) => {
        return +(format.contentLength > 0);
      },
      (format: any) => +(!format.hasVideo && format.hasAudio),
      (format: any) => {
        // tslint:disable-next-line:radix
        return parseInt(format.qualityLabel);
      },
      (format: any) => {
        return format.audioBitrate || 0
      },
      (format: any) => {
        return audioEncodingRanks.findIndex(enc => format.codecs && format.codecs.includes(enc));
      },
    ];

    let res = 0;
    for (const fn of sortBy) {
      res = fn(b) - fn(a);
      if (res !== 0) {
        break;
      }
    }
    return res;
  }
}