import * as urllib from 'url';
import {BasicInfoService} from './basic-info.service';
import {CiphService} from './cip.service';
import {HTTP} from '@ionic-native/http/ngx';
import { UtilsService } from './functions/utils.service';
import { WatchHtmlService } from './functions/watch-html.service';
import { FormatUtilsService } from './format-utils.service';

export async function searchVideo(this: any, youtubeId: string, sortType: string) {
  const httpClient = new HTTP();
  const options = {};
  const basicInfoService = new BasicInfoService(httpClient);
  const info = await basicInfoService.getBasicInfo(youtubeId, {});

/*  const hasManifest =
    info.player_response && info.player_response.streamingData && (
      info.player_response.streamingData.dashManifestUrl ||
      info.player_response.streamingData.hlsManifestUrl
    );*/

  const funcs = [];
  if (info.formats.length) {
    const utilsService = new UtilsService();
    const watchHtmlService = new WatchHtmlService(httpClient);

    info.html5player = info.html5player || utilsService.getHTML5player(await watchHtmlService.getHTMLWatchPageBody(youtubeId, options, utilsService, httpClient));
    if (!info.html5player) {
      throw Error('Unable to find html5player file');
    }
    const html5player = urllib.resolve(utilsService.VIDEO_URL, info.html5player);
    const ciphService = new CiphService(httpClient);
    funcs.push(await ciphService.decipherFormats(info.formats, html5player, options));
  }

  /*if (hasManifest && info.player_response.streamingData.dashManifestUrl) {
    const url = info.player_response.streamingData.dashManifestUrl;
    funcs.push(getDashManifest(url, options));
  }

  if (hasManifest && info.player_response.streamingData.hlsManifestUrl) {
    let url = info.player_response.streamingData.hlsManifestUrl;
    funcs.push(getM3U8(url, options));
  }*/

  const formatUtils = new FormatUtilsService();
  const results = await Promise.all(funcs);
  info.formats = Object.values(Object.assign({}, ...results));
  info.formats = info.formats.map(formatUtils.addFormatMeta);

  if(sortType === 'video'){
    try{
      info.formats.sort(formatUtils.sortFormatsByVideo);
    }catch (e){
      // tslint:disable-next-line:no-console
      console.log(e);
    }
  }else{
    try{
      info.formats.sort(formatUtils.sortFormatsByAudio);
    }catch (e){
      // tslint:disable-next-line:no-console
      console.log(e);
    }
  }
  info.full = true;

  return info;
}
