import { HTTP } from '@ionic-native/http/ngx';
const siteCache = new Map();

export class WatchHtmlService {

  constructor(public httpClient: HTTP) {
  }

  async getWatchHTMLPage(id: any, options: any, httpClient: any, utilsService: any){

    const watchHtmlService = new WatchHtmlService(httpClient);

    const body = await watchHtmlService.getHTMLWatchPageBody(id, options, utilsService, httpClient);
    const info = { page: 'watch' };
    try {
     utilsService.cver = utilsService.between(body, '{"key":"cver","value":"', '"}');
      // @ts-ignore
      info.player_response = watchHtmlService.findJSON('watch.html', 'player_response',
        body, /\bytInitialPlayerResponse\s*=\s*\{/i, '</script>', '{', utilsService);
    } catch (err) {

      const args = watchHtmlService.findJSON('watch.html', 'player_response', body, /\bytplayer\.config\s*=\s*{/, '</script>', '{', utilsService);
      // @ts-ignore
      info.player_response = utilsService.findPlayerResponse('watch.html', args);
    }
    try{
        // @ts-ignore
        info.response = watchHtmlService.findJSON('watch.html', 'response', body, /\bytInitialData("\])?\s*=\s*\{/i, '</script>', '{', utilsService);
        // @ts-ignore
        info.html5player = utilsService.getHTML5player(body);
    }catch(e) {

    }

    return info;
  }

  findJSON(source: any, varName: any, body: any, left: any, right: any, prependJSON = '', utilsService: any){
    const jsonStr = utilsService.between(body, left, right);
    if (!jsonStr) {
      throw Error(`Could not find ${varName} in ${source}`);
    }
    return utilsService.parseJSON(source, varName, utilsService.cutAfterJSON(`${prependJSON}${jsonStr}`));
  }

  async getHTMLWatchPageBody(id: any, options: any, utilsService: any, httpClient: any){
    if(siteCache.get(id)){
      return siteCache.get(id)
    }else{
      const url = utilsService.getHTMLWatchURL(id);
      const response = await httpClient.get(url, {}, {});
      siteCache.set(id, response.data);
      return response.data;
    }
  }
}