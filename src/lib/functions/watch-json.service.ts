import { HTTP } from '@ionic-native/http/ngx';
import { UtilsService } from './utils.service';
import { WatchHtmlService } from './watch-html.service';

const identityCache = new Map();

export class WatchJsonService {
  constructor(public httpClient: HTTP) {
  }

  async getJSONWatchPage(youtubeId: any, options: any, httpClient: any, utilsService: any){
    const url = utilsService.getHTMLWatchURL(youtubeId);
    const ytApi = `${url}&pbj=1`;

    const response = await httpClient.get(ytApi, {}, {
      'x-youtube-client-name': '1',
      'x-youtube-client-version': utilsService.cver,
      'x-youtube-identity-token': identityCache.get('browser') || '',
    });
    const body = response.data;

    const parsedBody = utilsService.parseJSON('watch.json', 'body', body);

    if (parsedBody.reload === 'now') {
     // identityCache.set('browser', false);
      const watchHtmlService = new WatchHtmlService(httpClient);
      const page = await watchHtmlService.getHTMLWatchPageBody(youtubeId, {}, utilsService, httpClient);
      const match = page.match(/(["'])ID_TOKEN\1[:,]\s?"([^"]+)"/);
      if(match){
        identityCache.set('browser', match && match[2]);
      }else{
        identityCache.set('browser', false);
      }
    }

    if (parsedBody.reload === 'now' || !Array.isArray(parsedBody)) {
      throw Error('Unable to retrieve video metadata in watch.json');
    }

    const info = parsedBody.reduce((part, curr) => Object.assign(curr, part), {});
    info.player_response = utilsService.findPlayerResponse('watch.json', info);
    info.html5player = info.player && info.player.assets && info.player.assets.js;

    return info;
  }
}