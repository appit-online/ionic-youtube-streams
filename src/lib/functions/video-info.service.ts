import { HTTP } from '@ionic-native/http/ngx';
import { UtilsService } from './utils.service';
import * as urllib from 'url';
import * as querystring from 'querystring';

const VIDEO_EURL = 'https://youtube.googleapis.com/v/';
const INFO_HOST = 'www.youtube.com';
const INFO_PATH = '/get_video_info';

export class VideoInfoService {

  constructor(public httpClient: HTTP) {
  }

  async getVideoInfoPage(id: any, options: any){
    const utilsService = new UtilsService();
    const url = urllib.format({
      protocol: 'https',
      host: INFO_HOST,
      pathname: INFO_PATH,
      query: {
        video_id: id,
        eurl: VIDEO_EURL + id,
        ps: 'default',
        gl: 'US',
        hl: 'en',
      },
    });

    const response = await this.httpClient.get(url, {}, {});
    const moreinfo: any = querystring.parse(response.data);
    moreinfo.player_response = utilsService.findPlayerResponse('get_video_info', moreinfo);
    return moreinfo;
  }

}